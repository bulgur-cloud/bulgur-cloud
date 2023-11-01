mod common;

use std::path::PathBuf;

use bulgur_cloud::{
    cli::{cli_command, CLIContext, Commands, Opt, User, UserAdd, UserRemove},
    folder::STORAGE,
    state::UserType,
};
use common::TestEnv;
use tokio::fs;

pub struct CLITestContext {}
impl CLIContext for CLITestContext {
    fn prompt_password() -> anyhow::Result<String> {
        Ok("testpass".to_string())
    }
}

#[actix_web::test]
async fn test_cli_user_add() {
    let ctx = TestEnv::setup().await;

    let command = Commands::User(User::UserAdd(UserAdd {
        user_type: UserType::User,
        password: None,
        username: "testuser".to_string(),
    }));
    let opt = Opt {
        command: Some(command),
        bind: Default::default(),
        datastore: ctx.datastore(),
        workers: 1,
    };
    cli_command::<CLITestContext>(opt)
        .await
        .expect("Failed to run command");

    let user_store = PathBuf::from(STORAGE).join("testuser");
    assert!(
        fs::metadata(&user_store)
            .await
            .expect("User store is missing")
            .is_dir(),
        "User store exists"
    );
    drop(ctx);
}

#[actix_web::test]
async fn test_cli_user_remove() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "testpass").await;

    let command = Commands::User(User::UserRemove(UserRemove {
        username: "testuser".to_string(),
        delete_files: false,
    }));
    let opt = Opt {
        command: Some(command),
        bind: Default::default(),
        datastore: ctx.datastore(),
        workers: 1,
    };
    cli_command::<CLITestContext>(opt)
        .await
        .expect("Failed to run command");

    let user_store = PathBuf::from(STORAGE).join("testuser");
    assert!(
        fs::metadata(&user_store)
            .await
            .expect("User store is missing")
            .is_dir(),
        "User store still exists"
    );
}

#[actix_web::test]
async fn test_cli_user_remove_delete_files() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "testpass").await;
    fs::write(PathBuf::from(STORAGE).join("testuser").join("test.txt"), "")
        .await
        .expect("Failed to write file");

    let command = Commands::User(User::UserRemove(UserRemove {
        username: "testuser".to_string(),
        delete_files: true,
    }));
    let opt = Opt {
        command: Some(command),
        bind: Default::default(),
        datastore: ctx.datastore(),
        workers: 1,
    };
    cli_command::<CLITestContext>(opt)
        .await
        .expect("Failed to run command");

    let user_store = PathBuf::from(STORAGE).join("testuser");
    assert!(
        fs::metadata(&user_store).await.is_err(),
        "User store {:?} has been deleted",
        &user_store
    );
}
