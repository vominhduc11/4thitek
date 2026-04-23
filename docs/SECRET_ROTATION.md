# Huong dan Rotate Secret

Tai lieu nay mo ta quy trinh thay the (rotate) cac secret quan trong trong he thong ma khong pha vo du lieu hay cau hinh hien co.

> **Nguyen tac chung:** Luon backup `.env` hien tai truoc khi thay doi bat ky secret nao. Thuc hien rotate ngoai gio cao diem neu secret do anh huong truc tiep den user session hoac payment flow.

---

## 1. JWT_SECRET

### Pham vi anh huong

Khi thay JWT_SECRET, **toan bo access token va refresh token hien tai se bi vo hieu ngay lap tuc**. Tat ca user dang dang nhap se bi dang xuat va phai dang nhap lai. Day la hanh vi chap nhan duoc va co chu y.

### Quy trinh

**Buoc 1 — Tao secret moi:**

```bash
openssl rand -hex 32
```

Luu output vao mot noi an toan truoc khi tiep tuc.

**Buoc 2 — Cap nhat `.env`:**

```env
JWT_SECRET=<gia-tri-moi-vua-tao>
```

**Buoc 3 — Khoi dong lai backend:**

```bash
docker compose restart backend
```

**Buoc 4 — Kiem tra:**

```bash
curl -fsS http://127.0.0.1:8080/actuator/health
# Mong doi: {"status":"UP"}
```

Thu dang nhap lai tren Admin Dashboard va Dealer app de xac nhan token moi hoat dong.

### Tan suat khuyen nghi

- **Dinh ky:** 6 thang mot lan.
- **Khi co su co:** Ngay lap tuc khi phat hien secret co the bi lo.

---

## 2. POSTGRES_PASSWORD

### Pham vi anh huong

Password Postgres duoc luu trong ca hai noi: **bien moi truong container** (chi dung luc `initdb` lan dau) va **du lieu noi bo cua Postgres** (pg_authid). Neu chi doi bien moi truong trong `.env` ma khong sua trong Postgres, backend se mat ket noi ngay sau khi restart.

**Trinh tu bat buoc: doi trong Postgres truoc, doi `.env` sau.**

### Quy trinh

**Buoc 1 — Doi password truc tiep trong Postgres (khong can downtime):**

```bash
docker compose exec postgres \
  psql -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app_db} \
  -c "ALTER USER ${POSTGRES_USER:-app} PASSWORD 'new-strong-password';"
```

**Buoc 2 — Cap nhat `.env` ngay sau do:**

```env
POSTGRES_PASSWORD=new-strong-password
```

**Buoc 3 — Khoi dong lai backend** (de backend doc connection string moi):

```bash
docker compose restart backend
```

*Khong can restart container postgres — Postgres dung password da doi o buoc 1, khong doc lai bien moi truong sau khi da khoi dong.*

**Buoc 4 — Kiem tra ket noi:**

```bash
docker compose exec postgres \
  psql -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app_db} -c "SELECT 1;"
# Mong doi: ?column? = 1

curl -fsS http://127.0.0.1:8080/actuator/health
# Mong doi: {"status":"UP"}
```

### Canh bao

- **Khong rotate dinh ky** — Postgres password rotation doi hoi downtime ngan (restart backend). Chi thuc hien khi nghi ngo bi lo hoac theo chinh sach bao mat bat buoc.
- Neu restart container postgres sau khi doi `.env`, bien `POSTGRES_PASSWORD` moi **khong** ghi de password da luu trong volume. Container postgres se van dung password cu tu volume.

### Tan suat khuyen nghi

- **Dinh ky:** Khong bat buoc — chi rotate khi co ly do bao mat cu the.
- **Khi co su co:** Ngay lap tuc.

---

## 3. SEPAY_WEBHOOK_TOKEN

*Ap dung khi `SEPAY_ENABLED=true`.*

### Pham vi anh huong

Token nay dung de xac thuc moi request webhook tu SePay. Trong qua trinh chuyen doi, co mot khoang thoi gian ngan ma webhook bi tu choi (backend da nhan token moi nhung SePay van gui token cu, hoac nguoc lai). Nen thuc hien ngoai gio giao dich cao diem va theo doi danh sach `unmatched_payments` sau khi hoan tat.

### Quy trinh

**Buoc 1 — Tao token moi:**

```bash
openssl rand -hex 32
```

**Buoc 2 — Cap nhat `.env`:**

```env
SEPAY_WEBHOOK_TOKEN=<token-moi>
```

**Buoc 3 — Khoi dong lai backend:**

```bash
docker compose restart backend
```

**Buoc 4 — Cap nhat token tren SePay dashboard ngay lap tuc** (thuc hien cang nhanh cang tot sau buoc 3):

Dang nhap SePay → Webhook settings → thay the token bang gia tri moi → luu.

