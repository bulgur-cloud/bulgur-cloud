mod common;

use std::path::PathBuf;

use actix_web::{
    cookie::Cookie,
    http::{header, StatusCode},
    test,
};
use bulgur_cloud::{
    auth::Password, auth_middleware::AUTH_COOKIE_NAME, folder::STORAGE, pages::LoginFormData,
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
        .cookie(Cookie::new(AUTH_COOKIE_NAME, token.reveal()))
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
        .cookie(Cookie::new(AUTH_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_str = String::from_utf8(resp.to_vec()).expect("Failed to read response body");

    assert!(resp_str.contains("apple"), "basic UI lists the folder");
    assert!(resp_str.contains("banana.txt"), "basic UI lists the file");
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
        .find(|cookie| cookie.name() == AUTH_COOKIE_NAME);
    assert!(
        auth_cookie.is_some(),
        "basic login responded with the auth cookie"
    );
    assert!(
        auth_cookie.unwrap().value().len() > 0,
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
        .cookie(Cookie::new(AUTH_COOKIE_NAME, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    let logout_cookie = resp
        .response()
        .cookies()
        .find(|cookie| cookie.name() == AUTH_COOKIE_NAME);
    assert!(
        logout_cookie.is_some(),
        "basic logout responded with the logout cookie"
    );
    assert!(
        logout_cookie.unwrap().value().len() == 0,
        "logout cookie erases the contents"
    );
}
