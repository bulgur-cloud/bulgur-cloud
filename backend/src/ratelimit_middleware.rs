use std::future::{ready, Ready};
use std::num::NonZeroU32;
use std::rc::Rc;
use std::sync::Arc;
use std::time::Instant;

use actix_web::body::EitherBody;
use actix_web::dev::{self, ServiceRequest, ServiceResponse};
use actix_web::dev::{Service, Transform};
use actix_web::http::header;
use actix_web::{Error, HttpResponse};
use futures::future::LocalBoxFuture;
use governor::clock::MonotonicClock;
use governor::middleware::NoOpMiddleware;
use governor::state::keyed::DefaultKeyedStateStore;
use governor::{Quota, RateLimiter};

type Limiter =
    RateLimiter<String, DefaultKeyedStateStore<String>, MonotonicClock, NoOpMiddleware<Instant>>;

#[derive(Clone)]
pub struct RateLimit {
    limiter: Arc<Limiter>,
}

impl RateLimit {
    pub fn new() -> Self {
        RateLimit {
            limiter: Arc::new(RateLimiter::keyed(Quota::per_minute(
                NonZeroU32::new(10).unwrap(),
            ))),
        }
    }
}

impl<S: 'static, B> Transform<S, ServiceRequest> for RateLimit
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = RateLimitMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RateLimitMiddleware {
            service: Rc::new(service),
            limiter: self.limiter.clone(),
        }))
    }
}
pub struct RateLimitMiddleware<S> {
    service: Rc<S>,
    limiter: Arc<Limiter>,
}

impl<S: 'static, B> Service<ServiceRequest> for RateLimitMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    dev::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let ip = req
            .head()
            .peer_addr
            .map(|v| v.to_string())
            .unwrap_or_else(|| "".to_string());

        let service = self.service.clone();
        let limiter = self.limiter.clone();

        Box::pin(async move {
            match limiter.check_key(&ip) {
                Ok(_) => service
                    .call(req)
                    .await
                    .map(ServiceResponse::map_into_left_body),
                Err(not_until) => {
                    let retry_after = not_until.wait_time_from(Instant::now()).as_secs();
                    let response = HttpResponse::TooManyRequests()
                        .append_header((header::RETRY_AFTER, retry_after))
                        .body(format!(
                            "Too many requests, retry after {retry_after} seconds"
                        ))
                        .map_into_right_body();
                    Ok(req.into_response(response))
                }
            }
        })
    }
}
