# Rehearsal Log

> Evidence of staging rehearsals, rollback drills, and deploy verifications.
> Each entry records who, when, what was tested, and the outcome.

## Deploy rehearsal entries

| #   | Date       | Environment | Tag / commit   | Operator | Smoke result | Duration | Notes                                                                                          |
| --- | ---------- | ----------- | -------------- | -------- | ------------ | -------- | ---------------------------------------------------------------------------------------------- |
| 1   | 2026-05-11 | Staging     | `main@6b66a26` | norbu    | PASS         | ~8 min   | Full stack deploy: app + web + postgres + caddy. Health UP, metrics scraping, frontend 200 OK. |

### Entry 1 detail — Staging deploy (2026-05-11)

**Environment:** Docker Compose staging (single VPS)

**Steps executed:**

1. `docker compose -f docker-compose.production.yml pull` — all images pulled
2. `docker compose -f docker-compose.production.yml up -d --remove-orphans` — all containers started
3. Health check: `curl -sf http://localhost:8080/actuator/health` → `{"status":"UP"}`
4. Metrics: `curl -sf http://localhost:8080/actuator/prometheus | grep -c jvm_memory` → positive count
5. Frontend: `curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`

**Result:** PASS — all services healthy, no errors in logs.

---

## Rollback drill entries

| #   | Date       | Environment | Scenario                   | Operator | Time to detect  | Time to restore | Notes                                 |
| --- | ---------- | ----------- | -------------------------- | -------- | --------------- | --------------- | ------------------------------------- |
| 1   | 2026-05-11 | Staging     | Deliberately broken deploy | norbu    | ~2 min (manual) | ~5 min          | Quick rollback via previous image tag |

### Rollback drill 1 detail (2026-05-11)

**Scenario:** Deployed an image with a deliberately broken health endpoint (returns 500).

**Steps executed:**

1. Deployed broken image: `docker compose -f docker-compose.production.yml up -d app`
2. Observed health failure: `curl http://localhost:8080/actuator/health` → `503`
3. Rolled back to previous image tag in `.env`
4. `docker compose -f docker-compose.production.yml pull app && docker compose -f docker-compose.production.yml up -d app --no-deps`
5. Health restored: `curl http://localhost:8080/actuator/health` → `{"status":"UP"}`

**Total time from detection to restored service:** ~5 minutes (within 15-minute target).

**Lesson learned:** Keep a record of the last-known-good image tag in `.env` at all times to speed up rollback.

---

## Restore drill entries

| #   | Date         | Backup file     | Rows verified | Restore time | Operator | Notes                        |
| --- | ------------ | --------------- | ------------- | ------------ | -------- | ---------------------------- |
| _1_ | _YYYY-MM-DD_ | _tasky-\*.dump_ | _users: N_    | _Xm Ys_      | _name_   | _e.g., "All tables present"_ |
