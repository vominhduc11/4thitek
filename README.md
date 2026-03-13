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

`docker-compose.yaml` gio la stack mac dinh de bring-up nhanh, van uu tien gia tri trong `.env` neu co. Stack nay gom san `postgres`, `redis`, `minio`, `backend`, `main-fe`, `admin-fe` va job khoi tao bucket MinIO.

Tren cloud server:

1. Tao file `.env` tu [.env.example](.env.example)
2. It nhat thay `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD` va `JWT_SECRET`; neu deploy public thi dien tiep domain, storage URL, API URL that
3. Chay:

```bash
docker compose up -d
```

Neu muon rebuild image sau khi `git pull` hoac sua code:

```bash
docker compose up -d --build
```

Mac dinh stack nay tu fallback duoc cac gia tri toi thieu de boot:

- Postgres password mac dinh: `app_password`
- Redis password mac dinh: `redis_password`
- JWT secret mac dinh: `change-me-to-a-32-byte-secret`
- `main-fe` va `admin-fe` mac dinh dung `https://api.4thitek.vn/api/v1` la API base URL duy nhat trong production
- MinIO bucket mac dinh: `4thitek-uploads`
- `admin-fe` render `runtime-config.js` tu bien moi truong `API_BASE_URL` luc container boot

Neu da tung tao volume Postgres bang password sai hoac rong, can reset volume mot lan sau khi sua env:

```bash
docker compose down -v
docker compose up -d --build
```

Stack nay khong kem reverse proxy/TLS. Neu deploy internet-facing, phai thay secret mac dinh, dat `APP_STORAGE_S3_PUBLIC_BASE_URL`, va dat them Nginx, Caddy hoac load balancer ben ngoai.

## Docker Compose Dev

Stack local/dev duoc tach rieng tai [docker-compose.dev.yaml](docker-compose.dev.yaml).

Chay dev stack:

```bash
docker compose -f docker-compose.dev.yaml up --build
```

File [docker-compose.prod.yaml](docker-compose.prod.yaml) duoc giu lai nhu alias production de tuong thich nguoc voi lenh cu.

## CI

Workflow GitHub Actions nam o [.github/workflows/ci.yml](.github/workflows/ci.yml) va chay:

- `backend`: `./mvnw -B test`
- `main-fe`: `npm run test -- --run` va `npm run build`
- `admin-fe`: `npm run test -- --run` va `npm run build`
- `dealer`: `flutter analyze` va `flutter test`

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
