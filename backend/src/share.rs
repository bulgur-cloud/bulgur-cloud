use actix_web::{
    get, route,
    web::{self, ReqData},
    HttpResponse,
};
use nanoid::nanoid;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set, TransactionTrait};
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
