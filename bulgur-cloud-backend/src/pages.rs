use std::{ops::Deref, path::PathBuf};

use actix_files::NamedFile;
use actix_web::{
    cookie::Cookie,
    get,
    http::header::ContentType,
    post,
    web::{self, ReqData},
    Either, HttpResponse, Responder,
};

use askama_actix::Template;
use rust_embed::RustEmbed;
use serde::Deserialize;
use tracing_unwrap::OptionExt;

use crate::{
    auth::{verify_pass, Password},
    auth_middleware::AUTH_COOKIE_NAME,
    state::{self, AppState, Authorized, Token},
    storage::{get_authorized_path, get_storage, get_storage_internal, FolderEntry, StorageError},
};

#[derive(Template)]
#[template(path = "login.html")]
pub struct LoginPage {}

#[get("/")]
pub async fn page_login_get() -> LoginPage {
    LoginPage {}
}

#[derive(Deserialize)]
pub struct LoginFormData {
    username: String,
    password: Password,
}

#[post("/")]
pub async fn page_login_post(
    form: web::Form<LoginFormData>,
    state: web::Data<AppState>,
) -> HttpResponse {
    if verify_pass(&form.username, &form.password).await.is_ok() {
        let mut cache = state.token_cache.0.write().await;
        // generate and cache token
        let token = Token::new();
        // Impossibly unlikely, but token collisions would be extremely bad so check it anyway
        assert!(!cache.contains_key(&token));
        cache.insert(token.clone(), state::User(form.username.clone()));

        HttpResponse::SeeOther()
            .cookie(Cookie::new(AUTH_COOKIE_NAME, token.reveal()))
            .append_header(("Location", format!("/page/{}/", form.username)))
            .finish()
    } else {
        HttpResponse::Unauthorized().finish()
    }
}

#[post("/logout")]
pub async fn page_logout() -> HttpResponse {
    let mut remove_cookie = Cookie::named(AUTH_COOKIE_NAME);
    remove_cookie.make_removal();

    HttpResponse::SeeOther()
        .cookie(remove_cookie)
        .append_header(("Location", "/"))
        .finish()
}

#[derive(Template)]
#[template(path = "folder-list.html")]
pub struct FolderListPage {
    username: String,
    path: String,
    folder_list: Vec<FolderEntry>,
}

#[get("/{store}/{path:.*}")]
pub async fn page_folder_list(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authorized>>,
    // TODO: Add a new error type with an HTML responder here
) -> Result<Either<NamedFile, FolderListPage>, StorageError> {
    let (store, path) = params.clone();
    let mut store_path = PathBuf::from(&store);
    if (&path).len() > 0 {
        store_path.push(&path);
    }
    tracing::debug!("{:?}, {:?}, {:?}", &store, &path, &store_path);

    let out = get_storage_internal(params, &authorized).await?;

    match out {
        Either::Left(file) => Ok(Either::Left(file)),
        Either::Right(folder_list) => {
            let username = match &authorized {
                Some(user) => match user.deref() {
                    Authorized::User(user) => user.0.as_str(),
                    Authorized::Path => "anonymous",
                    Authorized::Both(user) => user.0.as_str(),
                },
                None => {
                    return Err(StorageError::NotAuthorized);
                }
            }
            .to_string();
            Ok(Either::Right(FolderListPage {
                username,
                // TODO This is the right thing to do I guess? Not sure how else to handle "bad" characters if they exist
                path: store_path.to_string_lossy().to_string(),
                folder_list: folder_list.0.entries,
            }))
        }
    }
}

#[derive(RustEmbed)]
#[folder = "assets/"]
struct Asset;

#[get("/assets/style.css")]
pub async fn assets_style() -> HttpResponse {
    let style = Asset::get("style.css").unwrap_or_log();
    HttpResponse::Ok()
        .content_type("text/css")
        // TODO: Pretty ugly solution
        .body(style.data.to_vec())
}

// TODO Ugh, the ones below are even uglier. Should start actually looking up if
// the file exists and dynamically setting content type from the extension.

#[get("/assets/file.svg")]
pub async fn assets_file_svg() -> HttpResponse {
    let style = Asset::get("file.svg").unwrap_or_log();
    HttpResponse::Ok()
        .content_type("image/svg+xml")
        .body(style.data.to_vec())
}

#[get("/assets/folder.svg")]
pub async fn assets_folder_svg() -> HttpResponse {
    let style = Asset::get("folder.svg").unwrap_or_log();
    HttpResponse::Ok()
        .content_type("image/svg+xml")
        .body(style.data.to_vec())
}
