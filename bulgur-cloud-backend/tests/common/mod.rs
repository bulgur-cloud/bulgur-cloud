use std::{
    env::{self, temp_dir},
    path::PathBuf,
};

use actix_governor::{GovernorConfig, GovernorConfigBuilder, KeyExtractor};
use actix_web::web::Data;
use bulgur_cloud::{
    auth::{create_user, create_user_folder},
    server::setup_app_deps,
    state::{AppState, Token, User},
};

pub struct TestEnv<T: KeyExtractor> {
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
        let (state, _) = setup_app_deps()
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

    pub async fn add_user(&self, user: &str, password: &str) {
        create_user(user, password, bulgur_cloud::auth::UserType::User)
            .await
            .expect("Failed to create user");
        create_user_folder(user)
            .await
            .expect("Failed to create user folder");
    }

    #[allow(dead_code)]
    pub async fn setup_user_token(&self, username: &str, password: &str) -> Token {
        self.add_user(username, password).await;

        let user = User(username.to_string());
        let mut cache = self.state.token_cache.0.write().await;
        let token = Token::new();
        cache.insert(token.clone(), user);
        token
    }

    #[allow(dead_code)]
    pub async fn setup_path_token(&self, path: &str) -> Token {
        let mut cache = self.state.path_token_cache.0.write().await;
        let token = Token::new();
        cache.insert(path.to_string(), token.clone());
        token
    }
}

impl<T: KeyExtractor> Drop for TestEnv<T> {
    fn drop(&mut self) {
        std::fs::remove_dir_all(&self.folder).expect("Failed to clean up test dir");
    }
}
