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

## 6) Cau hinh bat buoc khi chay sau Reverse Proxy (Production Checklist)

Khi stack chay sau Nginx (theo mo hinh mac dinh), backend nhan tat ca request tu `127.0.0.1` — la IP cua Nginx — thay vi IP thuc cua client. Neu khong cau hinh cac bien duoi day, audit log se mat dau vet, rate limit bi tinh sai, va session co the khong hoat dong giua cac subdomain.

**Bat buoc set truoc khi go live:**

| Bien moi truong | Gia tri production | Hau qua neu bo qua |
|---|---|---|
| `APP_AUDIT_TRUST_FORWARDED_FOR` | `true` | Audit log ghi toan bo IP la `127.0.0.1`. Khong the truy vet hanh dong cua tung user/client khi dieu tra su co. |
| `APP_RATE_LIMIT_TRUST_FORWARDED_FOR` | `true` | Rate limit ap dung tren IP Nginx thay vi IP thuc. Mot user co the bypass rate limit bang cach gui request truong hop toan bo traffic tu cung 1 IP Nginx. |
| `APP_AUTH_REFRESH_COOKIE_DOMAIN` | `.4thitek.vn` | Cookie refresh token duoc tao cho tung subdomain rieng le (`api.4thitek.vn`, `admin.4thitek.vn`). Ket qua: dang nhap tren Admin Dashboard khong duy tri duoc — user bi dang xuat ngau nhien. |
| `APP_CORS_ALLOWED_ORIGIN_PATTERNS` | `https://4thitek.vn,https://admin.4thitek.vn` | Backend tu choi CORS request tu frontend production. Cac tinh nang can API call tu browser (tao order, upload, admin panel) se bao loi `CORS policy`. |

### Cach set trong `.env`

```env
# Reverse proxy trust — bat buoc khi deploy sau Nginx/Caddy
APP_AUDIT_TRUST_FORWARDED_FOR=true
APP_RATE_LIMIT_TRUST_FORWARDED_FOR=true

# Cookie domain — cho phep refresh token dung chung giua cac subdomain
APP_AUTH_REFRESH_COOKIE_DOMAIN=.4thitek.vn

# CORS — chi chap nhan request tu cac origin hop le cua production
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://4thitek.vn,https://admin.4thitek.vn
```

> **Luu y bao mat:** Hai bien `TRUST_FORWARDED_FOR` chi nen bat khi backend that su nam sau mot reverse proxy tin cay kiem soat header `X-Forwarded-For`. Neu backend expose truc tiep ra internet ma bat `true`, client co the gia mao IP bang cach tu them header nay.

### Kiem tra nhanh sau khi set

```bash
# IP trong audit log phai la IP thuc cua ban, khong phai 127.0.0.1
# Dang nhap admin roi kiem tra bang:
docker compose exec postgres psql -U app -d app_db \
  -c "SELECT ip_address, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

## 7) Healthcheck

Backend:

```bash
curl -fsS http://127.0.0.1:8080/actuator/health
```

Compose services:

```bash
docker compose ps
docker compose logs --tail=200 backend
```

## 8) Post-deploy Smoke Test

1. Public site mo duoc trang chu.
2. Admin dashboard load duoc login page.
3. API health `UP`.
4. Login dealer/admin thanh cong.
5. Tao thu 1 order + payment flow co response hop le.
6. Goi docs endpoints tu public domain phai bi `403`.

## 9) Xu ly su co trien khai thuong gap (Troubleshooting)

### Loi 1: Backend khong khoi dong duoc — "JWT secret is too weak"

**Trieu chung:**

```
ERROR: JWT secret is too weak. Set APP_SECURITY_REQUIRE_STRONG_JWT_SECRET=false to bypass (not recommended)
```

Backend tu choi start neu `JWT_SECRET` qua ngan hoac van la gia tri mac dinh `change-me-*`.

**Khac phuc:**

Tao secret manh va cap nhat `.env`:

```bash
openssl rand -hex 32
```

```env
JWT_SECRET=<gia-tri-64-ky-tu-vua-tao>
```

```bash
docker compose restart backend
```

---

### Loi 2: Khong truy cap duoc website qua domain, chi qua IP

**Trieu chung:** Vao `https://yourdomain.com` bao `ERR_CONNECTION_REFUSED` hoac `502 Bad Gateway`, nhung `curl http://127.0.0.1:3000` tren may chu van chay.

**Khac phuc:**

Kiem tra tung buoc:

```bash
# 1. DNS da tro dung IP chua?
dig +short yourdomain.com
# Phai tra ve IP may chu cua ban

# 2. Nginx co dang chay khong?
systemctl status nginx

# 3. Config Nginx co loi cu phap khong?
nginx -t

# 4. File conf da duoc copy vao dung thu muc chua?
ls /etc/nginx/conf.d/

# 5. Reload Nginx sau khi sua config
systemctl reload nginx

# 6. Firewall co dang chan port 80/443 khong?
ufw status
# Neu bi chan: ufw allow 80 && ufw allow 443
```

