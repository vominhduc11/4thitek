# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.0] - 2026-04-29

### Added — Backend
- Spring Boot 3.4.3 / Java 17 REST API with JWT auth, refresh-token sessions, role-based access (SUPER_ADMIN, ADMIN, DEALER)
- Flyway database migrations V1–V40 (PostgreSQL 16)
- SePay webhook integration: token verification, idempotency, unmatched-payment tracking
- Firebase FCM push notification dispatch (optional, flag-gated)
- S3/MinIO object storage for product images, blog media, and support attachments
- WebSocket realtime notifications (STOMP over SockJS)
- Redis-backed caching and rate limiting (auth, password-reset, warranty-lookup, upload, webhook endpoints)
- Scheduled jobs: pending-order timeout, blog auto-publish, inventory alert sweep, payment reconciliation, media asset cleanup
- Return request workflow with multi-step admin resolution and serial replacement tracing
- Support ticket system with threaded messages and media attachments
- Bulk discount tier management and wholesale pricing
- Audit log system with actor/action/entityType/entityId filtering
- OpenAPI docs (disabled by default in production; `APP_DOCS_PUBLIC_ENABLED=true` to enable)
- Actuator health endpoint at `/actuator/health`
- Bootstrap super-admin flow with production safety guard (`APP_ALLOW_PRODUCTION_BOOTSTRAP`)
- Demo data seeder (local/staging only; disabled by default)
- 80 backend tests (unit + integration)

### Added — Admin Dashboard (`admin-fe`)
- Vite + React 18 + TypeScript dashboard with Tailwind CSS
- Runtime API config via `runtime-config.js` (change `API_BASE_URL` without rebuild)
- Route-scoped lazy loading and page-level error boundaries
- Pages: Dashboard, Products, Serials, Orders, Dealers, Returns, Support Tickets, Warranties, Reports, Financial Settlements, Recent Payments, Unmatched Payments, Blogs, Public Content, Media Library, Notifications, Settings, Users, Wholesale Discounts, Audit Logs, Profile
- Bilingual UI (Vietnamese / English) with runtime language switcher
- Serial import from CSV/Excel
- WebSocket realtime notification badge
- Print styles for order printing (`@media print`)
- 22+ test files (pages + lib units)

### Added — Public Website (`main-fe`)
- Next.js 15 App Router, ISR, standalone Docker output
- Pages: Home, Products, Product Detail, Blogs, Blog Detail, Search, Warranty Check, Dealer Locator, About, Contact, Policy, Privacy Policy, Certification, Become Reseller, Reseller Information, Password Reset
- SEO: canonical metadata, Open Graph, sitemap.ts, robots.ts
- Permanent redirects for legacy URLs (`/warranty_check`, `/home`)
- Internal API rewrite proxy (`/api/v1/*` → backend)
- Google Analytics env-driven integration
- 12 test files

### Added — Dealer Mobile App (`dealer`)
- Flutter (GoRouter, flutter_localizations vi/en)
- Screens: Login, Dashboard, Products, Product Detail, Cart, Checkout, Orders, Order Detail, Warranties, Support Tickets, Notifications, Account, Account Settings, Change Password, App Preferences
- WebSocket realtime order/notification updates
- FCM push notifications (optional; graceful degradation without `google-services.json`)
- Android release signing via `key.properties` (not committed)
- 53 test files; coverage snapshot tracked

### Added — Infrastructure & DevOps
- Single `docker-compose.yaml` for local, staging, and production (fail-fast on missing secrets)
- Healthchecks for postgres, redis, minio, backend
- JSON log rotation (`max-size: 50m`, `max-file: 5`) on all services
- Nginx templates for 4 production vhosts: `4thitek.vn`, `admin.4thitek.vn`, `api.4thitek.vn`, `ws.4thitek.vn`
  - TLS 1.2/1.3, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
  - Swagger/OpenAPI endpoints blocked on public API vhost
  - Rate limiting on API gateway
- Multi-stage Dockerfiles for all four services
- CI workflow (GitHub Actions): secret-scan → backend verify → FE audit+test+build → Flutter analyze+test
- Weekly security scan: OWASP dependency-check (backend) + npm audit (FE)
- `secret-artifact-guard.yml` blocks dangerous file patterns on every push/PR
- `.gitleaks.toml` config for CI secret scanning

### Added — Documentation
- `README.md` with full setup, Docker Compose, and production deploy instructions
- `BUSINESS_LOGIC.md` — runtime truth contract (v2026-04-29)
- `docs/DEPLOYMENT_GUIDE.md` — environment model, secret checklist, nginx/SSL, smoke test
- `docs/RUNBOOK.md` — 8 incident procedures (backend, DB, Redis, MinIO, SePay, disk, SSL, rollback)
- `docs/BACKUP_RESTORE.md` — RPO/RTO targets, backup procedures, restore drill schedule
- `docs/SEPAY_WEBHOOK.md` — webhook setup, test checklist, reconciliation flow
- `docs/security/P0_SECRET_ROTATION_CHECKLIST.md` — post-incident rotation guide

### Security
- `.gitignore` P0 block: `.env*`, `*.jks`, `*.keystore`, `key.properties`, `service_account*.json`, `google-services.json`, auth dump files
- `tmp/`, `backups/`, `backend/uploads/` excluded from git tracking
- No hardcoded secrets; all credentials loaded from environment at runtime
- Strong JWT secret enforcement (`APP_SECURITY_REQUIRE_STRONG_JWT_SECRET=true`)
- Docs endpoints blocked on public production vhost
