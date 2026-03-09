# 4thitek Monorepo

Monorepo gom 4 phan chinh:

- `backend`: Spring Boot API, JWT auth, public product/dealer/warranty endpoints.
- `dealer`: Flutter dealer hub su dung backend that cho auth, order, payment, notification va warranty.
- `main-fe`: Next.js public website goi backend that qua API.
- `admin-fe`: Vite admin dashboard.

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
File upload duoc serve cong khai qua `http://localhost:8080/uploads/...`.
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

## Docker Compose

`docker-compose.yaml` gio la stack production-safe mac dinh.

Tren cloud server:

1. Tao file `.env` tu [.env.example](.env.example)
2. Dien day du secrets, domain va API URL that
3. Chay:

```bash
docker compose up -d
```

Neu muon rebuild image sau khi `git pull` hoac sua code:

```bash
docker compose up -d --build
```

Stack nay khong kem reverse proxy/TLS. Neu deploy internet-facing, can dat them Nginx, Caddy hoac load balancer ben ngoai.

## Docker Compose Dev

Stack local/dev duoc tach rieng tai [docker-compose.dev.yaml](docker-compose.dev.yaml).

Chay dev stack:

```bash
docker compose -f docker-compose.dev.yaml up --build
```

File [docker-compose.prod.yaml](docker-compose.prod.yaml) duoc giu lai nhu alias production de tuong thich nguoc voi lenh cu.

### Production domains hien tai

- Public site: `https://4thitek.vn`
- Admin dashboard: `https://admin.4thitek.vn`
- API: `https://api.4thitek.vn/api`
- Dealer mobile API: `https://api.4thitek.vn`
- Dealer WebSocket: `https://ws.4thitek.vn/ws`

Template Nginx production da duoc dat trong [deploy/nginx](deploy/nginx):

- [deploy/nginx/4thitek.vn.conf](deploy/nginx/4thitek.vn.conf)
- [deploy/nginx/admin.4thitek.vn.conf](deploy/nginx/admin.4thitek.vn.conf)
- [deploy/nginx/api.4thitek.vn.conf](deploy/nginx/api.4thitek.vn.conf)
- [deploy/nginx/ws.4thitek.vn.conf](deploy/nginx/ws.4thitek.vn.conf)
- [deploy/nginx/shared-config.conf](deploy/nginx/shared-config.conf)

## Kiem tra da verify

Da chay thanh cong cuc bo ngay 2026-03-06:

- `backend`: `./mvnw test`
- `backend`: boot thanh cong cuc bo
- `dealer`: `flutter analyze`
- `dealer`: `flutter test`
- `main-fe`: `npm run lint`
- `main-fe`: `npm run build`
- `admin-fe`: `npm run build`
