mod common;
use actix_web::test;
use bulgur_cloud::{
    auth::{Login, LoginResponse, Password},
    server::setup_app,
};
use common::TestEnv;

#[actix_web::test]
async fn test_login_fails_no_data() {
    let ctx = TestEnv::setup().await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;
    let req = test::TestRequest::post().uri("/auth/login").to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "POST /auth/login rejects login with missing data"
    );
}

#[actix_web::test]
async fn test_login_fails_bad_username() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "correct-horse-battery-staple")
        .await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let login = Login {
        username: "someone-else".to_string(),
        password: Password("correct-horse-battery-staple".to_string()),
    };

    let req = test::TestRequest::post()
        .uri("/auth/login")
        .set_json(login)
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "POST /auth/login rejects login with bad password"
    );
}

#[actix_web::test]
async fn test_login_fails_bad_password() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "correct-horse-battery-staple")
        .await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let login = Login {
        username: "testuser".to_string(),
        password: Password("hunter2".to_string()),
    };

    let req = test::TestRequest::post()
        .uri("/auth/login")
        .set_json(login)
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert!(
        resp.status().is_client_error(),
        "POST /auth/login rejects login with bad password"
    );
}

#[actix_web::test]
async fn test_login_succeeds() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "correct-horse-battery-staple")
        .await;
    let app = test::init_service(setup_app(ctx.state(), ctx.login_governor())).await;

    let login = Login {
        username: "testuser".to_string(),
        password: Password("correct-horse-battery-staple".to_string()),
    };

    let req = test::TestRequest::post()
        .uri("/auth/login")
        .set_json(login)
        .to_request();
    let resp: LoginResponse = test::call_and_read_body_json(&app, req).await;

    assert!(
        resp.token.reveal().len() > 0,
        "POST /auth/login responds with atoken for a good login"
    );
}
