# Observability Stack

## Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Grafana    │──────▶│  Prometheus  │──────▶│ Alertmanager │
│   :3000      │       │   :9090      │       │   :9093      │
└──────────────┘       └──────┬───────┘       └──────────────┘
                              │ scrape /actuator/prometheus
                       ┌──────▼───────┐
                       │  Tasky API   │
                       │   app:8080   │
                       └──────────────┘
```

- **Prometheus** scrapes the Tasky backend at `app:8080/actuator/prometheus` every 15 seconds, evaluates alert rules, and sends alerts to Alertmanager.
- **Grafana** visualises metrics from Prometheus. Pre-provisioned with a datasource and the Tasky Overview dashboard.
- **Alertmanager** receives alerts from Prometheus and routes them to a configurable webhook (or email/Slack).

## Running Locally

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d
```

This starts all infrastructure services **plus** the observability stack. The `app` service must be healthy before Prometheus begins scraping.

## Access URLs

| Service      | URL                   | Default credentials |
| ------------ | --------------------- | ------------------- |
| Grafana      | http://localhost:3000 | `admin` / `admin`   |
| Prometheus   | http://localhost:9090 | —                   |
| Alertmanager | http://localhost:9093 | —                   |

Override ports with environment variables: `GRAFANA_PORT`, `PROMETHEUS_PORT`, `ALERTMANAGER_PORT`.

## Adding to Production

The observability stack is designed as a Docker Compose overlay. Merge it with the production compose file:

```bash
docker compose \
  -f docker-compose.production.yml \
  -f docker-compose.observability.yml \
  up -d
```

For production, set these environment variables before starting:

```bash
GRAFANA_ADMIN_USER=<secure-user>
GRAFANA_ADMIN_PASSWORD=<secure-password>
ALERT_WEBHOOK_URL=<your-webhook-endpoint>
```

## Metric Endpoints

The Tasky backend exposes Spring Boot Actuator endpoints:

| Endpoint                     | Purpose                                |
| ---------------------------- | -------------------------------------- |
| `/actuator/prometheus`       | Prometheus-format metrics for scraping |
| `/actuator/health`           | Liveness and readiness probes          |
| `/actuator/health/liveness`  | Container liveness check               |
| `/actuator/health/readiness` | Readiness group check                  |

## Dashboards

### Tasky Overview (`tasky-overview`)

The default dashboard has four rows:

| Row              | Panels                                                                           |
| ---------------- | -------------------------------------------------------------------------------- |
| Service Health   | Up status (stat), JVM memory used (time series), HTTP request rate (time series) |
| API Performance  | Request duration p95 (time series), 5xx error rate (stat with thresholds)        |
| Authentication   | Auth request rate (time series), circuit breaker state (stat)                    |
| Business Metrics | Placeholder text panel with instructions to wire custom metrics                  |

**Metric → KPI mapping** (see `docs/METRICS.md` sections 11–12):

| Dashboard panel       | Actuator metric                                              | METRICS.md section  |
| --------------------- | ------------------------------------------------------------ | ------------------- |
| Up Status             | `up{job="tasky-api"}`                                        | §12 (API health)    |
| HTTP Request Rate     | `http_server_requests_seconds_count`                         | §12 (5xx rate)      |
| Request Duration p95  | `http_server_requests_seconds_bucket`                        | — (operational)     |
| 5xx Error Rate        | `http_server_requests_seconds_count{status=~"5.."}`          | §12 (5xx rate)      |
| Auth Request Rate     | `http_server_requests_seconds_count{uri=~"/api/v1/auth/.*"}` | §12 (Facebook auth) |
| Circuit Breaker State | `resilience4j_circuitbreaker_state`                          | §12 (Facebook auth) |

Business KPI panels are placeholders pending the event metrics pipeline (see below).

## Alert Rules

Alert rules live in `tooling/observability/prometheus/alerts/tasky-alerts.yml`.

### Operational alerts (active)

| Alert                  | Severity | Condition                                          | Response (per PRODUCTION_READINESS.md)              |
| ---------------------- | -------- | -------------------------------------------------- | --------------------------------------------------- |
| `APIHealthDown`        | critical | `up{job="tasky-api"} == 0` for 2m                  | SEV-1: freeze deploys, investigate immediately      |
| `High5xxRate`          | critical | >5% 5xx on `/api/v1/*` for 15m                     | SEV-1: roll back unless cause is isolated           |
| `FacebookAuthFailures` | critical | >30% error rate on `/api/v1/auth/facebook` for 10m | SEV-1: if real sign-in unavailable for launch users |

### Product KPI alerts (commented out — pending event metrics pipeline)

These are defined in the alert file as commented-out placeholders with the expected PromQL query pattern. Uncomment each rule once the corresponding custom metric is exported:

| Alert                   | KPI threshold                       | METRICS.md § |
| ----------------------- | ----------------------------------- | ------------ |
| `LiquidityScoreLow`     | category liquidity < 50% for 7 days | §11          |
| `ConversionRateLow`     | task-to-booking < 35% over 28 days  | §11          |
| `BookingCompletionLow`  | completion rate < 50% over 28 days  | §11          |
| `ReviewCompletionLow`   | review rate < 70% over 28 days      | §11          |
| `VerificationQueueSlow` | median turnaround > 24h             | §11          |
| `DisputeResolutionSlow` | median > 48h                        | §11          |
| `RepeatBookingLow`      | repeat rate < 15%                   | §11          |

All KPI alerts use `severity: warning`.

### Alert routing

Alertmanager routes all alerts to a webhook receiver configured via `ALERT_WEBHOOK_URL`. Critical alerts repeat every 1 hour; warning alerts repeat every 4 hours.

To configure email or Slack receivers, edit `tooling/observability/alertmanager/alertmanager.yml` and uncomment the relevant section.

## Adding New Panels

1. Edit `tooling/observability/grafana/dashboards/tasky-overview.json` (or create a new JSON file in the same directory).
2. Restart Grafana or wait for the provisioning refresh (30 seconds).
3. Grafana auto-discovers dashboards from `/var/lib/grafana/dashboards/`.

## Adding New Alert Rules

1. Edit `tooling/observability/prometheus/alerts/tasky-alerts.yml` (or add a new `.yml` file in `tooling/observability/prometheus/alerts/`).
2. Reload Prometheus config: `curl -X POST http://localhost:9090/-/reload` or restart the Prometheus container.

## File Layout

```
tooling/observability/
├── alertmanager/
│   └── alertmanager.yml
├── grafana/
│   ├── dashboards/
│   │   └── tasky-overview.json
│   └── provisioning/
│       ├── dashboards/
│       │   └── dashboard.yml
│       └── datasources/
│           └── datasource.yml
└── prometheus/
    ├── alerts/
    │   └── tasky-alerts.yml
    └── prometheus.yml
```
