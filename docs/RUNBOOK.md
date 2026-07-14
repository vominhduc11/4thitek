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

- DB co healthy khong
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

## 3) MinIO Down

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

## 4) SePay mismatch / unmatched payment tang dot bien

Trieu chung:

- So ban ghi `unmatched_payments` tang nhanh
- Admin phan anh don da chuyen khoan nhung khong match

Xu ly:

1. Kiem tra token webhook (`SEPAY_WEBHOOK_TOKEN`) co dung khong.
2. Kiem tra format transfer content va order code convention.
3. Kiem tra clock/timezone cua host backend.
4. Trich xuat 20 ban ghi unmatched moi nhat de phan loai ly do.
5. Manual reconcile tren admin cho giao dich hop le.

## 5) Disk Full

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

## 6) SSL/Nginx Loi

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

## 7) Rollback Co Ban

1. Xac dinh release version can rollback (image tag/commit hash).
2. Rollback application containers truoc (backend/main-fe/admin-fe).
3. Neu da chay migration DB, danh gia migration co reverse-safe khong.
4. Khong rollback DB schema bang tay khi chua co approved rollback script.
5. Sau rollback, chay smoke test toi thieu + theo doi logs 30 phut.

## 8) Giam sat co ban (Basic Monitoring)

He thong chua tich hop Prometheus/Grafana. Trong thoi gian cho, thiet lap ba lop giam sat sau de phat hien su co som nhat co the.

---

### 8.1) Uptime Monitor — canh bao khi service down

