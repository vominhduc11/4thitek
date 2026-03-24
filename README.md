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

Ba file compose phu trach ba muc dich khac nhau:

| File | Dung cho | Secret handling |
|------|----------|-----------------|
| `docker-compose.yaml` | Local / staging nhanh | Co fallback default local-safe |
| `docker-compose.dev.yaml` | Local dev voi hot-reload | Hardcode gia tri local-only |
| `docker-compose.prod.yaml` | **Production** | Khong co default — fail ngay neu thieu |

### Local / staging

```bash
cp .env.example .env
# Sua POSTGRES_PASSWORD, REDIS_PASSWORD, MINIO_ROOT_PASSWORD, JWT_SECRET
docker compose up -d
```

Fallback default neu khong co `.env`: `app_password` (postgres), `redis_password` (redis), `minioadmin123` (minio), `change-me-to-a-32-byte-secret` (jwt). **Cac gia tri nay chi du de boot local, khong duoc dung tren internet-facing server.**

Neu da tung tao volume Postgres bang password cu, can reset volume:

```bash
docker compose down -v && docker compose up -d --build
```

Stack nay khong kem reverse proxy/TLS. Deploy internet-facing phai dat them Nginx, Caddy hoac load balancer ben ngoai.

### Production

```bash
cp .env.production.example .env
# Sua tat ca gia tri CHANGE_ME_* — xem chu thich trong file
docker compose -f docker-compose.prod.yaml --env-file .env up -d
```

`docker-compose.prod.yaml` khong co fallback default cho bat ky secret nao. Thieu bat ky bien nao trong nhom sau se khien stack tu choi start:

- `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`
- `APP_STORAGE_S3_PUBLIC_BASE_URL`, `APP_CORS_ALLOWED_ORIGIN_PATTERNS`

Xem day du danh sach bien va giai thich trong [.env.production.example](.env.production.example).

### Local dev (hot-reload)

Stack dev chay source code truc tiep voi Maven/Node, khong can build image:

```bash
docker compose -f docker-compose.dev.yaml up --build
```

Dev stack tu dong bootstrap tai khoan admin local:

- Email: `admin@localhost.dev` (chi la dia chi dev, khong phai tai khoan that)
- Password tam thoi: `YourStrongPassword123!`

Lan dang nhap dau tien se chuyen sang man hinh doi mat khau.

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
