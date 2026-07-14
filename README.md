# 4thitek Monorepo

Monorepo gom 4 phan chinh:

- `backend`: Spring Boot API, Flyway migration, in-memory cache/rate limit, OpenAPI va audit logging.
- `dealer`: Flutter dealer hub voi GoRouter, generated l10n va widget/unit tests.
- `main-fe`: Next.js public website voi ISR, sitemap/robots, canonical metadata va analytics env-driven.
- `admin-fe`: Vite admin dashboard voi runtime API config, route-scoped loading va page-level error boundary.

## Tai khoan demo

Demo seed chi duoc phep cho local/staging va khong hardcode password trong repo.

- Bat seed: `APP_SEED_DEMO_DATA=true`
- Bat buoc set password manh: `APP_SEED_DEMO_PASSWORD=<strong-password>`
- Tuyet doi khong bat demo seed trong production.

## Chay local

### Backend

1. Tao file `.env` tu [backend/.env.example](backend/.env.example) va dien it nhat `JWT_SECRET` truoc khi chay.
2. Chay:

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

Mac dinh backend mo o `http://localhost:8080`.

- Bootstrap SUPER_ADMIN mac dinh tat (`app.bootstrap-super-admin.enabled=false`).
- Chi bat bootstrap khi can khoi tao lan dau: `APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=true` + email/password manh.
- Trong production profile, bootstrap bi chan mac dinh tru khi set ro `APP_ALLOW_PRODUCTION_BOOTSTRAP=true`.
- Swagger/OpenAPI chi mo khi bat `APP_DOCS_PUBLIC_ENABLED=true`.

### Main website

1. Tao `main-fe/.env.local` tu [main-fe/.env.example](main-fe/.env.example).
2. Chay:

```bash
cd main-fe
npm install
npm run dev
```

### Dealer app

Xem huong dan chi tiet trong [dealer/README.md](dealer/README.md).

### Admin dashboard

```bash
cd admin-fe
npm install
npm run dev
```

Admin dashboard doc `runtime-config.js` luc start container, nen co the doi `API_BASE_URL` khi deploy ma khong can rebuild image.

## Docker Compose

Chi co mot file: `docker-compose.yaml` dung cho local, staging va production.

### Chay local

```bash
cp .env.example .env
# Bat buoc doi: POSTGRES_PASSWORD,
#               MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, JWT_SECRET
# Xem comment trong .env.example de biet cach generate JWT_SECRET.
docker compose up -d
```

### Canh bao: Reset toan bo du lieu local

Lenh `npm run docker:reset` thuc hien `docker compose down -v` — **xoa toan bo Docker volume**, bao gom toan bo du lieu trong Postgres va MinIO. **Tuyet doi khong chay lenh nay tren moi truong staging/production.**

Chi su dung khi:

- Dang phat trien local va muon xoa sach de bat dau lai.
- Gap loi Flyway checksum mismatch khong the sua bang migration moi (chi xay ra khi migration da release bi sua noi dung).

```bash
# Chi chay local — mat toan bo du lieu!
npm run docker:reset
```

### Deploy production

```bash
cp .env.example .env
# Dien day du secret va URL production
docker compose up -d
```

Cac secret bat buoc phai co (thieu bat ky bien nao se khien stack tu choi start):

- `POSTGRES_PASSWORD`, `JWT_SECRET`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`

Stack khong kem reverse proxy/TLS. Deploy internet-facing phai dat them Nginx, Caddy hoac load balancer ben ngoai.

Template Nginx production trong `deploy/nginx/` forward vao `127.0.0.1:8080`, `127.0.0.1:3000`, `127.0.0.1:4173`.
Public vhost `api.4thitek.vn` deny cung cac duong dan docs: `/swagger-ui`, `/swagger-ui.html`, `/v3/api-docs`, `/webjars`.

## CI/CD

Workflow GitHub Actions:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  - Trigger: `pull_request`, `push` vao `main`
  - Jobs: `secret-scan`, `backend`, `main-fe`, `admin-fe`, `dealer`
- [`.github/workflows/security-scan.yml`](.github/workflows/security-scan.yml)
  - Trigger: weekly + manual
  - OWASP dependency-check (backend) + npm audit scan (frontend)
  - Scan phu, non-blocking cho flow CI chinh; artifacts duoc upload de review

## Van hanh

Tai lieu van hanh toi thieu:

- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- [docs/RUNBOOK.md](docs/RUNBOOK.md)
- [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md)
- [docs/SEPAY_WEBHOOK.md](docs/SEPAY_WEBHOOK.md)

## Production domains hien tai

- Public site: `https://4thitek.vn`
- Admin dashboard: `https://admin.4thitek.vn`
- Canonical API base URL: `https://api.4thitek.vn/api/v1`
- Backend van giu alias `/api`, nhung khong con duoc dung lam default trong client/runtime config.
- Dealer mobile API: `https://api.4thitek.vn`
- Dealer WebSocket: `https://ws.4thitek.vn/ws`

Template Nginx production da duoc dat trong [deploy/nginx](deploy/nginx):

- [deploy/nginx/4thitek.vn.conf](deploy/nginx/4thitek.vn.conf)
- [deploy/nginx/admin.4thitek.vn.conf](deploy/nginx/admin.4thitek.vn.conf)
- [deploy/nginx/api.4thitek.vn.conf](deploy/nginx/api.4thitek.vn.conf)
- [deploy/nginx/ws.4thitek.vn.conf](deploy/nginx/ws.4thitek.vn.conf)
- [deploy/nginx/shared-config.conf](deploy/nginx/shared-config.conf)
