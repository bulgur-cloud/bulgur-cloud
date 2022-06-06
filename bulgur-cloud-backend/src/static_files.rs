use std::path::PathBuf;

use actix_web::{get, head, web, HttpResponse};
use rust_embed::RustEmbed;

use crate::pages::not_found;

fn extension_to_content_type(path: &str) -> Option<&'static str> {
    let path = PathBuf::from(path);
    let extension = path.extension().and_then(|extension| extension.to_str());
    if let Some(extension) = extension {
        return match extension {
            "css" => Some("text/css"),
            "svg" => Some("image/svg+xml"),
            "js" => Some("application/javascript"),
            "json" => Some("application/json"),
            "map" => Some("application/json"),
            "png" => Some("image/png"),
            "jpg" => Some("image/jpeg"),
            "jpeg" => Some("image/jpeg"),
            "html" => Some("text/html"),
            "ico" => Some("image/x-icon"),
            "ttf" => Some("font/ttf"),
            _ => None,
        };
    }
    None
}

async fn get_by_path<T: RustEmbed>(path: &str) -> HttpResponse {
    let file = T::get(path);
    match file {
        Some(file) => {
            let mut response = HttpResponse::Ok();
            if let Some(content_type) = extension_to_content_type(path) {
                response.content_type(content_type);
            }
            // TODO: should cache the file vectors
            response.body(file.data.to_vec())
        }
        None => not_found().await,
    }
}

/// Serves the web UI.
#[derive(RustEmbed)]
#[folder = "../bulgur-cloud-frontend/web-build/"]
struct UI;

#[tracing::instrument]
#[get("/")]
pub async fn get_ui_index() -> HttpResponse {
    get_by_path::<UI>("index.html").await
}

#[tracing::instrument]
#[head("/")]
pub async fn head_ui_index() -> HttpResponse {
    HttpResponse::Ok().finish()
}

#[tracing::instrument]
#[get("/{path:.*}")]
pub async fn get_ui(params: web::Path<String>) -> HttpResponse {
    if params.starts_with("s/") {
        get_by_path::<UI>("index.html").await
    } else {
        get_by_path::<UI>(params.as_str()).await
    }
}

/// Serves the static assets required for the basic web UI.
#[derive(RustEmbed)]
#[folder = "assets/"]
struct Basic;

#[tracing::instrument]
#[get("/basic/assets/{path:.*}")]
pub async fn get_basic_assets(params: web::Path<String>) -> HttpResponse {
    get_by_path::<Basic>(params.as_str()).await
}
