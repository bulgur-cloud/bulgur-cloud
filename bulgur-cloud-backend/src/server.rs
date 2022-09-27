use std::{env, path::PathBuf};

use crate::{
    auth::{create_nobody, login, refresh, TOKEN_VALID_SECS},
    auth_middleware, folder,
    kv::{kv_filesystem::KVFilesystem, table::TABLE_USERS},
    meta::{get_banner_login, get_banner_page, get_stats, head_stats, is_bulgur_cloud},
    pages::{
        not_found, page_create_folder, page_delete, page_folder_list, page_folder_upload,
        page_login_get, page_login_post, page_logout,
    },
    state::{AppState, PathTokenCache, TokenCache},
    static_files::{get_basic_assets, get_ui, get_ui_index, head_ui_index},
    storage::{delete_storage, get_storage, head_storage, post_storage, put_storage},
};

use actix_service::ServiceFactory;

use actix_cors::Cors;
use actix_governor::{
    Governor, GovernorConfig, GovernorConfigBuilder, KeyExtractor, PeerIpKeyExtractor,
};

use actix_web::{
    body::MessageBody,
    dev::{ServiceRequest, ServiceResponse},
    http::{self, Method},
    middleware,
    web::{self, Data},
    App, Error,
};

use actix_web_query_method_middleware::QueryMethod;
use tokio::fs;
use tracing_actix_web::TracingLogger;

fn setup_cors() -> Cors {
    let cors = Cors::default()
        .allow_any_method()
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
        origin.split(",").fold(cors, |cors, origin| {
            tracing::info!("Allowing origin {origin}");
            cors.allowed_origin(origin)
        })
    }
}

pub fn setup_app(
    state: Data<AppState>,
    login_governor: GovernorConfig<impl KeyExtractor + 'static>,
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
    let login_scope = web::scope("/auth")
        .wrap(Governor::new(&login_governor))
        .service(login)
        .service(refresh);
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
        .service(get_ui_index)
        .service(head_ui_index)
        .service(get_ui);
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
const MAX_LOGIN_ATTEMPTS_PER_MIN: u32 = 1000;
#[cfg(not(debug_assertions))]
/// For release, we strictly throttle login attempts to resist brute force attacks
const MAX_LOGIN_ATTEMPTS_PER_MIN: u32 = 10;

/// Store up to this many path tokens. Path tokens are needed to authorize
/// read-only access to specific paths.
const MAX_PATH_TOKEN_CACHE: usize = 100000;

pub async fn setup_app_deps(
    base_folder: PathBuf,
) -> anyhow::Result<(Data<AppState>, GovernorConfig<PeerIpKeyExtractor>)> {
    // Make sure the needed folders are available
    fs::create_dir_all(PathBuf::from(folder::STORAGE)).await?;
    let state = web::Data::new(AppState {
        started_at: chrono::Local::now(),
        // Auth tokens are cached for 24 hours
        token_cache: TokenCache::new(TOKEN_VALID_SECS),
        path_token_cache: PathTokenCache::new(MAX_PATH_TOKEN_CACHE),
        kv: Box::new(KVFilesystem::new(base_folder).await),
    });

    let login_governor = GovernorConfigBuilder::default()
        .per_second(60)
        .burst_size(MAX_LOGIN_ATTEMPTS_PER_MIN)
        .finish()
        .expect("Unable to setup login governor");
    // Make sure the nobody user is created if it doesn't exist
    create_nobody(&mut state.kv.open(TABLE_USERS).await).await?;

    Ok((state, login_governor))
}
