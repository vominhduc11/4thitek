# Backup and Restore

## 1) Scope Backup

Bat buoc backup:

- Postgres data
- MinIO data (`minio-data` volume) va upload volume neu dung local upload
- File cau hinh van hanh: `.env`, Nginx config, cert metadata (khong public key material ra ngoai policy)

## 2) Postgres Backup

Dump logical:

```bash
docker compose exec -T postgres pg_dump -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app_db} -Fc > backup_$(date +%Y%m%d_%H%M%S).dump
```

Schema-only check:

```bash
docker compose exec -T postgres pg_dump -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app_db} -s > schema_$(date +%Y%m%d_%H%M%S).sql
```

## 3) MinIO / Upload Backup

Neu dung Docker named volume:

```bash
docker run --rm -v 4thitek_minio-data:/data -v %cd%:/backup alpine tar czf /backup/minio_$(date +%Y%m%d_%H%M%S).tgz -C /data .
docker run --rm -v 4thitek_upload-data:/data -v %cd%:/backup alpine tar czf /backup/uploads_$(date +%Y%m%d_%H%M%S).tgz -C /data .
```

Neu dung external object storage, backup theo policy native cua provider.

## 4) Backup `.env` va Nginx Config an toan

- Encrypt backup truoc khi day len remote storage.
- Tach quyen doc backup key va backup files.
- Khong commit `.env` that vao git.

## 5) Restore vao Staging (bat buoc truoc production)

1. Khoi tao staging stack moi.
2. Restore DB dump:

```bash
cat backup_xxx.dump | docker compose exec -T postgres pg_restore -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app_db} --clean --if-exists
```

3. Restore MinIO/uploads volumes.
4. Chay smoke tests staging:
   - login
   - tao order
   - payment webhook test
   - admin report/notification

## 6) Restore Drill

Tan suat de xuat:

- 1 lan/thang cho staging full-restore
- 1 lan/quy cho bai tap su co production-like

Moi drill phai ghi:

- thoi gian restore
- loi gap phai
- sai lech du lieu neu co
- action items

## 7) Sao luu tu dong voi backup.sh

Script `backup.sh` tai thu muc goc repo thuc hien day du mot phien backup production:

- **Tu dong load `.env`** — doc `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` ma khong can hardcode.
- **Backup PostgreSQL** bang `pg_dump | gzip` → `backups/<timestamp>/postgres.sql.gz`.
- **Backup MinIO** bang `tar czf` qua container Alpine → `backups/<timestamp>/minio.tar.gz`.
- **Kiem tra file rong** — thoat ngay voi loi neu bat ky file nao co kich thuoc 0 byte.
- **Tao SHA-256 checksum** cho moi file backup (`.sha256`) de kiem tra toan ven khi restore.
- **Don backup cu** theo bien `RETENTION_DAYS` (mac dinh: 7 ngay).

Moi phien backup duoc luu trong `./backups/<YYYYMMDD_HHMMSS>/`:

```
backups/
  20260423_020001/
    postgres.sql.gz
    postgres.sql.gz.sha256
    minio.tar.gz
    minio.tar.gz.sha256
```

### Chay thu cong

```bash
cd /opt/4thitek
./backup.sh
```

Script tu tim Docker volume co ten ket thuc bang `_minio-data`. Neu co nhieu volume khop hoac can chi dinh ro:

```bash
MINIO_VOLUME=my_project_minio-data ./backup.sh
```

De giu lai backup lau hon 7 ngay:

```bash
RETENTION_DAYS=30 ./backup.sh
```

### Cai dat cron job (chay hang ngay luc 2h sang)

Mo crontab cua user chay Docker:

```bash
crontab -e
```

Them dong sau (thay `/opt/4thitek` bang duong dan thuc):

```cron
0 2 * * * cd /opt/4thitek && ./backup.sh >> /var/log/4thitek-backup.log 2>&1
```

Tao file log truoc neu chua co:

```bash
sudo touch /var/log/4thitek-backup.log
sudo chown $(whoami) /var/log/4thitek-backup.log
```

Kiem tra cron da chay thanh cong:

```bash
tail -n 30 /var/log/4thitek-backup.log
ls -lh backups/
```

### Kiem tra toan ven checksum

Truoc khi restore, nen xac minh file backup khong bi hu:

```bash
cd backups/<timestamp>
sha256sum -c postgres.sql.gz.sha256
sha256sum -c minio.tar.gz.sha256
```

Ket qua mong doi: `postgres.sql.gz: OK` va `minio.tar.gz: OK`. Neu bao `FAILED`, khong dung file nay de restore.

### Luu y quan trong

- **Backup luu cung host** — neu disk may chu hong toan bo, backup cung mat. Nen copy offsite dinh ky (rclone → S3, rsync → may khac) sau khi script chay xong.
- Script yeu cau container `postgres` dang chay. Neu chay cron khi stack down, script se thoat voi loi ro rang thay vi tao file rong.

## 8) RPO / RTO De xuat

- RPO: <= 15 phut (neu co WAL/incremental), neu chi logical dump thi <= 24h.
- RTO: <= 2 gio cho su co service-level, <= 4 gio cho full environment rebuild.

Moc thuc te phai duoc review theo tai nguyen ha tang va SLA kinh doanh.
