# Deployment Guide

## 1) Environment Model

- `local`: phat trien tren may ca nhan, co the bat docs va demo seed.
- `staging`: mirror production o muc toi thieu, dung de test release + migration.
- `production`: public traffic, khong bat demo seed, khong bat public docs.

## 2) Required Secrets

Toi thieu phai co trong `.env`:

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `JWT_SECRET`

Neu bat SePay:

- `SEPAY_ENABLED=true`
- `SEPAY_WEBHOOK_TOKEN`
- `SEPAY_BANK_NAME`
- `SEPAY_ACCOUNT_NUMBER`
- `SEPAY_ACCOUNT_HOLDER`

## 3) Bootstrap SUPER_ADMIN Safe Flow

Mac dinh bootstrap da tat.

1. Truoc deploy lan dau, set tam:
   - `APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=true`
   - `APP_BOOTSTRAP_SUPER_ADMIN_EMAIL=<admin-email>`
   - `APP_BOOTSTRAP_SUPER_ADMIN_PASSWORD=<strong-password>`
2. Deploy stack.
3. Dang nhap bang account vua tao, doi password ngay.
4. Tat lai bootstrap:
   - `APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=false`
   - `APP_BOOTSTRAP_SUPER_ADMIN_PASSWORD=` (xoa khoi env)
5. Redeploy de xac nhan trang thai an toan.

Luu y:

- Production profile se chan bootstrap tru khi bat ro `APP_ALLOW_PRODUCTION_BOOTSTRAP=true`.
- Chi dung override nay cho one-time emergency, sau do phai tat ngay.

## 4) Docker Compose Deploy

```bash
cp .env.example .env
# dien day du secret + domain production
docker compose pull
docker compose up -d
docker compose ps
```

Khi deploy ban build moi:

```bash
docker compose build --no-cache backend main-fe admin-fe
docker compose up -d
```

## 5) Nginx + SSL Checklist

- Da apply config trong `deploy/nginx/*.conf` dung domain thuc te.
- Certificate + key ton tai va quyen doc dung.
- Public API vhost deny docs endpoints:
  - `/swagger-ui`
  - `/swagger-ui.html`
  - `/v3/api-docs`
  - `/webjars`
- Chi forward vao localhost ports (`127.0.0.1:*`) theo compose.
- Bat HSTS, X-Frame-Options, X-Content-Type-Options.

## 6) Healthcheck

Backend:

```bash
curl -fsS http://127.0.0.1:8080/actuator/health
```

Compose services:

```bash
docker compose ps
docker compose logs --tail=200 backend
```

## 7) Post-deploy Smoke Test

1. Public site mo duoc trang chu.
2. Admin dashboard load duoc login page.
3. API health `UP`.
4. Login dealer/admin thanh cong.
5. Tao thu 1 order + payment flow co response hop le.
6. Goi docs endpoints tu public domain phai bi `403`.
