use std::fmt::Debug;

#[derive(thiserror::Error, Debug)]
pub enum CLIError {
    #[error("Bad user type, should be user or admin")]
    BadUserType(String),
}

#[derive(thiserror::Error, Debug)]
pub enum ServerError {
    #[error("The user data has been modified or corrupted")]
    BadUserData { user: String, expected_user: String },
}
