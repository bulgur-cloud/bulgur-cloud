use std::path::PathBuf;

use actix_files::NamedFile;
use actix_web::{
    cookie::Cookie,
    delete, get, post, put,
    web::{self, ReqData},
    Either, HttpResponse,
};

use actix_multipart::Multipart;
use askama_actix::Template;
use serde::{Deserialize, Serialize};
use tokio::fs;
use tracing_unwrap::ResultExt;

use crate::{
    auth::{make_token, verify_pass, Password},
    auth_middleware::USER_COOKIE_NAME,
    state::{AppState, Authentication},
    storage::{
        common_delete, get_authorized_path, get_storage_internal, write_files, FolderEntry,
        StorageError,
    },
};

#[derive(Template)]
#[template(path = "login.html")]
pub struct LoginPage {}

#[tracing::instrument]
#[get("/basic/")]
pub async fn page_login_get() -> LoginPage {
    LoginPage {}
}

#[derive(Template)]
#[template(path = "not-found.html")]
pub struct NotFoundPage {}

#[tracing::instrument]
pub async fn not_found() -> HttpResponse {
    let page = (NotFoundPage {}).render().unwrap_or_log();
    HttpResponse::NotFound().body(page)
}

#[derive(Serialize, Deserialize)]
pub struct LoginFormData {
    pub username: String,
    pub password: Password,
}

#[tracing::instrument(skip(form))]
#[post("/basic/")]
pub async fn page_login_post(
    form: web::Form<LoginFormData>,
    state: web::Data<AppState>,
) -> HttpResponse {
    if verify_pass(&form.username, &form.password, &state.db)
        .await
        .is_ok()
    {
        let token = make_token(&state, &form.username).await.unwrap_or_log();

        HttpResponse::SeeOther()
            .cookie(Cookie::new(
                USER_COOKIE_NAME,
                format!("{}; SameSite=Strict", token.reveal()),
            ))
            .append_header(("Location", format!("/basic/{}/", form.username)))
            .finish()
    } else {
        HttpResponse::Unauthorized().finish()
    }
}

#[tracing::instrument]
#[post("/basic/logout")]
pub async fn page_logout() -> HttpResponse {
    let mut remove_cookie = Cookie::named(USER_COOKIE_NAME);
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
    parent_path: Option<String>,
    folder_list: Vec<FolderEntry>,
}

#[derive(Template)]
#[template(path = "error.html")]
pub struct ErrorPage {
    error_text: Option<String>,
    redirect_link: String,
}

#[tracing::instrument(skip(payload))]
#[put("/{store}/{path:.*}")]
pub async fn page_folder_upload(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authentication>>,
    mut payload: Multipart,
) -> Result<HttpResponse, StorageError> {
    let (store, path) = params.as_ref();
    let store_path = get_authorized_path(&authorized, store, path, false)?;
    let folder_path = format!("/basic/{store}/{path}");

    match write_files(&mut payload, &store_path).await {
        // If upload was successful, get the browser to refresh the page with a get request.
        Ok(_) => Ok(HttpResponse::SeeOther()
            .append_header(("Location", folder_path))
            .finish()),
        // If upload failed, then we'll display an error page. A bit crude, but will work.
        Err(err) => Ok(HttpResponse::BadRequest().body(
            ErrorPage {
                error_text: Some(err.to_string()),
                redirect_link: folder_path,
            }
            .render()
            .unwrap_or_log(),
        )),
    }
}

#[tracing::instrument]
#[delete("/{store}/{path:.*}")]
pub async fn page_delete(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authentication>>,
) -> Result<HttpResponse, StorageError> {
    let (store, path) = params.as_ref();
    common_delete(&authorized, store, path).await?;
    // We want to redirect the user back to the folder they were in.
    let mut path = PathBuf::from(path);
    path.pop();

    Ok(HttpResponse::SeeOther()
        .append_header((
            "Location",
            format!("/basic/{store}/{}", path.to_string_lossy()),
        ))
        .finish())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateFolderForm {
    pub folder: String,
}

#[tracing::instrument]
pub async fn page_create_folder(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authentication>>,
    form: web::Form<CreateFolderForm>,
) -> Result<HttpResponse, StorageError> {
    let (store, path) = params.as_ref();
    let mut store_path = get_authorized_path(&authorized, store, path, false)?;

    let folder_name = sanitize_filename::sanitize(&form.folder);
    store_path.push(&folder_name);
    fs::create_dir(&store_path).await?;

    Ok(HttpResponse::SeeOther()
        .append_header(("Location", format!("/basic/{store}/{path}{folder_name}/")))
        .finish())
}

#[tracing::instrument]
#[get("/{store}/{path:.*}")]
pub async fn page_folder_list(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authentication>>,
    // TODO: Add a new error type with an HTML responder here
) -> Result<Either<NamedFile, FolderListPage>, StorageError> {
    let (store, path) = params.clone();
    let mut store_path = PathBuf::from(&store);
    if !path.is_empty() {
        store_path.push(&path);
    }
    tracing::debug!("{:?}, {:?}, {:?}", &store, &path, &store_path);

    let out = get_storage_internal((&store, &path), &authorized).await?;

    match out {
        Either::Left(file) => Ok(Either::Left(file)),
        Either::Right(folder_list) => {
            let username = match &authorized {
                Some(user) => user
                    .user
                    .as_ref()
                    .map(|u| u.username.to_owned())
                    .unwrap_or_else(|| "anonymous".to_string()),
                None => {
                    return Err(StorageError::NotAuthorized);
                }
            };
            let parent_path = store_path
                .parent()
                .map(|parent| parent.to_string_lossy().to_string())
                .and_then(|parent| {
                    // If parent is an empty string, then there is no parent to go up to
                    if parent.is_empty() {
                        None
                    } else {
                        Some(parent)
                    }
                });
            tracing::debug!(parent_path, "parent_path");
            Ok(Either::Right(FolderListPage {
                username,
                path: store_path.to_string_lossy().to_string(),
                folder_list: folder_list.0.entries,
                parent_path,
            }))
        }
    }
}
