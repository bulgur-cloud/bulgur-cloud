use actix_web::{
    get, head,
    web,
    HttpResponse
};

use serde::{Serialize, Serializer};
use crate::state::AppState;
use tracing;


fn serialize_duration<S>(duration: &chrono::Duration, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let formatted_duration = duration.to_string();
    serializer.serialize_str(&formatted_duration)
}

#[derive(Serialize)]
struct Stats {
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