**Buoc 5 — Kiem tra:**

```bash
# Gui thu webhook test tu SePay dashboard
# Kiem tra log backend xem token co duoc chap nhan khong
docker compose logs --tail=50 backend | grep -i webhook
```

**Buoc 6 — Theo doi `unmatched_payments`** trong vong 30 phut sau rotation de phat hien webhook bi lo:

```bash
docker compose exec postgres \
  psql -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app_db} \
  -c "SELECT COUNT(*) FROM unmatched_payments WHERE created_at > NOW() - INTERVAL '30 minutes';"
```

### Tan suat khuyen nghi

- **Dinh ky:** 3 thang mot lan.
- **Khi co su co:** Ngay lap tuc neu nghi ngo token bi lo.

---

## 4. REDIS_PASSWORD

### Pham vi anh huong

Redis luu cache, rate-limit state va thong tin refresh token cua session. Khi rotate Redis password, **toan bo session hien tai co the bi anh huong** (tuong tu JWT_SECRET). Ngoai ra, neu backend mat ket noi Redis trong qua trinh chuyen doi, rate-limit va cache se bi vo hieu tam thoi.

### Quy trinh

**Buoc 1 — Doi password truc tiep trong Redis (khong downtime):**

```bash
OLD_PASS=$(grep REDIS_PASSWORD .env | cut -d= -f2)
docker compose exec redis \
  redis-cli -a "$OLD_PASS" CONFIG SET requirepass "new-strong-redis-password"
```

**Buoc 2 — Cap nhat `.env` ngay sau do:**

```env
REDIS_PASSWORD=new-strong-redis-password
```

**Buoc 3 — Khoi dong lai backend:**

```bash
docker compose restart backend
```

**Buoc 4 — Khoi dong lai Redis** de container doc bien moi truong moi (can cho luc maintenance):

```bash
docker compose restart redis
docker compose restart backend
```

*Luu y: Neu dung `appendonly yes` (mac dinh trong docker-compose), du lieu Redis van con sau khi restart container.*

### Tan suat khuyen nghi

- **Dinh ky:** 6 thang mot lan.
- **Khi co su co:** Ngay lap tuc.

---

## 5. MINIO_ROOT_USER / MINIO_ROOT_PASSWORD

### Pham vi anh huong

MinIO root credentials duoc dung boi backend nhu S3 access key/secret key. Thay doi credentials yeu cau restart ca MinIO lan backend, gay downtime ngan cho chuc nang upload/download media.

### Quy trinh

**Buoc 1 — Cap nhat `.env`:**

```env
MINIO_ROOT_USER=new-minio-user
MINIO_ROOT_PASSWORD=new-strong-minio-password
```

**Buoc 2 — Khoi dong lai MinIO** (MinIO doc credentials tu env khi start):

```bash
docker compose restart minio
```

**Buoc 3 — Khoi dong lai backend** (de backend dung credentials moi khi ket noi S3):

```bash
docker compose restart backend
```

**Buoc 4 — Kiem tra upload/download:**

```bash
curl -fsS http://127.0.0.1:8080/actuator/health
# Kiem tra them bang cach upload thu mot file qua Admin Dashboard
```

### Tan suat khuyen nghi

- **Dinh ky:** Khong bat buoc — chi rotate khi co ly do bao mat.
- **Khi co su co:** Ngay lap tuc.

---

## 6. Bang tan suat khuyen nghi

| Secret | Tan suat dinh ky | Thuc hien khi nao bat buoc |
|---|---|---|
| `JWT_SECRET` | 6 thang | Nghi ngo lo, incident bao mat |
| `POSTGRES_PASSWORD` | Khong bat buoc | Nghi ngo lo, yeu cau compliance |
| `SEPAY_WEBHOOK_TOKEN` | 3 thang | Nghi ngo lo, thay nhan su tiep can |
| `REDIS_PASSWORD` | 6 thang | Nghi ngo lo, incident bao mat |
| `MINIO_ROOT_USER/PASSWORD` | Khong bat buoc | Nghi ngo lo, yeu cau compliance |

---

## 7. Kiem tra sau moi lan rotate

Bat ke secret nao vua duoc rotate, chay day du checklist sau:

```bash
# 1. Backend con song
curl -fsS http://127.0.0.1:8080/actuator/health

# 2. Tat ca service trong compose dang chay
docker compose ps

# 3. Khong co loi khi khoi dong
docker compose logs --tail=100 backend | grep -iE "error|exception|failed"

# 4. Dang nhap lai thanh cong (neu rotate JWT hoac POSTGRES)
# Thu dang nhap qua Admin Dashboard va Dealer app

# 5. SePay webhook con hoat dong (neu rotate SEPAY_WEBHOOK_TOKEN)
# Xem danh sach unmatched_payments sau 30 phut
```
