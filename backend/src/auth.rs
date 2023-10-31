use crate::{
    entity::{user, user_token},
    error::ServerError,
    folder::{STORAGE, USERS_DIR},
    state::{AppState, Token, UserType},
};
use std::path::PathBuf;

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
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, ModelTrait, QueryFilter, Set,
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
        Params::new(5, 2, 1, 32).unwrap_or_log()
    }
    // During release, follow the recommended parameters to sufficiently slow
    // down logins.
    #[cfg(not(debug_assertions))]
    {
        Params::default()
    }
}

async fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let password_hash: String = Scrypt
        .hash_password_customized(
            password.as_bytes(),
            None,
            None,
            scrypt_params(),
            Salt::try_from(&salt)?,
        )?
        .to_string();
    Ok(password_hash)
}

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
    db: &DatabaseConnection,
) -> anyhow::Result<()> {
    validate_username(username)?;
    let password_hash = hash_password(password).await?;
    let user = user::ActiveModel {
        id: Set(nanoid!()),
        username: Set(username.to_owned()),
        password_hash: Set(password_hash),
        user_type: match user_type {
            UserType::User => Set("U".to_owned()),
            UserType::Admin => Set("A".to_owned()),
        },
    };
    user.insert(db).await?;

    Ok(())
}

pub async fn create_user_folder(username: &str) -> anyhow::Result<()> {
    let path = PathBuf::from(STORAGE).join(username);
    fs::create_dir_all(path).await?;

    Ok(())
}

pub async fn delete_user(
    db: &DatabaseConnection,
    username: &str,
    delete_files: bool,
) -> anyhow::Result<()> {
    let user = user::Entity::find()
        .filter(user::Column::Username.eq(username))
        .one(db)
        .await?
        .unwrap_or_log();
    user.delete(db).await?;

    if delete_files {
        let store = PathBuf::from(STORAGE).join(username);
        fs::remove_dir_all(store).await?;
    }
    Ok(())
}

/// Creates a "nobody" user which is used to resist user probing
pub async fn create_nobody(db: &DatabaseConnection) -> anyhow::Result<()> {
    let existing = user::Entity::find()
        .filter(user::Column::Username.eq(USER_NOBODY))
        .one(db)
        .await?;
    if existing.is_none() {
        add_new_user(USER_NOBODY, &nanoid!(), UserType::User, db).await?;
    }

    Ok(())
}

#[tracing::instrument]
pub async fn verify_pass(
    username: &str,
    password_input: &Password,
    db: &DatabaseConnection,
) -> Result<()> {
    let user = match user::Entity::find()
        .filter(user::Column::Username.eq(username))
        .one(db)
        .await?
    {
        Some(data) => data,
        None => user::Entity::find()
            .filter(user::Column::Username.eq(format!("{USER_NOBODY}")))
            .one(db)
            .await?
            .unwrap_or_log(),
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
        actix_web::http::StatusCode::UNAUTHORIZED
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponseBuilder::new(self.status_code()).json(self)
    }
}

// Makes an of access token.
#[instrument(skip(state))]
pub async fn make_token(state: &web::Data<AppState>, username: &str) -> anyhow::Result<Token> {
    // generate and save token
    let access_token = Token::new();

    let user_id = user::Entity::find()
        .filter(user::Column::Username.eq(username))
        .one(&state.db)
        .await?
        .unwrap_or_log()
        .id;

    let existing_token = user_token::Entity::find()
        .filter(user_token::Column::Token.eq(access_token.reveal()))
        .one(&state.db)
        .await?;

    assert!(
        existing_token.is_none(),
        "Extremely rare token collision! You're the one-in-a-trillion unlucky, or there's something wrong with the random number generator."
    );

    let user_token = user_token::ActiveModel {
        token: Set(access_token.reveal().to_string()),
        user_id: Set(user_id),
        created_at: Set(chrono::Utc::now().to_rfc3339()),
    };
    user_token.insert(&state.db).await?;

    Ok(access_token)
}

#[post("/login")]
#[instrument(skip(data, state))]
pub async fn login(
    data: web::Json<Login>,
    state: web::Data<AppState>,
) -> Result<web::Json<LoginResponse>, LoginFailed> {
    if verify_pass(&data.username, &data.password, &state.db)
        .await
        .is_ok()
    {
        let access_token = make_token(&state, &data.username).await.unwrap_or_log();

        return Ok(web::Json(LoginResponse { access_token }));
    }
    Err(LoginFailed)
}
