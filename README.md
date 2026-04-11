# 4thitek Monorepo

Monorepo gom 4 phan chinh:

- `backend`: Spring Boot API, Flyway migration, Redis-backed cache/rate limit, OpenAPI va audit logging.
- `dealer`: Flutter dealer hub voi GoRouter, generated l10n va widget/unit tests.
- `main-fe`: Next.js public website voi ISR, sitemap/robots, canonical metadata va analytics env-driven.
- `admin-fe`: Vite admin dashboard voi runtime API config, route-scoped loading va page-level error boundary.

## Tai khoan demo

Chi co san khi bat `APP_SEED_DEMO_DATA=true` trong backend.

- `daily.hn@4thitek.vn` / `123456`
- `duc123@gmail.com` / `123456`

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
Swagger/OpenAPI co san tai `http://localhost:8080/swagger-ui.html` va `http://localhost:8080/v3/api-docs`.
Flyway duoc bat mac dinh, `ddl-auto` dat `validate`, va cache/rate limit se tu dong dung Redis neu `SPRING_DATA_REDIS_HOST` co gia tri.
Neu can reset password hoac goi frontend tu domain khac localhost, phai set `APP_PASSWORD_RESET_BASE_URL` va `APP_CORS_ALLOWED_ORIGIN_PATTERNS` phu hop.

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

Chi co mot file: `docker-compose.yaml` — dung cho ca local, staging va production.

Mac dinh stock compose da duoc siet theo huong production-safe hon:

- `.env.example` dung localhost/non-prod URLs, khong tro thang production API.
- `backend`, `main-fe`, `admin-fe` va MinIO S3 API chi bind `127.0.0.1`.
- Redis giu internal-only; MinIO console khong publish host port trong stock compose.
- Stock compose dung `APP_FCM_CREDENTIALS_JSON_BASE64`; path mode chi danh cho standalone backend run.

Neu local dev can MinIO console hoac Redis host access de debug, hay them compose override rieng thay vi mo mac dinh trong stock file.

### Chay local

```bash
cp .env.example .env
# Bat buoc phai doi: POSTGRES_PASSWORD, REDIS_PASSWORD,
#                    MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, JWT_SECRET
# Xem comment trong .env.example de biet cach generate JWT_SECRET.
docker compose up -d
```

Neu da tung tao volume Postgres bang password cu hoac backend bao Flyway checksum mismatch sau khi migration da bi sua, can reset volume local:

```bash
npm run docker:reset
```

### Deploy production

```bash
cp .env.production.example .env
# Sua tat ca gia tri CHANGE_ME_* — xem chu thich trong file
docker compose up -d
```

Cac secret bat buoc phai co (thieu bat ky bien nao se khien stack tu choi start):

- `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`

Xem day du danh sach bien va giai thich trong [.env.production.example](.env.production.example).

Stack khong kem reverse proxy/TLS. Deploy internet-facing phai dat them Nginx, Caddy hoac load balancer ben ngoai.
Mau Nginx trong `deploy/nginx/` da dung mo hinh cung host, forward vao `127.0.0.1:8080`, `127.0.0.1:3000`, `127.0.0.1:4173`.

## CI

Workflow GitHub Actions nam o [.github/workflows/ci.yml](.github/workflows/ci.yml) va chay:

- `secret-scan`: Gitleaks quet toan bo working tree, chan PR neu phat hien credential.
- `backend`: `./mvnw -B verify` — chay tat ca tests + JaCoCo coverage check (60% minimum). Bao gom:
  - Integration tests voi MockMvc + H2 cho cac endpoint cua tat ca client
  - `AuthResponseShapeTests` — kiem tra day du cac field cua auth response (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `user.*`) ma moi client phu thuoc vao
  - `PublicApiResponseShapeTests` — kiem tra field names cua public product / blog / dealer API ma main-fe va dealer app doc
- `main-fe`: `npm audit` (high CVEs) → `npm run test -- --run` → `npm run build`
- `admin-fe`: `npm audit` (high CVEs) → `npm run test -- --run` → `npm run build`
- `dealer`: `flutter analyze` va `flutter test`

Tat ca jobs chay song song, la blocking PR gates (khong the merge neu co job fail).

Scan dependency scan hang tuan (OWASP, npm audit moderate) nam o [.github/workflows/security-scan.yml](.github/workflows/security-scan.yml) — non-blocking, bao cao duoc upload len artifacts.

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

## Kiem tra da verify

Da chay thanh cong cuc bo trong dot nang cap thang 03/2026:

- `backend`: `./mvnw test`
- `dealer`: `flutter analyze`
- `dealer`: `flutter test`
- `main-fe`: `npm run test -- --run`
- `main-fe`: `npm run build`
- `admin-fe`: `npm run test -- --run`
- `admin-fe`: `npm run build`
