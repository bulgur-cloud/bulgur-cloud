mod common;
use actix_web::{http::Method, test};
use bulgur_cloud::server::setup_app;
use common::TestEnv;

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
