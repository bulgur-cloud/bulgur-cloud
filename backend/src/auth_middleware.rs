use std::future::{ready, Ready};
use std::rc::Rc;

use actix_web::body::EitherBody;
use actix_web::dev::{self, ServiceRequest, ServiceResponse};
use actix_web::dev::{Service, Transform};
use actix_web::{http, web, Error, HttpMessage, HttpRequest, HttpResponse};
use futures::future::LocalBoxFuture;
use qstring::QString;
use serde::Serialize;
use tracing_unwrap::ResultExt;

use crate::state::{AppState, Authorized, Token};

#[derive(Clone)]
pub struct CheckLogin {
    /// The state of the application.
    pub state: web::Data<AppState>,
    /// If true, path tokens attached as query parameters `?token=...` will be
    /// accepted as long as the token is correct for the given path
    pub allow_path_tokens: bool,
}

impl<S: 'static, B> Transform<S, ServiceRequest> for CheckLogin
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = CheckLoginMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(CheckLoginMiddleware {
            service: Rc::new(service),
            state: self.state.clone(),
            allow_path_tokens: self.allow_path_tokens,
        }))
    }
}
pub struct CheckLoginMiddleware<S> {
    service: Rc<S>,
    state: web::Data<AppState>,
    allow_path_tokens: bool,
}

impl<S: 'static, B> Service<ServiceRequest> for CheckLoginMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    dev::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let state = self.state.clone();
        let (request, payload) = req.into_parts();
        let service = self.service.clone();

        // The user token could be either in the header or the cookie, we allow both.
        let user_token =
            get_token_from_header(&request).or_else(|| get_token_from_cookie(&request));
        // Path tokens are part of the query path.
        let path_token = if self.allow_path_tokens {
            get_token_from_query(&request)
        } else {
            None
        };

        Box::pin(async move {
            match verify_auth(state, user_token, path_token, request.path()).await {
                Ok(authorized) => {
                    tracing::debug!("Request authorized, inserting authorization token");
                    request.extensions_mut().insert(authorized);
                    let service_request =
                        service.call(ServiceRequest::from_parts(request, payload));
                    service_request
                        .await
                        .map(ServiceResponse::map_into_left_body)
                }
                Err(err) => {
                    let response = HttpResponse::Unauthorized().json(err).map_into_right_body();

                    Ok(ServiceResponse::new(request, response))
                }
            }
        })
    }
}

#[derive(Debug, Serialize, thiserror::Error)]
enum AuthMiddlewareError {
    #[error("Auth token is missing or invalid, but authorization is required for this route.")]
    Failed,
}
type AuthMiddlewareResult<T> = std::result::Result<T, AuthMiddlewareError>;

#[tracing::instrument(skip(state))]
/// If the user token is valid, returns the user. If user token is missing or is invalid, then tries the path token.
/// If the path token is valid for the given path, then returns Either::Right.
/// If the path token is missing or invalid too, then returns `AuthMiddlewareError.TokenMissing`.
async fn verify_auth(
    state: web::Data<AppState>,
    user_token: Option<Token>,
    path_token: Option<Token>,
    path: &str,
) -> AuthMiddlewareResult<Authorized> {
    tracing::trace!("Starting to verify user");

    let username = if let Some(user_token) = user_token {
        tracing::debug!("Found user token attached to request");
        let username = state
            .access_tokens
            .get(user_token.reveal())
            .await
            .unwrap_or_log();
        username
    } else {
        None
    };

    let path_authorized = (if let Some(path_token) = path_token {
        if let Ok(path) = urlencoding::decode(path) {
            tracing::debug!("Found path token attached to request {:?}", path);
            let known_token = state.path_tokens.get(&path).await.unwrap_or_log();
            tracing::debug!("Token exists for path {:?}", &path);
            known_token.map(|known_token| known_token.eq(&path_token))
        } else {
            None
        }
    } else {
        None
    })
    .unwrap_or(false);

    if let Some(username) = username {
        if path_authorized {
            tracing::debug!("Authorized path and user");
            Ok(Authorized::Both(username))
        } else {
            tracing::debug!("Authorized user");
            Ok(Authorized::User(username))
        }
    } else if path_authorized {
        tracing::debug!("Authorized path");
        Ok(Authorized::Path)
    } else {
        tracing::debug!("Authorization failed");
        Err(AuthMiddlewareError::Failed)
    }
}

fn get_token_from_header(request: &HttpRequest) -> Option<Token> {
    let header_token = request.headers().get(http::header::AUTHORIZATION);
    if let Some(token) = header_token {
        let token_str = token.to_str();
        if let Ok(token) = token_str {
            return Some(Token::read(token));
        }
    }
    None
}

pub static AUTH_COOKIE_NAME: &str = "bulgur-cloud-auth";

fn get_token_from_cookie(request: &HttpRequest) -> Option<Token> {
    let header_token = request.cookie(AUTH_COOKIE_NAME);
    if let Some(token) = header_token {
        return Some(Token::read(token.value()));
    }
    None
}

fn get_token_from_query(request: &HttpRequest) -> Option<Token> {
    if !request.method().is_safe() {
        return None;
    }
    let query = QString::from(request.query_string());
    let query_token = query.get("token");
    if let Some(token) = query_token {
        return Some(Token::read(token));
    }
    None
}
