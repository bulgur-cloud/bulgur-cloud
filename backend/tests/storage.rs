mod common;

use std::path::PathBuf;

use actix_web::{
    http::{header, Method},
    test,
};
use bulgur_cloud::{
    folder::STORAGE,
    server::setup_app,
    state::PathTokenResponse,
    storage::{FolderResults, StorageAction},
};
use common::{create_dir, create_file, TestEnv};
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

#[actix_web::test]
async fn test_rename_file() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_file(PathBuf::from(STORAGE).join("testuser").join("test.txt"), "").await;

    let rename = StorageAction::Move {
        new_path: "/testuser/test.js".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/storage/testuser/test.txt")
        .set_json(rename)
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success(), "Rename successful");

    let js = fs::metadata(PathBuf::from(STORAGE).join("testuser").join("test.js")).await;
    assert!(
        js.expect("Renamed file is missing").is_file(),
        "Renamed file exists"
    );

    let txt = fs::metadata(PathBuf::from(STORAGE).join("testuser").join("test.txt")).await;
    assert!(txt.is_err(), "Old name does not exist");
}

#[actix_web::test]
async fn test_move_file() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_file(PathBuf::from(STORAGE).join("testuser").join("test.txt"), "").await;
    create_dir(PathBuf::from(STORAGE).join("testuser").join("test")).await;

    let rename = StorageAction::Move {
        new_path: "/testuser/test/test.js".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/storage/testuser/test.txt")
        .set_json(rename)
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success(), "Move successful");

    let js = fs::metadata(
        PathBuf::from(STORAGE)
            .join("testuser")
            .join("test")
            .join("test.js"),
    )
    .await;
    assert!(
        js.expect("Moved file is missing").is_file(),
        "Renamed file exists"
    );

    let txt = fs::metadata(PathBuf::from(STORAGE).join("testuser").join("test.txt")).await;
    assert!(txt.is_err(), "Old name does not exist");
}

#[actix_web::test]
async fn test_create_dir() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let rename = StorageAction::CreateFolder {};

    let req = test::TestRequest::post()
        .uri("/storage/testuser/test")
        .set_json(rename)
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success(), "Create folder successful");

    let txt = fs::metadata(PathBuf::from(STORAGE).join("testuser").join("test")).await;
    assert!(
        txt.expect("Created folder does not exist").is_dir(),
        "Folder exists"
    );
}

#[actix_web::test]
async fn test_make_path_token() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_file(
        PathBuf::from(STORAGE).join("testuser").join("test.txt"),
        "Voluptate eaque asperiores eum",
    )
    .await;
    let rename = StorageAction::MakePathToken {};

    let req = test::TestRequest::post()
        .uri("/storage/testuser/test.txt")
        .set_json(rename)
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp: PathTokenResponse = test::call_and_read_body_json(&app, req).await;
    let path_token = resp.token.reveal();
    assert!(!path_token.is_empty(), "Got the path token");

    let uri = format!("/storage/testuser/test.txt?token={}", path_token);
    let req_path_token = test::TestRequest::get().uri(&uri).to_request();
    let resp_path_token = test::call_and_read_body(&app, req_path_token).await;
    let resp_str = String::from_utf8(resp_path_token.to_vec()).expect("Unable to read output");
    assert_eq!(
        resp_str.as_str(),
        "Voluptate eaque asperiores eum",
        "Response has the right body"
    );
}

#[actix_web::test]
async fn test_delete_file() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_file(PathBuf::from(STORAGE).join("testuser").join("test.txt"), "").await;

    let req = test::TestRequest::delete()
        .uri("/storage/testuser/test.txt")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success(), "Delete successful");

    assert!(
        fs::metadata(
            PathBuf::from(STORAGE)
                .join("testuser")
                .join("test")
                .join("test.txt"),
        )
        .await
        .is_err(),
        "Delete file is removed"
    );
}

#[actix_web::test]
async fn test_upload_file() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::put()
        .uri("/storage/testuser/")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .set_payload("--zzz\r\nContent-Disposition: form-data; name=\"test.txt\"; filename=\"test.txt\"\r\n\r\nAutem tempore\r\n--zzz--\r\n\r\n")
        .insert_header((header::CONTENT_TYPE, "multipart/form-data; boundary=zzz"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success(), "Upload successful");

    let contents =
        fs::read_to_string(PathBuf::from(STORAGE).join("testuser").join("test.txt")).await;
    assert!(contents.is_ok(), "Uploaded file exists");
    assert_eq!(
        contents.unwrap(),
        "Autem tempore",
        "Uploaded file has the right contents"
    );
}

#[actix_web::test]
async fn test_upload_file_duplicate_name() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let token_data = token.reveal();
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::put()
        .uri("/storage/testuser/")
        .insert_header((header::AUTHORIZATION, token_data))
        .set_payload("--zzz\r\nContent-Disposition: form-data; name=\"test.txt\"; filename=\"test.txt\"\r\n\r\nAutem tempore\r\n--zzz--\r\n\r\n")
        .insert_header((header::CONTENT_TYPE, "multipart/form-data; boundary=zzz"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success(), "Upload successful");

    let req = test::TestRequest::put()
        .uri("/storage/testuser/")
        .insert_header((header::AUTHORIZATION, token_data))
        .set_payload("--zzz\r\nContent-Disposition: form-data; name=\"test.txt\"; filename=\"test.txt\"\r\n\r\nEt voluptatibu\r\n--zzz--\r\n\r\n")
        .insert_header((header::CONTENT_TYPE, "multipart/form-data; boundary=zzz"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success(), "Second upload successful");

    let contents =
        fs::read_to_string(PathBuf::from(STORAGE).join("testuser").join("test.txt")).await;
    assert!(contents.is_ok(), "Uploaded file exists");
    assert_eq!(
        contents.unwrap(),
        "Autem tempore",
        "Uploaded file has the right contents"
    );

    let contents =
        fs::read_to_string(PathBuf::from(STORAGE).join("testuser").join("test (1).txt")).await;
    assert!(contents.is_ok(), "Second uploaded file exists");
    assert_eq!(
        contents.unwrap(),
        "Et voluptatibu",
        "Second uploaded file has the right contents"
    );
}
