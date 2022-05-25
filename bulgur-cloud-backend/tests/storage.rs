mod common;

use std::path::PathBuf;

use actix_web::{
    http::{header, Method},
    test,
};
use bulgur_cloud::{folder::STORAGE, server::setup_app};
use common::TestEnv;
use tokio::fs;

#[actix_web::test]
async fn test_get_home_auth_token() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;
    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri("/storage/testuser/")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_success(),
        "HEAD storage is OK for authenticated user"
    );
}

#[actix_web::test]
async fn test_get_home_path_token() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "testpass").await;
    let token = ctx.setup_path_token("/storage/testuser/").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let uri = format!("/storage/testuser/?token={}", token.reveal());
    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri(&uri)
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_success(),
        "HEAD storage is OK for path token"
    );
}

#[actix_web::test]
async fn test_path_token_unauthorized_store() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "testpass").await;
    ctx.add_user("user2", "testpass").await;
    let token = ctx.setup_path_token("/storage/testuser/").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let uri = format!("/storage/user2/?token={}", token.reveal());
    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri(&uri)
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "HEAD storage with path token rejects for unauthorized store"
    );
}

#[actix_web::test]
async fn test_user_token_unauthorized_store() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    ctx.add_user("user2", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .uri("/storage/user2/")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "HEAD storage with auth token rejects for unauthorized store"
    );
}

#[actix_web::test]
async fn test_head_existing_folder() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let path = PathBuf::from(STORAGE).join("testuser").join("example");
    fs::create_dir(path)
        .await
        .expect("Failed to create example folder");

    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri("/storage/testuser/example")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_success(),
        "HEAD storage is OK for existing folder"
    );
}

#[actix_web::test]
async fn test_head_existing_file() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let path = PathBuf::from(STORAGE).join("testuser").join("example.txt");
    fs::write(path, "")
        .await
        .expect("Failed to create example file");

    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri("/storage/testuser/example.txt")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_success(),
        "HEAD storage is OK for existing folder"
    );
}

#[actix_web::test]
async fn test_head_missing_path() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri("/storage/testuser/example.txt")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "HEAD storage fails for missing path"
    );
}
