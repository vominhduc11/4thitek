# Runbook

## 0) Nguyen tac xu ly su co

1. Xac dinh pham vi anh huong (service nao, domain nao, bao nhieu user).
2. On dinh he thong (rollback, restart co kiem soat, giam traffic neu can).
3. Thu thap logs/metrics truoc khi sua lan rong.
4. Ghi lai timeline + root cause + hanh dong phong ngua lap lai.

## 1) Backend Down

Trieu chung:

- `api.4thitek.vn` 5xx hoac timeout
- `/actuator/health` fail

Xu ly:

```bash
docker compose ps backend
docker compose logs --tail=300 backend
docker compose restart backend
```

Kiem tra:

- DB/Redis co healthy khong
- Bien env bat buoc co bi mat khong
- Flyway migration co fail khong

## 2) DB Down (Postgres)

Trieu chung:

- Backend log `cannot connect to postgres`
- Query timeout hang loat

Xu ly:

```bash
docker compose ps postgres
docker compose logs --tail=300 postgres
docker compose restart postgres
```

Neu volume/corruption nghiem trong: dung procedure restore staging truoc, sau do restore production theo change window.

## 3) Redis Down

Trieu chung:

- Rate-limit/cache bat thuong
- Backend fallback hoac latency tang

Xu ly:

```bash
docker compose ps redis
docker compose logs --tail=300 redis
docker compose restart redis
```

Kiem tra lai login, refresh token, rate-limit paths.

## 4) MinIO Down

Trieu chung:

- Upload media loi
- URL media khong truy cap duoc

Xu ly:

```bash
docker compose ps minio
docker compose logs --tail=300 minio minio-init
docker compose restart minio
```

Kiem tra bucket policy va credentials MinIO trong env.

## 5) SePay mismatch / unmatched payment tang dot bien

Trieu chung:

- So ban ghi `unmatched_payments` tang nhanh
- Admin phan anh don da chuyen khoan nhung khong match

Xu ly:

1. Kiem tra token webhook (`SEPAY_WEBHOOK_TOKEN`) co dung khong.
2. Kiem tra format transfer content va order code convention.
3. Kiem tra clock/timezone cua host backend.
4. Trich xuat 20 ban ghi unmatched moi nhat de phan loai ly do.
5. Manual reconcile tren admin cho giao dich hop le.

## 6) Disk Full

Trieu chung:

- Docker containers crash/restart
- DB ghi loi `no space left on device`

Xu ly nhanh:

```bash
df -h
docker system df
docker compose logs --tail=200
```

Hanh dong:

- Dung log rotation (da cau hinh `json-file` max-size/max-file)
- Don image/container khong dung trong maintenance window
- Mo rong disk neu can

## 7) SSL/Nginx Loi

Trieu chung:

- Browser bao SSL invalid
- 502/504 tu nginx

Xu ly:

```bash
nginx -t
systemctl reload nginx
tail -n 300 /var/log/nginx/api.4thitek.vn-error.log
```

Kiem tra:

- Cert path va expiry
- Upstream localhost ports dung
- Docs endpoints van bi deny tren public vhost

## 8) Rollback Co Ban

1. Xac dinh release version can rollback (image tag/commit hash).
2. Rollback application containers truoc (backend/main-fe/admin-fe).
3. Neu da chay migration DB, danh gia migration co reverse-safe khong.
4. Khong rollback DB schema bang tay khi chua co approved rollback script.
5. Sau rollback, chay smoke test toi thieu + theo doi logs 30 phut.
