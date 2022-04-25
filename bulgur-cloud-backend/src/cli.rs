use std::path::PathBuf;

use rpassword::prompt_password;

use structopt::StructOpt;
use tokio::fs;

use crate::{
    auth::{create_user, create_user_folder, UserType},
    folder::{STORAGE, USERS_DIR},
};

#[derive(StructOpt)]
/// Add a new user to the server. Users can edit surveys and view survey results. Surveyees don't need to be users.
pub struct UserAdd {
    #[structopt(short, long)]
    username: String,

    #[structopt(long, name = "type")]
    user_type: Option<UserType>,
}

#[derive(StructOpt)]
/// Remove a user.
pub struct UserRemove {
    #[structopt(short, long)]
    username: String,
    #[structopt(name = "delete-files", long)]
    /// Delete the store for this user. Files will be removed, and may be irrecoverable.
    delete_files: bool,
}

#[derive(StructOpt)]
/// Manage users, who can edit the survey and view results.
pub enum User {
    #[structopt(name = "add")]
    UserAdd(UserAdd),
    #[structopt(name = "remove")]
    UserRemove(UserRemove),
}

#[derive(StructOpt)]
pub enum Commands {
    User(User),
}

#[derive(StructOpt)]
/// The CLI options for the image-survey backend.
pub struct Opt {
    #[structopt(subcommand)]
    pub command: Option<Commands>,
}

pub async fn cli_command(command: Commands) -> anyhow::Result<()> {
    match command {
        Commands::User(user) => match user {
            User::UserAdd(add) => {
                let password = prompt_password("Enter the password for this user: ")?;
                create_user(&add.username, &password, add.user_type.unwrap_or_default()).await?;
                create_user_folder(&add.username).await?;
                Ok(())
            }
            User::UserRemove(remove) => {
                let path = PathBuf::from(USERS_DIR).join(format!("{}.toml", &remove.username));
                fs::remove_file(path).await?;
                if remove.delete_files {
                    let store = PathBuf::from(STORAGE).join(&remove.username);
                    fs::remove_dir_all(store).await?;
                }
                Ok(())
            }
        },
    }
}
