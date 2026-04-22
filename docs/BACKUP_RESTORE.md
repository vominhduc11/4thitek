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

## 7) RPO / RTO De xuat

- RPO: <= 15 phut (neu co WAL/incremental), neu chi logical dump thi <= 24h.
- RTO: <= 2 gio cho su co service-level, <= 4 gio cho full environment rebuild.

Moc thuc te phai duoc review theo tai nguyen ha tang va SLA kinh doanh.
