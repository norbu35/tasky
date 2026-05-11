# Service Level Objectives (SLO)

> Phase 1 SLOs for the Tasky platform. Last updated: 2026-05-11.

## Availability

**Target:** 99.0% monthly uptime (≤ 7.3 hours downtime/month)

Measured as: successful HTTP responses (non-5xx) on health check + critical API paths.

## Latency targets (P95)

| Endpoint class              | P95 target |
| --------------------------- | ---------- |
| Auth (login, token refresh) | ≤ 500 ms   |
| Task CRUD                   | ≤ 800 ms   |
| Booking lifecycle           | ≤ 1 000 ms |
| Messaging                   | ≤ 600 ms   |
| Admin operations            | ≤ 1 200 ms |
| Static assets (Caddy)       | ≤ 100 ms   |

## Error budget

Monthly error budget at 99.0%: **7.3 hours** of allowed downtime.

### Burn rate policy

| Burn rate | Window  | Action                   |
| --------- | ------- | ------------------------ |
| > 14.4×   | 5 min   | Page immediately (SEV-1) |
| > 6×      | 30 min  | Page on-call (SEV-2)     |
| > 1×      | 6 hours | Ticket for investigation |

Burn rate = (actual error rate) / (1 − SLO target).

## Error rate threshold

**SLO:** ≤ 1% 5xx error rate on `/api/v1/*` endpoints, measured over 15-minute rolling window.

Alert `High5xxRate` fires at > 5% for 15 min (exceeds error budget).

## Key metrics

- `http_server_requests_seconds_count` — request volume by status and endpoint
- `tasky_backup_last_success_unixtime` — backup freshness
- `hikaricp_connections_active` — DB pool pressure
- `jvm_memory_used_bytes` — memory health

## OpenTelemetry tracing

**Decision:** Explicitly deferred to post-launch (P2-08). Phase 1 relies on structured logs with correlation IDs (`traceId`, `correlationId` in MDC) and Prometheus metrics. Full distributed tracing will be evaluated in Q3 2026.

## Status page

**Decision:** No dedicated status page for Phase 1. The founding team is small and the operator can post updates via the Telegram channel used for alerting. If uptime needs grow, evaluate hosted options (Instatus, Better Stack) post-launch.

Manual update procedure:

1. Post to the Telegram alert channel: "🟡 Investigating: <brief description>"
2. Update when resolved: "🟢 Resolved: <brief description> + root cause summary"
