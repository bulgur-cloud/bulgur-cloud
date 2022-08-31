mod common;
use actix_web::test;
use bulgur_cloud::{
    auth::{Login, LoginResponse, Password, Refresh},
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
async fn test_login_and_refresh() {
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

    let access_token = resp.access_token.reveal();
    let refresh_token = resp.refresh_token.reveal();
    assert!(
        !access_token.is_empty(),
        "POST /auth/login responds with access token for a good login"
    );
    assert!(
        !refresh_token.is_empty(),
        "POST /auth/login responds with refresh token for a good login"
    );

    let refresh_data = Refresh {
        refresh_token: refresh_token.clone(),
        username: "testuser".to_string(),
    };
    let req = test::TestRequest::post()
        .uri("/auth/refresh")
        .set_json(refresh_data)
        .to_request();
    let resp: LoginResponse = test::call_and_read_body_json(&app, req).await;
    assert!(
        !resp.access_token.reveal().is_empty(),
        "POST /auth/refresh responds with an access token for a good refresh token"
    );
    assert_eq!(
        resp.refresh_token.reveal(),
        refresh_token,
        "The refresh token is the same"
    );
}

#[actix_web::test]
async fn test_refresh_fails_with_mismatched_username() {
    let ctx = TestEnv::setup().await;
    ctx.add_user("testuser", "correct-horse-battery-staple")
        .await;
    ctx.add_user("falseuser", "other-password").await;
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

    let access_token = resp.access_token.reveal();
    let refresh_token = resp.refresh_token.reveal();
    assert!(
        !access_token.is_empty(),
        "POST /auth/login responds with access token for a good login"
    );
    assert!(
        !refresh_token.is_empty(),
        "POST /auth/login responds with refresh token for a good login"
    );

    let refresh_data = Refresh {
        refresh_token: refresh_token.clone(),
        username: "falseuser".to_string(),
    };
    let req = test::TestRequest::post()
        .uri("/auth/refresh")
        .set_json(refresh_data)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(
        resp.status().is_client_error(),
        "Refresh fails when the username is mismatched"
    );
}

#[actix_web::test]
async fn test_refresh_fails_with_bad_refresh_token() {
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

    let access_token = resp.access_token.reveal();
    let refresh_token = resp.refresh_token.reveal();
    assert!(
        !access_token.is_empty(),
        "POST /auth/login responds with access token for a good login"
    );
    assert!(
        !refresh_token.is_empty(),
        "POST /auth/login responds with refresh token for a good login"
    );

    let refresh_data = Refresh {
        refresh_token: "foobar".to_string(),
        username: "testuser".to_string(),
    };
    let req = test::TestRequest::post()
        .uri("/auth/refresh")
        .set_json(refresh_data)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert!(
        resp.status().is_client_error(),
        "Refresh fails when the refresh token is"
    );
}
