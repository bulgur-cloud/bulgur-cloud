---
id: 658io7uxt1rps9l82agplpp
title: Telemetry
desc: ""
updated: 1651726632595
created: 1651725385847
---

Bulgur Cloud has optional support for
[OpenTelemetry](https://opentelemetry.io/). Right now the telemetry is
backend-only. You can put the telemetry into an OpenTelemetry compatible service
such as [HoneyComb](https://www.honeycomb.io/) or
[Jaeger](https://www.jaegertracing.io/) to inspect the latency, error rate, and
more.

The configuration for this is done through environment variables. You set
`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_SERVICE_NAME` to set the endpoint to
send to, and what this service should be named. You **must** set
`OTEL_SERVICE_NAME`, if it is not set then telemetry will not activate.

You'll probably need to set some headers to authenticate with the OpenTelemetry
service, which you can do by setting them as a header. You'll need to prefix the
header name with `OTEL_META_`, uppercase the header name, and replace dashes
with underscores.

## Example for HoneyComb.io

```sh
export OTEL_META_X_HONEYCOMB_TEAM="your api key here"
export OTEL_META_X_HONEYCOMB_DATASET="pick a dataset name"
export OTEL_SERVICE_NAME="pick a service name"
export OTEL_EXPORTER_OTLP_ENDPOINT="https://api.honeycomb.io/v1/traces"
```
