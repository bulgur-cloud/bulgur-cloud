use crate::{
    error::{CLIError, ServerError},
    folder::{STORAGE, USERS_DIR},
    kv::{
        kv::BKVTable,
        table::{TABLE_REFRESH_TOKENS, TABLE_USERS},
    },
    state::{self, AppState, Token},
};
use std::{path::PathBuf, str::FromStr};

use actix_web::{http, post, web, HttpResponse, HttpResponseBuilder};
use anyhow::Result;
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

#[derive(Serialize, Deserialize)]
/// The user data stored in files
pub struct UserData {
    pub username: String,
    pub password_hash: String,
    pub user_type: UserType,
}

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

async fn create_user_string(
    username: &str,
    password: &str,
    user_type: UserType,
) -> anyhow::Result<String> {
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
    let user = UserData {
        username: username.to_string(),
        password_hash,
        user_type,
    };
    Ok(toml::to_string(&user)?)
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

pub async fn create_user(
    username: &str,
    password: &str,
    user_type: UserType,
    kv: &mut BKVTable,
) -> anyhow::Result<()> {
    validate_username(username)?;
    let data = create_user_string(username, password, user_type).await?;
    let key = format!("{username}.toml");
    kv.put(key.as_str(), data.as_str()).await;
    Ok(())
}

pub async fn create_user_folder(username: &str) -> anyhow::Result<()> {
    let path = PathBuf::from(STORAGE).join(username);
    fs::create_dir_all(path).await?;

    Ok(())
}

/// Creates a "nobody" user which is used to resist user probing
pub async fn create_nobody(kv: &mut BKVTable) -> anyhow::Result<()> {
    let password = nanoid!();
    let data = create_user_string(USER_NOBODY, &password, UserType::default()).await?;
    let full_data = format!("{NOBODY_USER_COMMENT}\n{data}");
    let key = format!("{USER_NOBODY}.toml");
    kv.put(key.as_str(), full_data.as_str()).await;
    Ok(())
}

#[tracing::instrument]
pub async fn verify_pass(
    username: &str,
    password_input: &Password,
    kv: &mut BKVTable,
) -> Result<()> {
    let key = format!("{username}.toml");
    let contents = match kv.get(key.as_str()).await {
        Some(data) => data,
        None => {
            let key = format!("{USER_NOBODY}.toml");
            kv.get(key.as_str()).await.unwrap_or_log()
        }
    };

    let user: UserData = toml::from_slice(contents.as_bytes()).map_err(|error| {
        tracing::error!("Failed to parse user file {username}, {:?}", error);
        error
    })?;
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

#[derive(Debug, Serialize, Deserialize)]
/// Type of user. Admins can add and remove users.
pub enum UserType {
    User,
    Admin,
}

impl Default for UserType {
    fn default() -> Self {
        UserType::User
    }
}

impl FromStr for UserType {
    type Err = CLIError;

    fn from_str(from: &str) -> Result<Self, Self::Err> {
        let from_lower = from.to_lowercase();
        match from_lower.as_str() {
            "user" => Ok(UserType::User),
            "admin" => Ok(UserType::Admin),
            s => Err(CLIError::BadUserType(s.to_string())),
        }
    }
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

pub const TOKEN_VALID_SECS: u64 = 60 * 60 * 24;

#[derive(Serialize, Deserialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct LoginResponse {
    pub access_token: Token,
    pub refresh_token: Token,
    valid_for_seconds: u64,
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

#[post("/login")]
#[instrument(skip(data, state))]
pub async fn login(
    data: web::Json<Login>,
    state: web::Data<AppState>,
) -> Result<web::Json<LoginResponse>, LoginFailed> {
    if verify_pass(
        &data.username,
        &data.password,
        &mut state.kv.open(TABLE_USERS).await,
    )
    .await
    .is_ok()
    {
        let mut cache = state.token_cache.0.write().await;
        // generate and cache token
        let access_token = Token::new();
        // Impossibly unlikely, but token collisions would be extremely bad so check it anyway
        assert!(!cache.contains_key(&access_token));
        cache.insert(access_token.clone(), state::User(data.username.clone()));
        drop(cache);

        // Save the refresh token
        let refresh_token = Token::new();
        state
            .kv
            .open(TABLE_REFRESH_TOKENS)
            .await
            .put(refresh_token.clone().reveal().as_str(), &data.username)
            .await;

        return Ok(web::Json(LoginResponse {
            access_token,
            refresh_token,
            valid_for_seconds: TOKEN_VALID_SECS,
        }));
    }
    Err(LoginFailed)
}

#[derive(Debug, Deserialize, Serialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct Refresh {
    pub username: String,
    pub refresh_token: String,
}

#[post("/refresh")]
#[instrument(skip(data, state))]
pub async fn refresh(
    data: web::Json<Refresh>,
    state: web::Data<AppState>,
) -> Result<web::Json<LoginResponse>, LoginFailed> {
    let value = state
        .kv
        .open(TABLE_REFRESH_TOKENS)
        .await
        .get(data.refresh_token.as_str())
        .await;
    match value {
        None => Err(LoginFailed),
        Some(username) => {
            if username.eq(data.username.as_str()) {
                let mut cache = state.token_cache.0.write().await;
                // generate and cache token
                let access_token = Token::new();
                // Impossibly unlikely, but token collisions would be extremely bad so check it anyway
                assert!(!cache.contains_key(&access_token));
                cache.insert(access_token.clone(), state::User(data.username.clone()));
                drop(cache);

                Ok(web::Json(LoginResponse {
                    access_token,
                    refresh_token: Token::read(data.refresh_token.as_str()),
                    valid_for_seconds: TOKEN_VALID_SECS,
                }))
            } else {
                Err(LoginFailed)
            }
        }
    }
}
