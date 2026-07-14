# Deployment Guide

## 1) Environment Model

- `local`: phat trien tren may ca nhan, co the bat docs va demo seed.
- `staging`: mirror production o muc toi thieu, dung de test release + migration.
- `production`: public traffic, khong bat demo seed, khong bat public docs.

## 2) Required Secrets

Toi thieu phai co trong `.env`:

- `POSTGRES_PASSWORD`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `JWT_SECRET`

Neu bat SePay:

- `SEPAY_ENABLED=true`
- `SEPAY_WEBHOOK_TOKEN`
- `SEPAY_BANK_NAME`
- `SEPAY_ACCOUNT_NUMBER`
- `SEPAY_ACCOUNT_HOLDER`

ISR on-demand cho `main-fe` (revalidate khi admin đổi product/blog/content):

- `REVALIDATE_SECRET` — chuỗi bí mật chia sẻ giữa `backend` và `main-fe`. Sinh bằng
  `openssl rand -hex 32`. Giá trị **phải giống nhau** ở cả hai service (backend gửi header
  `x-revalidate-secret`, main-fe so khớp). Nếu để trống, main-fe từ chối mọi request
  revalidate (401) và site chỉ làm tươi theo ISR time-based (fallback).
- `MAIN_FE_INTERNAL_URL` — URL nội bộ backend dùng để gọi main-fe trong mạng Docker, mặc
  định `http://main-fe:3000`.

Xem cơ chế ở mục "ISR on-demand (revalidation webhook)" bên dưới.

### 2.1) ISR on-demand (revalidation webhook)

`main-fe` là site SEO render tĩnh (SSG/ISR), **không SSR**. Nội dung admin cập nhật được đẩy
lên site gần tức thì qua cơ chế revalidate theo tag thay vì chờ ISR time-based hết hạn.

- Endpoint nội bộ (main-fe): `POST /api/revalidate`, header `x-revalidate-secret: <REVALIDATE_SECRET>`,
  body `{ "tags": string[] }`. Trả `200 { revalidated: true }` khi hợp lệ, `401` khi sai/thiếu
  secret. Đây là route nội bộ — **không** public qua reverse proxy.
- Tag hợp đồng (khớp `CacheNames` ở backend):
  - `products`, `product:{id}` — danh sách/chi tiết sản phẩm
  - `blogs`, `blog:{id}` — danh sách/chi tiết bài viết
  - `content`, `content:{section}` — nội dung CMS (vd `content:home`)
- Backend gọi endpoint này sau khi admin create/update/delete product, blog (kể cả
  `BlogPublishJob` tự đăng theo lịch), và upsert content section. Gọi bằng `@Async`
  fire-and-forget: lỗi mạng chỉ ghi log, không chặn nghiệp vụ.
- Nếu `main-fe` chạy nhiều replica: `revalidateTag` chỉ tác động instance nhận request. Khi
  scale >1, cần một cơ chế cache dùng chung giữa các instance để nhất quán — hệ thống hiện tại
  không có sẵn cơ chế này. Mặc định hiện tại là 1 container nên chưa cần.

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

Dự án dùng **một** file `docker-compose.yaml` cho cả hai môi trường, phân biệt bằng file env:

| Môi trường | File env | Cách nạp |
|---|---|---|
| Localhost | `.env` | Docker Compose **tự động** nạp file tên `.env` trong thư mục hiện tại. |
| VPS | `.env.vps` | Compose **không** tự nạp file này — phải truyền `--env-file .env.vps` ở **mọi** lệnh. |

> ⚠️ Compose chỉ tự nạp đúng file tên `.env`. Nếu chạy `docker compose up -d` trơn trên VPS,
> nó sẽ dùng `.env` (cấu hình localhost) chứ **không** đụng tới `.env.vps`. Đây là lỗi hay gặp nhất.

### Localhost

```bash
cp .env.example .env
# điền secret + cấu hình local
docker compose up -d --build
docker compose ps
```

### VPS

```bash
cp .env.vps.example .env.vps
# điền đầy đủ secret + domain production
docker compose --env-file .env.vps up -d --build
docker compose --env-file .env.vps ps
```

**Bắt buộc tuân thủ trên VPS:**

- **Luôn kèm `--env-file .env.vps`** ở mọi lệnh compose (`up`, `build`, `restart`, `down`,
  `logs`, `exec`, `ps`…). Quên cờ này thì Compose quay lại nạp `.env`.
- **Không để tồn tại file `.env` trên VPS.** Khi đó nếu lỡ quên `--env-file`, Compose sẽ báo
  lỗi thiếu biến bắt buộc (`POSTGRES_PASSWORD`, `JWT_SECRET`… đều khai báo `:?`) và dừng ngay —
  thay vì âm thầm chạy nhầm cấu hình localhost.
- **Luôn build ngay trên VPS** (kèm `--build`) mỗi lần deploy. `main-fe`/`admin-fe` nướng các
  biến build-time (`NEXT_PUBLIC_API_BASE_URL`, `VITE_API_BASE_URL`, `VITE_WEB_ORIGIN`,
  `NEXT_PUBLIC_ADMIN_ORIGIN`…) vào ảnh **lúc build**. Build ở local rồi bê ảnh lên VPS sẽ dính
  URL localhost. Vì `up -d` chỉ build khi ảnh chưa tồn tại, redeploy phải có `--build`:

```bash
# Redeploy khi có code mới hoặc đổi biến build-time
docker compose --env-file .env.vps build --no-cache backend main-fe admin-fe
docker compose --env-file .env.vps up -d
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

### Frontend env cho Live Preview (build-time)

Tính năng Live Preview (admin xem trước sản phẩm/blog bằng template public thật) cần 2 biến
build-time. Nếu bỏ trống, preview vẫn chạy được ở local nhưng **không** bật ở production.

| Biến | Surface | Giá trị production | Vai trò |
|---|---|---|---|
| `VITE_WEB_ORIGIN` | admin-fe | `https://4thitek.vn` | Origin site public để admin nhúng iframe `/preview/*`. |
| `NEXT_PUBLIC_ADMIN_ORIGIN` | main-fe | `https://admin.4thitek.vn` | Origin admin được phép nhúng `/preview/*` (CSP `frame-ancestors`) và gửi `postMessage`. |

```env
# admin-fe (.env build)
VITE_WEB_ORIGIN=https://4thitek.vn

# main-fe (.env build)
NEXT_PUBLIC_ADMIN_ORIGIN=https://admin.4thitek.vn
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

> **Trên VPS:** các lệnh dưới đây viết `.env` và `docker compose ...` cho gọn. Khi chạy trên
> VPS, hãy đọc `.env.vps` (ví dụ `grep APP_CORS_ALLOWED_ORIGIN_PATTERNS .env.vps`) và kèm
> `--env-file .env.vps` vào mọi lệnh compose. Ngoài ra, đổi biến trong env rồi thì phải
> `docker compose --env-file .env.vps up -d` (tạo lại container) để giá trị mới có hiệu lực —
> `restart` không nạp lại env đã đổi.

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
