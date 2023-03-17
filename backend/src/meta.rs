use std::path::PathBuf;

use actix_files::NamedFile;
use actix_web::{get, head, web, HttpResponse};

use crate::{folder::BANNER, state::AppState};
use serde::{Serialize, Serializer};
use tracing;

fn serialize_duration<S>(duration: &chrono::Duration, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let formatted_duration = duration.to_string();
    serializer.serialize_str(&formatted_duration)
}

#[derive(Serialize)]
pub struct Stats {
    #[serde(serialize_with = "serialize_duration")]
    pub uptime: chrono::Duration,
}

#[get("/stats")]
#[tracing::instrument(skip(state))]
async fn get_stats(state: web::Data<AppState>) -> web::Json<Stats> {
    web::Json(Stats {
        uptime: chrono::Local::now() - state.started_at,
    })
}

#[head("/stats")]
#[tracing::instrument(skip(_state))]
async fn head_stats(_state: web::Data<AppState>) -> HttpResponse {
    HttpResponse::Ok().finish()
}

#[head("/is_bulgur_cloud")]
#[tracing::instrument]
async fn is_bulgur_cloud() -> HttpResponse {
    HttpResponse::Ok().finish()
}

#[get("/login")]
async fn get_banner_login() -> Result<NamedFile, std::io::Error> {
    let banner_path = PathBuf::from(BANNER).join("login.txt");
    NamedFile::open_async(banner_path).await
}

#[get("/page")]
async fn get_banner_page() -> Result<NamedFile, std::io::Error> {
    let banner_path = PathBuf::from(BANNER).join("page.txt");
    NamedFile::open_async(banner_path).await
}
