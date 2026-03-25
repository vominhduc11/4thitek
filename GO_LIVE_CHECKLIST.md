# Go-Live Checklist — 4thitek Production

## 1. Environment Variables (Backend)

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | ✅ | Minimum 64-char random string. Generate: `openssl rand -base64 64` |
| `POSTGRES_PASSWORD` | ✅ | Strong password, not default |
| `REDIS_PASSWORD` | ✅ | Strong password |
| `MINIO_ROOT_USER` | ✅ | Admin access key |
| `MINIO_ROOT_PASSWORD` | ✅ | Admin secret |
| `APP_MAIL_ENABLED` | ⚠️ | Set `true` to enable email. Requires `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` |
| `APP_PASSWORD_RESET_BASE_URL` | ⚠️ | Set to `https://admin.4thitek.vn` for password-reset links to work |
| `APP_CORS_ALLOWED_ORIGIN_PATTERNS` | ⚠️ | Set to actual frontend domains, e.g. `https://4thitek.vn,https://admin.4thitek.vn` |
| `APP_SEED_DEMO_DATA` | ❌ | Must be `false` or unset in production |
| `SPRING_DATA_REDIS_HOST` | ⚠️ | Set to Redis host to enable caching and rate limiting |

## 2. SePay Webhook

- [ ] Log into admin dashboard → Settings → SePay section
- [ ] Set a strong `webhookToken` (random alphanumeric, minimum 32 chars)
- [ ] Configure SePay dashboard to POST to `https://api.4thitek.vn/api/v1/webhooks/sepay?token=<token>` OR set `X-Webhook-Token: <token>` header
- [ ] Test with a real bank transfer; verify order transitions to `PAID`

## 3. FCM Push Notifications (Dealer App)

- [ ] Generate Firebase service account key from Firebase Console
- [ ] Set `FIREBASE_SERVICE_ACCOUNT_KEY` env var (JSON inline or file path)
- [ ] Verify push reaches at least one test device before go-live
- [ ] Confirm `FCM_PROJECT_ID` matches the Firebase project

## 4. Reverse Proxy / TLS

- [ ] Nginx or Caddy in front of Docker stack (see `deploy/nginx/`)
- [ ] TLS certificate obtained and auto-renewal configured (Let's Encrypt / Certbot)
- [ ] `api.4thitek.vn` → backend:8080
- [ ] `admin.4thitek.vn` → admin-fe:80
- [ ] `4thitek.vn` → main-fe:3000
- [ ] `ws.4thitek.vn` → backend:8080 (WebSocket `/ws` path)
- [ ] HTTP → HTTPS redirect enforced on all vhosts
- [ ] Verify headers: `X-Forwarded-Proto`, `X-Real-IP` forwarded correctly

## 5. Database

- [ ] Run `./mvnw flyway:info` against production DB to confirm all 18 migrations applied
- [ ] Verify V18 (`add_scheduled_at_to_blogs`) is applied (uses `TIMESTAMPTZ`, requires PostgreSQL)
- [ ] Take a full backup before first deployment

## 6. Dealer Mobile App

- [ ] Update `ApiConfig` fallback URL if different from `https://api.4thitek.vn`
- [ ] Set correct `DEALER_API_BASE_URL` via `--dart-define` at build time if needed
- [ ] Build release APK/IPA and test against production backend
- [ ] Verify JWT auto-refresh (DealerAuthClient) works end-to-end

## 7. E2E Smoke Tests (Run after deployment)

### Auth
- [ ] Admin login → dashboard loads
- [ ] Dealer login → orders list loads
- [ ] Token refresh after session timeout

### Orders
- [ ] Create order from dealer app
- [ ] Admin sees order in list with correct status
- [ ] Record manual payment → payment status updates
- [ ] SePay webhook test payment → auto-matches order

### Blog
- [ ] Create blog post with `SCHEDULED` status + `scheduledAt`
- [ ] Wait for `BlogPublishJob` (60s cycle) → verify post auto-publishes
- [ ] Published post appears on `4thitek.vn/blogs`

### Adjustments
- [ ] Open an order in admin → create a `CORRECTION` adjustment
- [ ] Verify it appears in adjustment history table

### Dashboard
- [ ] Verify revenue, order counts, stale orders count are non-zero
- [ ] Verify unmatched payment alerts fire when there are pending payments

### Audit Logs
- [ ] Navigate to `/audit-logs` as SUPER_ADMIN → logs load
- [ ] Perform an action (e.g. update order status) → verify new log entry appears

## 8. Security Hardening

- [ ] Confirm rate limiting is active (Redis connected, `APP_RATE_LIMIT_ENABLED=true`)
- [ ] Confirm `APP_CORS_ALLOWED_ORIGIN_PATTERNS` does NOT include `*` in production
- [ ] Run OWASP dependency scan (`./mvnw verify -Pdependency-check`)
- [ ] Rotate all demo/default secrets

## 9. Monitoring

- [ ] Grafana / metrics endpoint configured (if applicable)
- [ ] PagerDuty or equivalent alert on 5xx rate spike
- [ ] DB connection pool metrics monitored (HikariCP)

---

_Last updated: 2026-03-25_
