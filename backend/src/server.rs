use std::{env, path::PathBuf, str::FromStr};

use crate::{
    auth::{create_nobody, login},
    auth_middleware, folder,
    meta::{get_banner_login, get_banner_page, get_stats, head_stats, is_bulgur_cloud},
    pages::{
        not_found, page_create_folder, page_delete, page_folder_list, page_folder_upload,
        page_login_get, page_login_post, page_logout,
    },
    ratelimit_middleware::RateLimit,
    state::AppState,
    static_files::{get_basic_assets, ui_pages},
    storage::{delete_storage, get_storage, head_storage, meta_storage, post_storage, put_storage},
};

use actix_service::ServiceFactory;

use actix_cors::Cors;

use actix_web::{
    body::MessageBody,
    dev::{ServiceRequest, ServiceResponse},
    http::{self, Method},
    middleware,
    web::{self, Data},
    App, Error,
};

use actix_web_query_method_middleware::QueryMethod;
use cuttlestore::CuttleConnection;
use tokio::fs;
use tracing_actix_web::TracingLogger;

fn setup_cors() -> Cors {
    let cors = Cors::default()
        .allowed_methods(vec![
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::HEAD,
            Method::OPTIONS,
            Method::PATCH,
            Method::from_str("META").unwrap(),
        ])
        .allowed_headers(vec![
            http::header::AUTHORIZATION,
            http::header::ACCEPT,
            http::header::CONTENT_TYPE,
        ])
        .max_age(86400);
    let origin = env::var("BULGUR_CLOUD_CORS_ORIGIN").unwrap_or_else(|_| "*".to_string());
    if origin.eq("*") {
        tracing::info!("Allowing any origin");
        cors.allow_any_origin()
    } else {
        origin.split(',').fold(cors, |cors, origin| {
            tracing::info!("Allowing origin {origin}");
            cors.allowed_origin(origin)
        })
    }
}

pub fn setup_app(
    state: Data<AppState>,
    login_governor: RateLimit,
) -> App<
    impl ServiceFactory<
        ServiceRequest,
        Response = ServiceResponse<impl MessageBody>,
        Config = (),
        InitError = (),
        Error = Error,
    >,
> {
    let cors = setup_cors();

    let api_guard = auth_middleware::CheckLogin {
        state: state.clone(),
        allow_path_tokens: false,
    };
    let storage_guard = auth_middleware::CheckLogin {
        state: state.clone(),
        allow_path_tokens: true,
    };

    // Login scope just handles logins. It is heavily throttled to resist brute force attacks.
    let login_scope = web::scope("/auth").wrap(login_governor).service(login);
    // API scope handles all api functionality (anything except storage)
    let api_scope = web::scope("/api")
        .wrap(api_guard.clone())
        .service(get_stats)
        .service(head_stats);
    // Storage scope handles the actual files and folders
    let storage_scope = web::scope("/storage")
        .wrap(storage_guard.clone())
        .service(get_storage)
        .service(put_storage)
        .service(head_storage)
        .service(meta_storage)
        .service(post_storage)
        .service(delete_storage);
    // Basic HTML scopes are for the javascript-free basic interface.
    let authenticated_basic_html_scope = web::scope("/basic")
        .wrap(storage_guard)
        .wrap(QueryMethod::new())
        .service(page_folder_list)
        .service(page_folder_upload)
        .service(page_delete)
        .route(
            "/{store}/{path:.*}",
            web::method(Method::try_from("CREATE").unwrap()).to(page_create_folder),
        );
    let basic_html_scope = web::scope("")
        .service(page_login_get)
        .service(page_login_post)
        .service(page_logout)
        .service(get_basic_assets)
        .service(authenticated_basic_html_scope)
        .service(ui_pages);
    let banner_auth_scope = web::scope("").wrap(api_guard).service(get_banner_page);
    let banner_scope = web::scope("banner")
        .service(get_banner_login)
        .service(banner_auth_scope);

    // Build the app with all these scopes, and add middleware for CORS and tracing
    App::new()
        .wrap(TracingLogger::default())
        // Fix redundant slashes
        .wrap(middleware::NormalizePath::new(
            middleware::TrailingSlash::MergeOnly,
        ))
        // Negotiate and do compression
        .wrap(middleware::Compress::default())
        // Allow CORS access.
        .wrap(cors)
        .app_data(state)
        .service(login_scope)
        .service(api_scope)
        .service(storage_scope)
        .service(is_bulgur_cloud)
        .service(banner_scope)
        .service(basic_html_scope)
        .default_service(web::to(not_found))
}

#[cfg(debug_assertions)]
/// During debugging, throttling login attempts is not really needed
const MAX_LOGIN_ATTEMPTS_PER_MIN: u32 = 100_000_000;
#[cfg(not(debug_assertions))]
/// For release, we strictly throttle login attempts to resist brute force attacks
const MAX_LOGIN_ATTEMPTS_PER_MIN: u32 = 10;

pub async fn setup_app_deps(
    _base_folder: PathBuf,
    connection: &CuttleConnection,
) -> anyhow::Result<(Data<AppState>, RateLimit)> {
    // Make sure the needed folders are available
    fs::create_dir_all(PathBuf::from(folder::STORAGE)).await?;
    let state = web::Data::new(AppState {
        started_at: chrono::Local::now(),
        access_tokens: connection.make("access-token").await?,
        path_tokens: connection.make("path-token").await?,
        users: connection.make("user").await?,
    });

    let login_governor = RateLimit::new(
        MAX_LOGIN_ATTEMPTS_PER_MIN,
        env::var("BULGUR_CLOUD_BEHIND_PROXY").is_ok(),
    );

    // Make sure the nobody user is created if it doesn't exist
    create_nobody(&state.users).await?;

    Ok((state, login_governor))
}