---

### Loi 3: Loi CORS tren trinh duyet

**Trieu chung:** Console trinh duyet bao:

```
Access to fetch at 'https://api.yourdomain.com/...' from origin 'https://yourdomain.com'
has been blocked by CORS policy
```

**Khac phuc:**

Kiem tra gia tri hien tai:

```bash
grep APP_CORS_ALLOWED_ORIGIN_PATTERNS .env
```

Dam bao `.env` chua day du cac origin production (khong co dau `/` o cuoi):

```env
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://yourdomain.com,https://admin.yourdomain.com
```

```bash
docker compose restart backend
```

Neu dung wildcard de debug nhanh (chi tren staging, **khong dung production**):

```env
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://*.yourdomain.com
```

---

### Loi 4: Login duoc o site chinh nhung vao Admin lai doi dang nhap lai

**Trieu chung:** Dang nhap tren `https://admin.yourdomain.com` thanh cong nhung sau khi refresh hoac chuyen trang lai bi dang xuat. Session khong duoc giu giua cac tab.

**Nguyen nhan:** Cookie refresh token chi duoc dat cho subdomain hien tai thay vi toan bo domain. Khi frontend goi API sang subdomain khac, cookie khong duoc gui kem.

**Khac phuc:**

```env
# Luu y: phai co dau cham o dau
APP_AUTH_REFRESH_COOKIE_DOMAIN=.yourdomain.com
```

```bash
docker compose restart backend
```

Sau khi restart, yeu cau user dang nhap lai mot lan de cookie moi voi domain dung duoc cap.

---

### Loi 5: Swagger UI van hien thi cong khai

**Trieu chung:** Truy cap `https://api.yourdomain.com/swagger-ui.html` hien thi trang docs thay vi bao `403`.

**Khac phuc — kiem tra hai lop bao ve:**

**Lop 1 — Backend:**

```bash
grep APP_DOCS_PUBLIC_ENABLED .env
# Phai la: APP_DOCS_PUBLIC_ENABLED=false (hoac bien nay khong co, mac dinh la false)
```

**Lop 2 — Nginx deny rule:**

```bash
nginx -T | grep -A2 "swagger-ui"
# Phai thay: return 403;
```

Neu chua co deny rule, kiem tra file `deploy/nginx/api.yourdomain.com.conf` da duoc copy vao `/etc/nginx/conf.d/` chua:

```bash
ls /etc/nginx/conf.d/api.yourdomain.com.conf
nginx -t && systemctl reload nginx
```

---

### Loi 6: Khong nhan duoc webhook tu SePay

**Trieu chung:** Don hang da chuyen khoan nhung trang thai khong tu dong cap nhat. Log SePay bao webhook delivery failed.

**Khac phuc — kiem tra theo thu tu:**

```bash
# 1. Backend co nhan request khong?
docker compose logs --tail=200 backend | grep -i "webhook\|sepay"

# 2. SEPAY_ENABLED co bat khong?
grep SEPAY_ENABLED .env
# Phai la: SEPAY_ENABLED=true

# 3. Endpoint co accessible tu internet khong?
# Chay tu may khac (khong phai may chu)
curl -X POST https://api.yourdomain.com/api/v1/webhook/sepay \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Neu bao Connection refused hoac timeout: firewall dang chan

# 4. Firewall cho phep inbound HTTPS chua?
ufw status | grep 443

# 5. Token co khop voi cau hinh tren SePay dashboard khong?
grep SEPAY_WEBHOOK_TOKEN .env
```

Xem them: [docs/SEPAY_WEBHOOK.md](SEPAY_WEBHOOK.md)

---

### Loi 7: Docker volume — "Permission denied"

**Trieu chung:** Container crash ngay khi start voi loi tuong tu:

```
mkdir: can't create directory '/app/uploads': Permission denied
```

hoac Postgres khong ghi duoc vao `/var/lib/postgresql/data`.

**Khac phuc:**

Kiem tra quyen hien tai cua volume:

```bash
docker volume inspect <ten-volume>
# Xem "Mountpoint" de biet duong dan thuc tren host

# Xem quyen cua thu muc do
ls -la /var/lib/docker/volumes/<ten-volume>/_data
```

Cach 1 — Chinh quyen chu so huu (phu hop voi Postgres va MinIO):

```bash
# Postgres chay voi UID 999
sudo chown -R 999:999 /var/lib/docker/volumes/<postgres-volume>/_data

# MinIO chay voi UID 1000 (tuy phien ban)
sudo chown -R 1000:1000 /var/lib/docker/volumes/<minio-volume>/_data
```

Cach 2 — Xoa va tao lai volume (mat du lieu local, chi dung khi chap nhan mat du lieu):

```bash
docker compose down -v
docker compose up -d
```

Cach 3 — Neu dung bind mount thay named volume, dam bao thu muc host ton tai va co quyen ghi:

```bash
mkdir -p ./data/postgres ./data/uploads
chmod 755 ./data/postgres ./data/uploads
```
