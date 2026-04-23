# Observability Stack

## 1. Purpose

Tasky uses Prometheus, Grafana, and Alertmanager for operational telemetry, plus backend-exported business metrics for launch KPIs. KPI dashboards are part of the launch requirement, not a later convenience.

## 2. Stack

```text
Grafana -> Prometheus -> Alertmanager
                 ^
                 |
        Tasky API /actuator/prometheus
```

- Prometheus scrapes the Tasky backend every 15 seconds.
- Grafana visualizes operational and business KPI dashboards.
- Alertmanager routes alert traffic to the configured incident channel.

## 3. Running locally

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d
```

This starts the core infrastructure plus the observability stack. The app must be healthy before Prometheus scrapes it.

## 4. Metric sources

### 4.1 Operational metrics

- `/actuator/prometheus`
- `/actuator/health`
- `/actuator/health/liveness`
- `/actuator/health/readiness`

### 4.2 Business KPI metrics

The seven Phase 1 KPIs must be exported by the backend from canonical events and state transitions. Dashboard-only SQL or manual spreadsheet derivations are not sufficient for launch control.

Required conceptual exports align with `docs/METRICS.md`:

- `eligible_task`
- `qualified_application`
- `confirmed_booking`
- `completed_booking`
- `intervention`

## 5. Dashboard requirements

Grafana must include:

### 5.1 Operational dashboard

- API health and readiness
- HTTP request rate
- p95 request latency
- 5xx rate
- Facebook auth failure posture
- push / notification delivery posture when relevant

### 5.2 Launch KPI dashboard

All seven Phase 1 KPIs must be present:

1. Self-Serve Fulfillment Rate
2. Qualified Match Rate within 24h
3. Post -> Confirmed Booking Rate within 48h
4. Booking Completion Rate
5. Intervention Rate
6. Trust Failure Rate
7. Verification Queue Turnaround

Required supporting views:

- category as the primary slice
- district as drilldown
- median time to first qualified application
- median posting-to-confirmed-booking time
- booking failure reasons
- intervention type and stage breakdowns

## 6. Alert policy

Alert rules live in `tooling/observability/prometheus/alerts/tasky-alerts.yml`.

### 6.1 Required hard-gate KPI alerts

| Alert family        | Condition                                                      |
| ------------------- | -------------------------------------------------------------- |
| Qualified match low | threshold breach for Qualified Match Rate within 24h           |
| Post-to-booking low | threshold breach for Post -> Confirmed Booking Rate within 48h |
| Intervention high   | threshold breach for Intervention Rate                         |
| Trust failure high  | threshold breach for Trust Failure Rate                        |

These alerts are required before launch.

### 6.2 Required operational alerts

| Alert family           | Condition                                                  |
| ---------------------- | ---------------------------------------------------------- |
| API health down        | backend unavailable or readiness failing                   |
| High 5xx rate          | sustained elevated server errors on launch-critical routes |
| Facebook auth failures | real-user sign-in degraded or unavailable                  |

Operational alerts and KPI alerts should route through Alertmanager to the configured incident channel.

## 7. File layout

```text
tooling/observability/
├── alertmanager/
├── grafana/
└── prometheus/
```

## 8. Policy notes

- KPI dashboards must exist before launch.
- Hard-gate alerts are mandatory; monitored metrics do not require paging alerts.
- The dashboard, alert rules, and metric vocabulary must remain aligned with `docs/METRICS.md`.
