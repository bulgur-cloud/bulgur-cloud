mod common;

use std::path::PathBuf;

use actix_web::{
    cookie::Cookie,
    http::{header, StatusCode},
    test,
};
use bulgur_cloud::{
    auth::Password,
    auth_middleware::USER_COOKIE_NAME,
    folder::STORAGE,
    pages::{CreateFolderForm, LoginFormData},
    server::setup_app,
};
use common::{create_dir, read_header, TestEnv};

use crate::common::create_file;

#[actix_web::test]
async fn test_get_basic_home() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::get().uri("/basic/").to_request();
    let resp = test::call_service(&app, req).await;

    assert!(resp.status().is_success(), "basic UI works");
    assert!(
        read_header(&resp, header::CONTENT_TYPE).starts_with("text/html"),
        "basic UI has HTML type"
    );
}

#[actix_web::test]
async fn test_get_basic_missing() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::get()
        .uri("/basic/testuser/not-found/")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(
        resp.status(),
        StatusCode::NOT_FOUND,
        "missing storage folders are handled"
    );
}

#[actix_web::test]
async fn test_get_any_missing() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::get().uri("/not-found/").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(
        resp.status(),
        StatusCode::NOT_FOUND,
        "missing pages are handled"
    );
}

#[actix_web::test]
async fn test_get_basic_asset() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::get()
        .uri("/basic/assets/style.css")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(resp.status().is_success(), "basic UI can serve the assets");
    assert!(
        read_header(&resp, header::CONTENT_TYPE).starts_with("text/css"),
        "basic CSS asset has CSS type"
    );
}

#[actix_web::test]
async fn test_get_basic_folder_listing() {
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
        .uri("/basic/testuser/")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_str = String::from_utf8(resp.to_vec()).expect("Failed to read response body");

    assert!(resp_str.contains("apple"), "basic UI lists the folder");
    assert!(resp_str.contains("banana.txt"), "basic UI lists the file");
    assert!(
        !resp_str.contains("Go up"),
        "top level folder doesn't have a link to go up"
    );
}

#[actix_web::test]
async fn test_get_subfolder_listing() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_dir(PathBuf::from(STORAGE).join("testuser").join("apple")).await;
    create_file(
        PathBuf::from(STORAGE)
            .join("testuser")
            .join("apple")
            .join("banana.txt"),
        "",
    )
    .await;

    let req = test::TestRequest::get()
        .uri("/basic/testuser/apple/")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_str = String::from_utf8(resp.to_vec()).expect("Failed to read response body");

    assert!(resp_str.contains("banana.txt"), "basic UI lists the file");
    assert!(
        resp_str.contains("Go up"),
        "subfolder contains link to go up"
    );
}

#[actix_web::test]
async fn test_delete_item() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    create_dir(PathBuf::from(STORAGE).join("testuser").join("apple")).await;
    create_file(
        PathBuf::from(STORAGE).join("testuser").join("banana.txt"),
        "",
    )
    .await;

    let req = test::TestRequest::post()
        .uri("/basic/testuser/banana.txt?_method=DELETE")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.clone().reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(
        resp.status().is_redirection(),
        "Should redirect back to the folder list"
    );

    let req = test::TestRequest::get()
        .uri("/basic/testuser/")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_str = String::from_utf8(resp.to_vec()).expect("Failed to read response body");

    assert!(resp_str.contains("apple"), "the folder is still there");
    assert!(!resp_str.contains("banana.txt"), "file has been deleted");
}

#[actix_web::test]
async fn test_create_folder() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::post()
        .uri("/basic/testuser/?_method=CREATE")
        .set_form(CreateFolderForm {
            folder: "testfolder".to_string(),
        })
        .cookie(Cookie::new(USER_COOKIE_NAME, token.clone().reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(
        resp.status().is_redirection(),
        "Should redirect back to the folder list"
    );

    let req = test::TestRequest::get()
        .uri("/basic/testuser/")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_str = String::from_utf8(resp.to_vec()).expect("Failed to read response body");

    assert!(resp_str.contains("testfolder"), "created folder is listed");
}

#[actix_web::test]
async fn test_upload_file() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::post()
    .uri("/basic/testuser/?_method=PUT")
    .insert_header((header::AUTHORIZATION, token.clone().reveal()))
    .set_payload("--zzz\r\nContent-Disposition: form-data; name=\"test.txt\"; filename=\"test.txt\"\r\n\r\nAutem tempore\r\n--zzz--\r\n\r\n")
    .insert_header((header::CONTENT_TYPE, "multipart/form-data; boundary=zzz"))
    .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 303, "Responds with a redirect");
    assert_eq!(
        resp.headers()
            .get("Location")
            .expect("responds with a redirect location"),
        "/basic/testuser/",
        "Redirects back to the folder after upload"
    );

    let req = test::TestRequest::get()
        .uri("/basic/testuser/")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_str = String::from_utf8(resp.to_vec()).expect("Failed to read response body");

    assert!(
        resp_str.contains("test.txt"),
        "basic UI lists the file uploaded"
    );
}

#[actix_web::test]
async fn test_basic_login() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let login = LoginFormData {
        username: "testuser".to_string(),
        password: Password("testpass".to_string()),
    };

    let req = test::TestRequest::post()
        .uri("/basic/")
        .set_form(login)
        .to_request();
    let resp = test::call_service(&app, req).await;

    let auth_cookie = resp
        .response()
        .cookies()
        .find(|cookie| cookie.name() == USER_COOKIE_NAME);
    assert!(
        auth_cookie.is_some(),
        "basic login responded with the auth cookie"
    );
    assert!(
        !auth_cookie.unwrap().value().is_empty(),
        "auth cookie actually exists"
    );
}

#[actix_web::test]
async fn test_basic_logout() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::post()
        .uri("/basic/logout")
        .cookie(Cookie::new(USER_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    let logout_cookie = resp
        .response()
        .cookies()
        .find(|cookie| cookie.name() == USER_COOKIE_NAME);
    assert!(
        logout_cookie.is_some(),
        "basic logout responded with the logout cookie"
    );
    assert!(
        logout_cookie.unwrap().value().is_empty(),
        "logout cookie erases the contents"
    );
}
