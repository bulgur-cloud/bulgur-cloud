use actix_web::{route, web};
use actix_web_rust_embed_responder::{EmbedResponse, EmbedableFileResponse, IntoResponse};
use rust_embed_for_web::RustEmbed;

/// Serves the web UI.
#[derive(RustEmbed)]
#[folder = "../frontend/out/"]
#[gzip = "false"]
struct UI;

#[tracing::instrument]
#[route("/{path:.*}", method = "GET", method = "HEAD")]
pub async fn ui_pages(path: web::Path<String>) -> EmbedResponse<EmbedableFileResponse> {
    if path.is_empty() {
        UI::get("index.html").into_response()
    } else if path.starts_with("s/") || path.as_str() == "s" {
        UI::get("s/[[...slug]].html").into_response()
    } else {
        // first try to serve the file as is
        let direct = UI::get(path.as_str());
        if let Some(direct) = direct {
            direct.into_response()
        } else {
            // if it's missing, also try the .html
            UI::get(&format!("{path}.html")).into_response()
        }
    }
}

/// Serves the static assets required for the basic web UI.
#[derive(RustEmbed)]
#[folder = "assets/"]
#[gzip = "false"]
struct Basic;

#[tracing::instrument]
#[route("/basic/assets/{path:.*}", method = "GET", method = "HEAD")]
pub async fn get_basic_assets(params: web::Path<String>) -> EmbedResponse<EmbedableFileResponse> {
    Basic::get(params.as_str()).into_response()
}
