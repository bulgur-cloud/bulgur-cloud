use std::str::FromStr;

use cuttlestore::Cuttlestore;
use nanoid::nanoid;
use serde::{Deserialize, Serialize};

use simple_secrecy;

#[cfg(feature = "generate_types")]
use typescript_type_def::TypeDef;

use crate::error::CLIError;

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
pub struct Token(String);

impl Token {
    pub fn read(s: &str) -> Token {
        Token(s.to_string())
    }

    pub fn new() -> Token {
        Token(nanoid!())
    }

    /// Drop the token, and reveal the secret inside.
    pub fn reveal(&self) -> &str {
        self.0.as_str()
    }

    pub fn unwrap(self) -> String {
        self.0
    }
}

impl Default for Token {
    fn default() -> Self {
        Token::new()
    }
}

#[derive(Serialize, Deserialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct PathTokenResponse {
    pub token: Token,
}

#[derive(std::fmt::Debug, Serialize, Deserialize, derive_more::Display, Clone)]
pub struct Username(pub String);

#[derive(Debug)]
pub struct AppState {
    pub started_at: chrono::DateTime<chrono::Local>,
    /// User data
    pub users: Cuttlestore<UserData>,
    /// Maps access tokens to users
    pub access_tokens: Cuttlestore<Username>,
    /// Maps file paths to access tokens
    pub path_tokens: Cuttlestore<Token>,
}

#[derive(Clone, simple_secrecy::Debug, simple_secrecy::Display)]
pub enum Authorized {
    User(Username),
    Path,
    Both(Username),
}

#[derive(Debug, Serialize, Deserialize)]
/// The user data stored in files
pub struct UserData {
    pub username: String,
    pub password_hash: String,
    pub user_type: UserType,
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
