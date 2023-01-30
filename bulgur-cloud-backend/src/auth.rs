use crate::{
    error::ServerError,
    folder::{STORAGE, USERS_DIR},
    state::{self, AppState, Token, UserData, UserType},
};
use std::path::PathBuf;

use actix_web::{http, post, web, HttpResponse, HttpResponseBuilder};
use anyhow::Result;
use cuttlestore::Cuttlestore;
use nanoid::nanoid;
use sanitize_filename::is_sanitized_with_options;
use scrypt::{
    password_hash::{
        rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, Salt, SaltString,
    },
    Params, Scrypt,
};
use tracing_unwrap::{OptionExt, ResultExt};

#[cfg(feature = "generate_types")]
use typescript_type_def::TypeDef;

use serde::{Deserialize, Serialize};
use tokio::fs;
use tracing::instrument;

pub fn path_user_file(username: &str) -> PathBuf {
    PathBuf::from(USERS_DIR)
        .join(username)
        .with_extension("toml")
}

fn scrypt_params() -> Params {
    // During debugging, use insecure parameters to speed up logins. Because
    // without optimizations logins can take 3+ seconds each.
    #[cfg(debug_assertions)]
    {
        Params::new(5, 2, 1).unwrap_or_log()
    }
    // During release, follow the recommended parameters to sufficiently slow
    // down logins.
    #[cfg(not(debug_assertions))]
    {
        Params::default()
    }
}

async fn create_user(
    username: &str,
    password: &str,
    user_type: UserType,
) -> anyhow::Result<UserData> {
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Scrypt
        .hash_password_customized(
            password.as_bytes(),
            None,
            None,
            scrypt_params(),
            Salt::try_from(&salt)?,
        )?
        .to_string();
    Ok(UserData {
        username: username.to_string(),
        password_hash,
        user_type,
    })
}

const NOBODY_USER_COMMENT: &str = "#
# DO NOT DELETE THIS FILE!
#
# This user is a placeholder that is used to resist user probing.
# If anyone tries to log in as a user that doesn't exist, it will
# be mapped to this user instead. This user has a randomly generated
# password that is impossible to guess, so all login attempts will fail.
#
# Without this user, an attacker could probe the users on this server
# by trying to log in. If the login attempt takes very little time,
# it means the user doesn't exist. if the login attempt takes longer,
# it means they hit a real user. Thanks to the nobody user, the attempts
# for users that don't exist take just as long, making probing harder.
#
";
const USER_NOBODY: &str = "nobody";

#[derive(thiserror::Error, Debug)]
pub enum BadUsername {
    #[error("You can't use {username} as a username. Try to avoid special characters.")]
    UsernameNotAllowed { username: String },
}

pub fn validate_username(username: &str) -> Result<(), BadUsername> {
    if is_sanitized_with_options(username, Default::default()) {
        Ok(())
    } else {
        Err(BadUsername::UsernameNotAllowed {
            username: username.to_string(),
        })
    }
}

pub async fn add_new_user(
    username: &str,
    password: &str,
    user_type: UserType,
    kv: &Cuttlestore<UserData>,
) -> anyhow::Result<()> {
    validate_username(username)?;
    let data = create_user(username, password, user_type).await?;
    kv.put(username, &data).await?;
    Ok(())
}

pub async fn create_user_folder(username: &str) -> anyhow::Result<()> {
    let path = PathBuf::from(STORAGE).join(username);
    fs::create_dir_all(path).await?;

    Ok(())
}

/// Creates a "nobody" user which is used to resist user probing
pub async fn create_nobody(kv: &Cuttlestore<UserData>) -> anyhow::Result<()> {
    add_new_user(USER_NOBODY, &nanoid!(), UserType::User, kv).await?;
    Ok(())
}

#[tracing::instrument]
pub async fn verify_pass(
    username: &str,
    password_input: &Password,
    kv: &Cuttlestore<UserData>,
) -> Result<()> {
    let user = match kv.get(username).await? {
        Some(data) => data,
        None => {
            let key = format!("{USER_NOBODY}.toml");
            kv.get(USER_NOBODY).await?.unwrap_or_log()
        }
    };

    if user.username != username && user.username != USER_NOBODY {
        tracing::error!(
            "File {username} is for user {:?} but it should be for user {username}",
            user.username
        );
        return Err(ServerError::BadUserData {
            expected_user: username.to_string(),
            user: user.username.to_string(),
        }
        .into());
    }

    let password_input_clone = password_input.0.clone();
    web::block(move || -> anyhow::Result<()> {
        let password_in_file = PasswordHash::new(&user.password_hash)?;
        Ok(Scrypt.verify_password(password_input_clone.as_bytes(), &password_in_file)?)
    })
    .await??;

    Ok(())
}

#[derive(
    Serialize,
    Deserialize,
    PartialEq,
    PartialOrd,
    Eq,
    Ord,
    Clone,
    simple_secrecy::Debug,
    simple_secrecy::Display,
)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct Password(pub String);

#[derive(Debug, Deserialize, Serialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct Login {
    pub username: String,
    pub password: Password,
}

#[derive(Serialize, Deserialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct LoginResponse {
    pub access_token: Token,
}

#[derive(Debug, derive_more::Display, thiserror::Error)]
#[display(fmt = "Login failed, incorrect username or password.")]
pub struct LoginFailed;

impl Serialize for LoginFailed {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = format!("{}", self);
        serializer.serialize_str(&s)
    }
}

impl actix_web::error::ResponseError for LoginFailed {
    fn status_code(&self) -> http::StatusCode {
        actix_web::http::StatusCode::BAD_REQUEST
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponseBuilder::new(self.status_code()).json(&self)
    }
}

// Makes an of access token.
#[instrument(skip(state))]
pub async fn make_token(state: &web::Data<AppState>, username: &str) -> anyhow::Result<Token> {
    // generate and save token
    let access_token = Token::new();
    // Impossibly unlikely, but token collisions would be extremely bad so check it anyway
    assert!(!state
        .access_tokens
        .get(access_token.reveal())
        .await?
        .is_some());
    state
        .access_tokens
        .put(
            access_token.reveal(),
            &state::Username(username.to_string()),
        )
        .await?;

    Ok(access_token)
}

#[post("/login")]
#[instrument(skip(data, state))]
pub async fn login(
    data: web::Json<Login>,
    state: web::Data<AppState>,
) -> Result<web::Json<LoginResponse>, LoginFailed> {
    if verify_pass(&data.username, &data.password, &state.users)
        .await
        .is_ok()
    {
        let access_token = make_token(&state, &data.username).await.unwrap_or_log();

        return Ok(web::Json(LoginResponse { access_token }));
    }
    Err(LoginFailed)
}
