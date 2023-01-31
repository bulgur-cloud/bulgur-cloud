use std::{
    env::{self, temp_dir},
    path::PathBuf,
};

use actix_governor::{GovernorConfig, GovernorConfigBuilder, KeyExtractor};
use actix_web::{body::MessageBody, dev::ServiceResponse, http::header::AsHeaderName, web::Data};
use bulgur_cloud::{
    auth::{add_new_user, create_user_folder, make_token},
    server::setup_app_deps,
    state::{AppState, Token},
};
use cuttlestore::CuttlestoreBuilder;
use tokio::fs;

pub struct TestEnv<T: KeyExtractor> {
    datastore: String,
    folder: PathBuf,
    state: Data<AppState>,
    login_governor: GovernorConfig<T>,
}

#[derive(Debug, Clone, Copy)]
pub struct TestKeyExtractor {}

impl KeyExtractor for TestKeyExtractor {
    type Key = ();

    type KeyExtractionError = &'static str;

    fn extract(
        &self,
        _req: &actix_web::dev::ServiceRequest,
    ) -> Result<Self::Key, Self::KeyExtractionError> {
        Ok(())
    }
}

impl TestEnv<TestKeyExtractor> {
    pub async fn setup() -> TestEnv<TestKeyExtractor> {
        let folder = temp_dir().join(format!("bulgur-cloud-{}", nanoid::nanoid!()));
        std::fs::create_dir_all(&folder).expect("Failed to create test dir");
        env::set_current_dir(&folder).expect("Failed to switch to the test dir");
        let datastore = format!("sqlite://{}/data.sqlite", folder.to_string_lossy());
        let connection = CuttlestoreBuilder::new(&datastore)
            .finish_connection()
            .await
            .unwrap();
        let (state, _) = setup_app_deps(folder.clone(), &connection)
            .await
            .expect("Failed to set up app dependencies");
        let login_governor = GovernorConfigBuilder::default()
            .key_extractor(TestKeyExtractor {})
            .burst_size(u32::MAX)
            .finish()
            .expect("Failed to create login governor for tests");
        TestEnv {
            folder,
            state,
            login_governor,
            datastore,
        }
    }

    #[allow(dead_code)]
    pub fn state(&self) -> Data<AppState> {
        self.state.clone()
    }

    #[allow(dead_code)]
    pub fn login_governor(&self) -> GovernorConfig<TestKeyExtractor> {
        self.login_governor.clone()
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
            &self.state.users,
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
        let token = Token::new();
        self.state
            .path_tokens
            .put(path.to_string(), &token)
            .await
            .unwrap();
        token
    }
}

impl<T: KeyExtractor> Drop for TestEnv<T> {
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
