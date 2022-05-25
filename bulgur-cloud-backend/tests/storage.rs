mod common;

use std::path::PathBuf;

use actix_web::{
    http::{header, Method},
    test,
};
use bulgur_cloud::{folder::STORAGE, server::setup_app, storage::FolderResults};
use common::TestEnv;
use tokio::fs;

async fn create_dir(path: PathBuf) {
    fs::create_dir(path)
        .await
        .expect("Failed to create directory");
}

async fn create_file(path: PathBuf, content: &str) {
    fs::write(path, content)
        .await
        .expect("Failed to create directory");
}

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
    create_dir(path).await;

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
    create_file(path, "").await;

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

#[actix_web::test]
async fn test_get_folder_listing() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_dir(PathBuf::from(STORAGE).join("testuser").join("apple")).await;
    create_file(
        PathBuf::from(STORAGE).join("testuser").join("banana.txt"),
        "",
    )
    .await;

    let req = test::TestRequest::get()
        .uri("/storage/testuser/")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let mut resp: FolderResults = test::call_and_read_body_json(&app, req).await;
    resp.entries.sort_by_key(|v| v.name.clone()); // sort so the order is stable between test runs

    assert_eq!(resp.entries.len(), 2, "Folder listing contains all entries");
    assert_eq!(resp.entries[0].name, "apple", "Folder entry exists");
    assert_eq!(
        resp.entries[0].is_file, false,
        "Folder is marked as a folder"
    );
    assert_eq!(resp.entries[1].name, "banana.txt", "File entry exists");
    assert_eq!(resp.entries[1].is_file, true, "File is marked as a file");
}

#[actix_web::test]
async fn test_get_file() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_file(
        PathBuf::from(STORAGE).join("testuser").join("banana.txt"),
        "Aut suscipit amet hic",
    )
    .await;

    let req = test::TestRequest::get()
        .uri("/storage/testuser/banana.txt")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;

    let resp_str = String::from_utf8(resp.to_vec()).expect("Failed to read response string");
    assert_eq!(
        "Aut suscipit amet hic", resp_str,
        "File contents are correct"
    );
}
