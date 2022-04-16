use actix_web::{cookie::Cookie, get, post, web, HttpResponse};

use askama_actix::Template;
use rust_embed::RustEmbed;
use serde::Deserialize;
use tracing_unwrap::OptionExt;

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
    password: String,
}

static AUTH_COOKIE_NAME: &'static str = "auth";

#[post("/")]
pub async fn page_login_post(form: web::Form<LoginFormData>) -> HttpResponse {
    HttpResponse::SeeOther()
        .cookie(Cookie::new(AUTH_COOKIE_NAME, form.password.clone()))
        .append_header(("Location", format!("/page/{}/", form.username)))
        .finish()
}

#[derive(Template)]
#[template(path = "folder-list.html")]
pub struct FolderListPage {
    username: String,
    folder_list: Vec<String>,
}

#[get("/page/{store}/{path:.*}")]
pub async fn page_folder_list() -> FolderListPage {
    FolderListPage {
        username: "user".to_string(),
        folder_list: vec!["foo".to_string(), "bar".to_string()],
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
