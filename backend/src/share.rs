use actix_web::{
    delete, get, route,
    web::{self, ReqData},
    HttpResponse,
};
use nanoid::nanoid;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, ModelTrait, QueryFilter, QuerySelect, Set,
    TransactionTrait,
};
use serde::Deserialize;
use tracing_unwrap::{OptionExt, ResultExt};

use crate::{
    entity::{sharing, user},
    state::{AppState, Authentication},
    storage::{get_authorized_path, parse_params, StorageError},
};
#[cfg(feature = "generate_types")]
use typescript_type_def::TypeDef;

#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct CreateShareData {
    pub with_user: Option<String>,
}

#[tracing::instrument]
#[route("/{store_and_path:.*}", method = "SHARE")]
async fn create_share(
    params: web::Path<String>,
    authentication: Option<ReqData<Authentication>>,
    data: web::Json<CreateShareData>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, StorageError> {
    let (store, path) = parse_params(&params);
    let store_path = get_authorized_path(&authentication, store, path, false)?;

    match authentication.as_deref() {
        Some(Authentication {
            user: Some(user),
            path_token: _,
            share_token: _,
        }) => {
            if !user.username.eq(store) {
                tracing::info!(
                    "User {} is not authorized to share {}",
                    user.username,
                    store
                );
                return Err(StorageError::NotAuthorized);
            }

            let db = state.db.begin().await.unwrap_or_log();

            let shared_user_id = match data.with_user {
                Some(ref username) => {
                    let user = user::Entity::find()
                        .filter(user::Column::Username.eq(username))
                        .one(&db)
                        .await
                        .unwrap_or_log()
                        .unwrap_or_log();
                    Some(user.id)
                }
                None => None,
            };

            let now = chrono::Utc::now().to_rfc3339();
            let new_share = sharing::ActiveModel {
                id: Set(nanoid!()),
                path: Set(store_path.to_str().unwrap_or_log().to_string()),
                shared_by_user_id: Set(user.user_id.to_owned()),
                created_at: Set(now.to_owned()),
                updated_at: Set(now.to_owned()),
                expires_at: Set(None),
                shared_with_user_id: Set(shared_user_id),
            };
            new_share.save(&db).await.unwrap_or_log();

            db.commit().await.unwrap_or_log();
            Ok(HttpResponse::Ok().body(""))
        }
        _ => return Err(StorageError::NotAuthorized),
    }
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct Share {
    pub path: String,
    pub by_user: String,
    pub token: String,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct GetSharesResponse {
    pub shares: Vec<Share>,
    pub bookmark: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetSharesQuery {
    bookmark: Option<String>,
}

const SHARES_COUNT: u64 = 50;

#[tracing::instrument]
#[get("/shares")]
async fn get_shares(
    state: web::Data<AppState>,
    authentication: ReqData<Authentication>,
    query: web::Query<GetSharesQuery>,
) -> HttpResponse {
    match &authentication.user {
        Some(user) => {
            let mut shares_query = sharing::Entity::find()
                .filter(sharing::Column::SharedWithUserId.eq(&user.user_id))
                .limit(SHARES_COUNT);
            if let Some(bookmark) = &query.bookmark {
                shares_query = shares_query.filter(sharing::Column::Id.gt(bookmark))
            }
            let shares = shares_query
                .all(&state.db)
                .await
                .unwrap_or_log()
                .iter()
                .map(|s| Share {
                    path: s.path.to_owned(),
                    by_user: s.shared_by_user_id.to_owned(),
                    token: s.id.to_owned(),
                })
                .collect::<Vec<Share>>();

            let bookmark = if (shares.len() as u64) < SHARES_COUNT {
                None
            } else {
                Some(shares.last().unwrap().path.to_owned())
            };
            HttpResponse::Ok().json(GetSharesResponse { shares, bookmark })
        }
        None => HttpResponse::Unauthorized().body(""),
    }
}

#[tracing::instrument]
#[get("/shares/{share_path:.*}")]
async fn get_share_by_path(
    state: web::Data<AppState>,
    authentication: ReqData<Authentication>,
    share_path: web::Path<String>,
) -> HttpResponse {
    match &authentication.user {
        Some(user) => {
            let share = sharing::Entity::find()
                .filter(sharing::Column::Path.eq(share_path.to_string()))
                .filter(sharing::Column::SharedWithUserId.eq(&user.user_id))
                .one(&state.db)
                .await
                .unwrap_or_log();

            if let Some(share) = share {
                HttpResponse::Ok().json(Share {
                    by_user: user.username.to_owned(),
                    path: share.path.to_owned(),
                    token: share.id.to_owned(),
                })
            } else {
                HttpResponse::NotFound().body("")
            }
        }
        None => HttpResponse::Unauthorized().body(""),
    }
}

#[tracing::instrument]
#[delete("/shares/{share_path:.*}")]
async fn delete_share(
    state: web::Data<AppState>,
    authentication: ReqData<Authentication>,
    share_path: web::Path<String>,
) -> HttpResponse {
    match &authentication.user {
        Some(user) => {
            let tx = state.db.begin().await.unwrap_or_log();
            let share = sharing::Entity::find()
                .filter(sharing::Column::Path.eq(share_path.to_string()))
                .filter(sharing::Column::SharedByUserId.eq(&user.user_id))
                .one(&tx)
                .await
                .unwrap_or_log();

            if let Some(share) = share {
                share.delete(&tx).await.unwrap_or_log();
                tx.commit().await.unwrap_or_log();
                HttpResponse::Ok().body("")
            } else {
                tx.commit().await.unwrap_or_log();
                HttpResponse::NotFound().body("")
            }
        }
        None => HttpResponse::Unauthorized().body(""),
    }
}
