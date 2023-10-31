use std::{
    env::{self, temp_dir},
    path::PathBuf,
};

use actix_web::{body::MessageBody, dev::ServiceResponse, http::header::AsHeaderName, web::Data};
use bulgur_cloud::{
    auth::{add_new_user, create_user_folder, make_token},
    db::get_db,
    ratelimit_middleware::RateLimit,
    server::setup_app_deps,
    state::{AppState, Token},
    storage::make_path_token,
};
use tokio::fs;

pub struct TestEnv {
    datastore: String,
    folder: PathBuf,
    state: Data<AppState>,
}

#[derive(Debug, Clone, Copy)]
pub struct TestKeyExtractor {}

impl TestEnv {
    pub async fn setup() -> TestEnv {
        let folder = temp_dir().join(format!("bulgur-cloud-{}", nanoid::nanoid!()));
        std::fs::create_dir_all(&folder).expect("Failed to create test dir");
        env::set_current_dir(&folder).expect("Failed to switch to the test dir");
        let datastore = "sqlite::memory:".to_string();
        let connection = get_db(&datastore).await.unwrap();
        let (state, _) = setup_app_deps(folder.clone(), connection)
            .await
            .expect("Failed to set up app dependencies");
        TestEnv {
            folder,
            state,
            datastore,
        }
    }

    #[allow(dead_code)]
    pub fn state(&self) -> Data<AppState> {
        self.state.clone()
    }

    #[allow(dead_code)]
    pub fn login_governor(&self) -> RateLimit {
        RateLimit::new(100_000_000, true)
    }

    #[allow(dead_code)]
    pub fn datastore(&self) -> String {
        self.datastore.clone()
    }

    #[allow(dead_code)]
    pub async fn add_user(&self, user: &str, password: &str) {
        add_new_user(
            user,
            password,
            bulgur_cloud::state::UserType::User,
            &self.state.db,
        )
        .await
        .expect("Failed to create user");
        create_user_folder(user)
            .await
            .expect("Failed to create user folder");
    }

    #[allow(dead_code)]
    pub async fn setup_user_token(&self, username: &str, password: &str) -> Token {
        self.add_user(username, password).await;
        make_token(&self.state, username).await.unwrap()
    }

    #[allow(dead_code)]
    pub async fn setup_path_token(&self, path: &str) -> Token {
        make_path_token(&self.state, &PathBuf::from(path)).await
    }
}

impl Drop for TestEnv {
    fn drop(&mut self) {
        std::fs::remove_dir_all(&self.folder).expect("Failed to clean up test dir");
    }
}

#[allow(dead_code)]
pub async fn create_dir(path: PathBuf) {
    fs::create_dir(path)
        .await
        .expect("Failed to create directory");
}

#[allow(dead_code)]
pub async fn create_file(path: PathBuf, content: &str) {
    fs::write(path, content)
        .await
        .expect("Failed to create directory");
}

#[allow(dead_code)]
pub fn read_header(resp: &ServiceResponse<impl MessageBody>, header: impl AsHeaderName) -> String {
    resp.headers()
        .get(header)
        .expect("Failed to read header")
        .to_str()
        .expect("Failed to parse header")
        .to_string()
}
