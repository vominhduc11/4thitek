# Production checklist

Trang thai hien tai da tot hon ve mat cau hinh mac dinh, nhung van chua du de coi la "ready for production".

## Bat buoc truoc khi deploy

- Dat `JWT_SECRET` toi thieu 32 bytes va quan ly bang secret manager.
- Dat `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD`, `POSTGRES_PASSWORD` bang secret that.
- Dat `APP_CORS_ALLOWED_ORIGIN_PATTERNS` theo dung domain production cho `main-fe`, `admin-fe` va cac origin can thiet khac.
- Dat `APP_PASSWORD_RESET_BASE_URL` ve URL production that.
- Xac nhan `APP_SEED_DEMO_DATA=false` trong moi environment production.
- Tat `SPRING_H2_CONSOLE_ENABLED` trong production.
- Dung PostgreSQL that, khong dung H2 in-memory cho production. Flyway phai duoc bat va migration phai clean tren database moi.
- Cau hinh SMTP that neu can password reset va email lifecycle.
- Cau hinh `SEPAY_*` that neu su dung bank transfer webhook.
- Cau hinh `APP_STORAGE_PROVIDER=s3`, `APP_STORAGE_S3_*` va `APP_STORAGE_S3_PUBLIC_BASE_URL` neu dung MinIO/S3 cho uploads.
- Dam bao Redis san sang cho cache va application-level rate limiting.

## Van hanh va release

- Tao artifact production rieng cho backend, `main-fe`, `admin-fe` va `dealer`; khong deploy bang `spring-boot:run`, `npm run dev`, hoac `flutter run`.
- Dung [docker-compose.yaml](docker-compose.yaml) va [.env.example](.env.example) lam diem xuat phat mac dinh cho stack production.
- [docker-compose.prod.yaml](docker-compose.prod.yaml) va [.env.production.example](.env.production.example) duoc giu lai nhu alias/tuong thich nguoc cho luong cu.
- Lam sach working tree truoc khi release; khong cat ban release tu repo dang co nhieu file modified/untracked.
- Chot env matrix cho `dev`, `staging`, `production` va luu trong tai lieu van hanh.
- Admin frontend nen duoc cap `API_BASE_URL` runtime thay vi dong cung build-time.
- Kich hoat CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) va chot branch protection truoc khi merge release.

## Kiem tra truoc go-live

- Smoke test login, register dealer, upload file, blog/product listing, warranty check, notifications.
- Test password reset end-to-end voi SMTP that.
- Test webhook/payment flow end-to-end neu bat SePay.
- Kiem tra `swagger-ui.html`, `/v3/api-docs`, `/api/v1/**`, request IDs, audit logs, backup database, va rollback plan.
- Kiem tra Redis cache/rate limit, bucket MinIO, va public object URL truoc khi mo traffic.
- Kiem tra analytics env (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) va DSN error tracking (`SENTRY_DSN`) neu bat monitoring.
