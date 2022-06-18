mod common;
use std::path::PathBuf;

use actix_web::{
    http::{header, Method, StatusCode},
    test,
};
use bulgur_cloud::{folder::BANNER, server::setup_app};
use common::TestEnv;
use tokio::fs;

#[actix_web::test]
async fn test_is_bulgur_cloud_ok() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;
    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri("/is_bulgur_cloud")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(resp.status().is_success(), "HEAD /is_bulgur_cloud success");
}

#[actix_web::test]
async fn test_head_stats_rejects_unauthorized() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;
    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri("/api/stats")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "HEAD /api/stats rejects for unauthorized access"
    );
}

#[actix_web::test]
async fn test_head_status_accepts_authorized() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let req = test::TestRequest::default()
        .method(Method::HEAD)
        .uri("/api/stats")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_success(),
        "HEAD /api/stats accepts authorized users"
    );
}

#[actix_web::test]
async fn test_get_stats_unauthorized() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::post().uri("/api/stats").to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "GET /api/stats rejects unauthorized users"
    );
}

#[actix_web::test]
async fn test_get_stats() {
    let ctx = TestEnv::setup().await;
    let token = ctx.setup_user_token("testuser", "testpass").await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::get()
        .uri("/api/stats")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_success(),
        "GET /api/stats responds to authorized users"
    );
}

#[actix_web::test]
async fn test_get_banner_login_missing() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let req = test::TestRequest::get().uri("/banner/login").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(
        resp.status(),
        StatusCode::NOT_FOUND,
        "GET /banner/login fails when there's no banner in place"
    );
}

#[actix_web::test]
async fn test_get_banner_login_found() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    fs::create_dir(PathBuf::from(BANNER))
        .await
        .expect("Failed to create banner dir");
    let banner_path = PathBuf::from(BANNER).join("login.txt");
    fs::write(banner_path, "Voluptatum totam dolorem architecto qui at")
        .await
        .expect("Failed to write the banner");

    let req = test::TestRequest::get().uri("/banner/login").to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_text = String::from_utf8_lossy(&resp[..]);

    assert_eq!(
        resp_text, "Voluptatum totam dolorem architecto qui at",
        "GET /banner/login responds with the banner text when banner exists"
    );
}

#[actix_web::test]
async fn test_get_banner_page_missing() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;
    let token = ctx.setup_user_token("testuser", "testpass").await;

    let req = test::TestRequest::get()
        .uri("/banner/page")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(
        resp.status(),
        StatusCode::NOT_FOUND,
        "GET /banner/page fails when there's no banner in place"
    );
}

#[actix_web::test]
async fn test_get_banner_page_found() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;
    let token = ctx.setup_user_token("testuser", "testpass").await;

    fs::create_dir(PathBuf::from(BANNER))
        .await
        .expect("Failed to create banner dir");
    let banner_path = PathBuf::from(BANNER).join("page.txt");
    fs::write(banner_path, "Est totam magni eum")
        .await
        .expect("Failed to write the banner");

    let req = test::TestRequest::get()
        .uri("/banner/page")
        .insert_header((header::AUTHORIZATION, token.reveal()))
        .to_request();
    let resp = test::call_and_read_body(&app, req).await;
    let resp_text = String::from_utf8_lossy(&resp[..]);

    assert_eq!(
        resp_text, "Est totam magni eum",
        "GET /banner/page responds with the banner text when banner exists"
    );
}
