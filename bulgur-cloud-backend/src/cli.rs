use std::{env, path::PathBuf};

use cuttlestore::CuttlestoreBuilder;
use rpassword::prompt_password;

use clap::{Parser, Subcommand};
use tokio::fs;

use crate::{
    auth::{add_new_user, create_user_folder, validate_username},
    folder::STORAGE,
    server::setup_app_deps,
    state::UserType,
};

#[derive(Parser, Debug)]
/// Add a new user to the server. Users can edit surveys and view survey results. Surveyees don't need to be users.
pub struct UserAdd {
    #[clap(short, long)]
    pub username: String,

    #[clap(long)]
    /// Avoid using this, because the password may be saved in bash history.
    /// Instead, run the command and let it prompt for the password.
    pub password: Option<String>,

    #[clap(long, name = "type", default_value = "user")]
    pub user_type: UserType,
}

#[derive(Parser, Debug)]
/// Remove a user.
pub struct UserRemove {
    #[clap(short, long)]
    pub username: String,
    #[clap(name = "delete-files", long)]
    /// Delete the store for this user. Files will be removed, and may be irrecoverable.
    pub delete_files: bool,
}

#[derive(Subcommand, Debug)]
/// Manage users, who can edit the survey and view results.
pub enum User {
    #[clap(name = "add")]
    UserAdd(UserAdd),
    #[clap(name = "remove")]
    UserRemove(UserRemove),
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    #[clap(subcommand)]
    User(User),
}

#[derive(Parser)]
#[clap(name = "bulgur-cloud", author, version, about)]
/// The CLI options for the image-survey backend.
pub struct Opt {
    #[clap(subcommand)]
    pub command: Option<Commands>,

    #[clap(long, default_value = "0.0.0.0:8000")]
    /// The IP address and port to bind to, in the form of `IP:port`.
    /// By default this is set to `0.0.0.0:8000` which will bind to all interfaces on port 8000.
    pub bind: String,

    #[clap(long, default_value = "sqlite://data.sqlite")]
    /// The data store where important information such as user data is stored.
    /// This must be in one of the following forms:
    ///
    /// - sqlite://relative/path/to/file.sqlite
    /// - sqlite:///absolute/path/to/file.sqlite
    /// - redis://127.0.0.1
    /// - redis://127.0.0.1:5678
    /// - redis://127.0.0.1?username=bulgur&password=cloud
    ///
    /// Sqlite is a great choice for small deployments. For large ones, Redis
    /// offers better performance and allows scalability as it can run as a
    /// cluster.
    ///
    /// For sqlite, you put in `sqlite://` followed by a relative or absolute
    /// path.
    ///
    /// For Redis, you put in `redis://` followed by the IP address for the
    /// redis server, optionally a port, and also optionally username and
    /// password for ACL authentication if needed.
    pub datastore: String,

    #[clap(long, default_value_t = num_cpus::get())]
    /// The number of workers to launch, must be larger than 0. By default this
    /// is set to the number of CPU threads. The actual number of threads
    /// launched may be greater than this.
    pub workers: usize,
}

pub trait CLIContext {
    fn prompt_password() -> anyhow::Result<String>;
}

pub struct CLITerminalContext {}
impl CLIContext for CLITerminalContext {
    fn prompt_password() -> anyhow::Result<String> {
        Ok(prompt_password("Enter the password for this user: ")?)
    }
}

pub async fn cli_command<Ctx: CLIContext>(opt: Opt) -> anyhow::Result<()> {
    match opt.command {
        None => (),
        Some(command) => match command {
            Commands::User(user) => match user {
                User::UserAdd(add) => {
                    validate_username(&add.username)?;
                    let password = match add.password {
                        Some(password) => password,
                        None => Ctx::prompt_password()?,
                    };
                    let connection = CuttlestoreBuilder::new(&opt.datastore)
                        .finish_connection()
                        .await?;
                    let (state, _) = setup_app_deps(env::current_dir().unwrap(), &connection)
                        .await
                        .unwrap();

                    add_new_user(&add.username, &password, add.user_type, &state.users).await?;
                    create_user_folder(&add.username).await?;
                }
                User::UserRemove(remove) => {
                    let connection = CuttlestoreBuilder::new(&opt.datastore)
                        .finish_connection()
                        .await?;
                    let (state, _) = setup_app_deps(env::current_dir().unwrap(), &connection)
                        .await
                        .unwrap();
                    state.users.delete(&remove.username).await?;
                    if remove.delete_files {
                        let store = PathBuf::from(STORAGE).join(&remove.username);
                        fs::remove_dir_all(store).await?;
                    }
                }
            },
        },
    };
    Ok(())
}
