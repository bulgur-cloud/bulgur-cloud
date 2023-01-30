use bulgur_cloud::{
    cli::{cli_command, CLITerminalContext, Opt},
    server::{setup_app, setup_app_deps},
};

use clap::StructOpt;

use cuttlestore::CuttlestoreBuilder;
#[cfg(feature = "telemetry_opentelemetry")]
use opentelemetry_otlp::WithExportConfig;
#[cfg(feature = "telemetry_opentelemetry")]
use tonic::metadata::{MetadataKey, MetadataMap};
use tracing_unwrap::ResultExt;

use std::{env, str::FromStr};

use actix_web::HttpServer;

use tracing::subscriber::set_global_default;
use tracing_bunyan_formatter::{BunyanFormattingLayer, JsonStorageLayer};
use tracing_subscriber::{layer::SubscriberExt, EnvFilter, Registry};

fn setup_logging() {
    // Wow, thanks Luca Palmieri! https://www.lpalmieri.com/posts/2020-09-27-zero-to-production-4-are-we-observable-yet/

    // We are falling back to printing all spans at info-level or above
    // if the RUST_LOG environment variable has not been set.
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let formatting_layer = BunyanFormattingLayer::new(
        "bulgur-cloud".into(),
        // Output the formatted spans to stdout.
        std::io::stdout,
    );

    // The `with` method is provided by `SubscriberExt`, an extension
    // trait for `Subscriber` exposed by `tracing_subscriber`
    let subscriber = Registry::default()
        .with(env_filter)
        .with(JsonStorageLayer)
        .with(formatting_layer);

    #[cfg(feature = "telemetry_opentelemetry")]
    {
        if env::var("OTEL_SERVICE_NAME").is_ok() {
            const OTEL_HEADER_PREFIX: &str = "OTEL_META_";

            let mut meta = MetadataMap::new();
            for (key, value) in env::vars()
                .filter(|(name, _)| name.starts_with(OTEL_HEADER_PREFIX))
                .map(|(name, value)| {
                    let header_name = name
                        .strip_prefix(OTEL_HEADER_PREFIX)
                        .map(|h| h.replace('_', "-"))
                        .map(|h| h.to_ascii_lowercase())
                        .unwrap();
                    (header_name, value)
                })
            {
                meta.insert(MetadataKey::from_str(&key).unwrap(), value.parse().unwrap());
            }

            let exporter = opentelemetry_otlp::new_exporter()
                .tonic()
                .with_env()
                .with_metadata(meta);
            let tracer = opentelemetry_otlp::new_pipeline()
                .tracing()
                .with_exporter(exporter)
                .install_batch(opentelemetry::runtime::Tokio)
                .expect("Failed to create opentelemetry tracer");
            let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);

            set_global_default(subscriber.with(telemetry)).expect("Failed to set up logging");
        } else {
            set_global_default(subscriber).expect("Failed to set up logging");
        }
    }
    #[cfg(not(feature = "telemetry_opentelemetry"))]
    {
        set_global_default(subscriber).expect("Failed to set up logging");
    }
}

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    let opts = Opt::parse();
    match &opts.command {
        Some(_) => {
            // Running a CLI command
            cli_command::<CLITerminalContext>(opts).await?;
        }
        None => {
            // Running the server
            let connections = CuttlestoreBuilder::new(opts.datastore)
                .finish_connection()
                .await?;
            let (state, login_governor) =
                setup_app_deps(env::current_dir().unwrap_or_log(), &connections).await?;
            setup_logging();

            HttpServer::new(move || setup_app(state.clone(), login_governor.clone()))
                .bind(opts.bind)?
                .workers(opts.workers)
                .run()
                .await?;
        }
    };
    Ok(())
}
