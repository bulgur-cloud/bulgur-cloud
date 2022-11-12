use std::path::PathBuf;

use actix_web::{get, route, web, HttpResponse};
use actix_web_rust_embed_responder::{EmbedResponse, EmbedableFileResponse, IntoResponse};
use rust_embed_for_web::{EmbeddedFile, RustEmbed};

use crate::pages::not_found;

/// Serves the web UI.
#[derive(RustEmbed)]
#[folder = "../bulgur-cloud-frontend/web-build/"]
#[gzip = "false"]
struct UI;

#[tracing::instrument]
#[route("/{path:.*}", method = "GET", method = "HEAD")]
pub async fn ui_pages(path: web::Path<String>) -> EmbedResponse<EmbedableFileResponse> {
    let path = if path.is_empty() || path.starts_with("s/") {
        "index.html"
    } else {
        path
    };
    UI::get(path).into_response()
}

/// Serves the static assets required for the basic web UI.
#[derive(RustEmbed)]
#[folder = "assets/"]
#[gzip = "false"]
struct Basic;

#[tracing::instrument]
#[get("/basic/assets/{path:.*}")]
pub async fn get_basic_assets(params: web::Path<String>) -> EmbedResponse<EmbedableFileResponse> {
    Basic::get(params.as_str()).into_response()
}