**Cong cu mien phi:** UptimeRobot (https://uptimerobot.com) — goi mien phi kiem tra moi 5 phut, gui canh bao qua email/Telegram.

**Cac endpoint nen monitor:**

| Ten | URL | Ky vong |
|---|---|---|
| Backend API | `https://api.4thitek.vn/actuator/health` | HTTP 200, body chua `"status":"UP"` |
| Public site | `https://4thitek.vn` | HTTP 200 |
| Admin dashboard | `https://admin.4thitek.vn` | HTTP 200 |

**Huong dan cai dat tren UptimeRobot:**

1. Dang ky tai https://uptimerobot.com (mien phi toi 50 monitor).
2. Click **Add New Monitor**.
3. Chon loai: **HTTP(s)**.
4. Dien URL: `https://api.4thitek.vn/actuator/health`.
5. Interval: **5 minutes**.
6. Alert contacts: them email va/hoac Telegram bot.
7. Lap lai cho cac endpoint con lai.

**Kiem tra nhanh khong can dang ky:**

```bash
# Chay tren may chu, dat vao cron moi 5 phut
curl -fsS https://api.4thitek.vn/actuator/health \
  | grep -q '"status":"UP"' \
  && echo "OK" || echo "ALERT: backend down"
```

---

### 8.2) Canh bao dung luong o dia

Log Docker (`max-size=50m x 5 file` moi service) va thu muc `backups/` co the lam day o dia neu khong kiem soat.

**Script kiem tra disk va gui canh bao:**

Tao file `/opt/4thitek/scripts/check-disk.sh`:

```bash
#!/bin/bash
# Gui canh bao qua email khi disk usage vuot nguong.
# Yeu cau: mailutils (sudo apt install mailutils) hoac chinh ALERT_CMD.

THRESHOLD=80
ALERT_EMAIL="ops@yourdomain.com"

usage=$(df / --output=pcent | tail -1 | tr -d ' %')

if [ "$usage" -ge "$THRESHOLD" ]; then
  hostname=$(hostname -f)
  subject="[CANH BAO] Disk ${usage}% tren ${hostname}"
  body="$(date '+%Y-%m-%d %H:%M:%S') — Disk usage: ${usage}%

Chi tiet:
$(df -h /)

Docker volumes:
$(docker system df 2>/dev/null || echo 'khong lay duoc')

Backup folder:
$(du -sh /opt/4thitek/backups 2>/dev/null || echo 'khong lay duoc')"

  echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
  echo "[$(date)] ALERT: disk ${usage}% — da gui email toi ${ALERT_EMAIL}"
else
  echo "[$(date)] OK: disk ${usage}%"
fi
```

Phan quyen va kiem tra:

```bash
chmod +x /opt/4thitek/scripts/check-disk.sh
/opt/4thitek/scripts/check-disk.sh
```

Them vao crontab (kiem tra moi 6 gio):

```bash
crontab -e
```

```cron
0 */6 * * * /opt/4thitek/scripts/check-disk.sh >> /var/log/4thitek-disk-check.log 2>&1
```

**Don thu cong khi disk day:**

```bash
# Kiem tra nhanh nguon chinh chiem dung luong
df -h /
docker system df

# Don image/container/volume khong dung (an toan, khong xoa volume named)
docker system prune -f

# Kiem tra backup cu
du -sh /opt/4thitek/backups/*/
# Xoa backup qua 30 ngay neu can
find /opt/4thitek/backups -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;
```

---

### 8.3) Kiem tra backup con moi (phat hien backup bi hong hoac bi bo sot)

Neu backup.sh khong chay (cron bi loi, service docker down...), file backup moi nhat se qua 24 gio. Script sau canh bao khi phat hien tinh trang do.

**Script kiem tra backup:**

Tao file `/opt/4thitek/scripts/check-backup.sh`:

```bash
#!/bin/bash
# Canh bao neu khong co file backup PostgreSQL moi trong 25 gio.
# Chay sau gio backup thuong le (vi du: backup luc 2h sang, kiem tra luc 4h sang).

BACKUP_ROOT="/opt/4thitek/backups"
MAX_AGE_HOURS=25
ALERT_EMAIL="ops@yourdomain.com"

# Tim file postgres.sql.gz moi nhat trong tat ca phien backup
latest=$(find "$BACKUP_ROOT" -name "postgres.sql.gz" -type f \
  -printf '%T@ %p\n' 2>/dev/null \
  | sort -n | tail -1 | awk '{print $2}')

if [ -z "$latest" ]; then
  subject="[CANH BAO] Khong tim thay file backup tren $(hostname -f)"
  echo "Khong co file backup nao trong $BACKUP_ROOT" \
    | mail -s "$subject" "$ALERT_EMAIL"
  echo "[$(date)] ALERT: khong co file backup"
  exit 1
fi

# Tinh tuoi file (tinh bang gio)
age_seconds=$(( $(date +%s) - $(date -r "$latest" +%s) ))
age_hours=$(( age_seconds / 3600 ))

if [ "$age_hours" -ge "$MAX_AGE_HOURS" ]; then
  subject="[CANH BAO] Backup qua cu: ${age_hours}h tren $(hostname -f)"
  body="File backup moi nhat: $latest
Tuoi: ${age_hours} gio (nguong canh bao: ${MAX_AGE_HOURS}h)
Thoi gian file: $(date -r "$latest" '+%Y-%m-%d %H:%M:%S')"
  echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
  echo "[$(date)] ALERT: backup ${age_hours}h tuoi — da gui email"
else
  echo "[$(date)] OK: backup ${age_hours}h tuoi ($latest)"
fi
```

Phan quyen va kiem tra:

```bash
chmod +x /opt/4thitek/scripts/check-backup.sh
/opt/4thitek/scripts/check-backup.sh
```

Them vao crontab (kiem tra luc 4h sang moi ngay — 2 gio sau khi backup chay):

```bash
crontab -e
```

```cron
# Backup chay luc 02:00, kiem tra luc 04:00
0 4 * * * /opt/4thitek/scripts/check-backup.sh >> /var/log/4thitek-backup-check.log 2>&1
```

**Crontab tong hop sau khi thiet lap day du:**

```cron
# Backup hang ngay luc 2h sang
0 2 * * * cd /opt/4thitek && ./backup.sh >> /var/log/4thitek-backup.log 2>&1

# Kiem tra backup con moi luc 4h sang
0 4 * * * /opt/4thitek/scripts/check-backup.sh >> /var/log/4thitek-backup-check.log 2>&1

# Kiem tra disk moi 6 gio
0 */6 * * * /opt/4thitek/scripts/check-disk.sh >> /var/log/4thitek-disk-check.log 2>&1
```

---

### 8.4) Kiem tra thu cong dinh ky (khi chua co alerting tu dong)

Neu chua thiet lap duoc email alert, chay tay cac lenh sau it nhat **moi tuan mot lan**:

```bash
# Tat ca service co dang chay khong?
docker compose ps

# Disk con bao nhieu?
df -h / && docker system df

# Backup moi nhat la khi nao?
ls -lht /opt/4thitek/backups/ | head -5

# Backend con song khong?
curl -fsS https://api.4thitek.vn/actuator/health

# Co loi nghiem trong nao trong log 24h qua khong?
docker compose logs --since=24h backend | grep -iE "error|exception|fatal" | tail -30
```
