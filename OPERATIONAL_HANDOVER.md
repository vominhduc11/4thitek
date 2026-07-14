# Operational Handover Checklist

**Project:** 4thitek Platform v1.0.0  
**Handover date:** 2026-04-29  
**Commit:** see `git log --oneline -5`

---

## 1. Production Domains

| Service | Domain | Internal port |
|---|---|---|
| Public website | `https://4thitek.vn` | 3000 |
| Admin dashboard | `https://admin.4thitek.vn` | 4173 |
| REST API | `https://api.4thitek.vn/api/v1` | 8080 |
| WebSocket | `wss://ws.4thitek.vn/ws` | 8080 |
| MinIO S3 (internal only) | — | 9000 |

---

## 2. Infrastructure Requirements

### Server
- Linux VPS / cloud VM (Ubuntu 22.04 LTS recommended)
- Docker Engine ≥ 24 + Docker Compose v2
- Min 2 vCPU / 4 GB RAM / 40 GB disk (SSD)
- Ports 80 and 443 open; all other ports internal-only

### Reverse Proxy
- Nginx installed on host (not inside Docker)
- Nginx config templates: `deploy/nginx/*.conf`
- SSL certificates at `/etc/ssl/<domain>/fullchain.crt` and `private.key`

---

## 3. Pre-Deploy Secret Checklist

Copy `.env.example` → `.env` and fill in **every item** below before first deploy.

| Variable | Description | Required |
|---|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password | YES |
| `MINIO_ROOT_USER` | MinIO access key | YES |
| `MINIO_ROOT_PASSWORD` | MinIO secret key | YES |
| `JWT_SECRET` | HS512 key — generate: `openssl rand -hex 32` | YES |
| `SEPAY_WEBHOOK_TOKEN` | SePay webhook token — generate: `openssl rand -hex 32` | If using SePay |
| `SEPAY_BANK_NAME` | Bank name on SePay | If using SePay |
| `SEPAY_ACCOUNT_NUMBER` | Bank account number | If using SePay |
| `SEPAY_ACCOUNT_HOLDER` | Account holder name | If using SePay |
| `SPRING_MAIL_USERNAME` | SMTP username | If email enabled |
| `SPRING_MAIL_PASSWORD` | SMTP app password | If email enabled |
| `APP_FCM_CREDENTIALS_JSON_BASE64` | Base64 of Firebase service_account.json | If FCM enabled |
| `APP_FCM_PROJECT_ID` | Firebase project ID | If FCM enabled |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID | Optional |

> **Never commit `.env` to git.**

---

## 4. First-Deploy Bootstrap Flow

1. Set the four required secrets in `.env`.
2. Set SePay / email / FCM env vars if needed.
3. Enable super-admin bootstrap **temporarily**:
   ```
   APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=true
   APP_BOOTSTRAP_SUPER_ADMIN_EMAIL=<admin@yourdomain.com>
   APP_BOOTSTRAP_SUPER_ADMIN_PASSWORD=<very-strong-password>
   ```
4. Run:
   ```bash
   docker compose up -d
   docker compose ps          # all services healthy
   curl -fsS http://127.0.0.1:8080/actuator/health
   ```
5. Log in to admin dashboard at `https://admin.4thitek.vn` and change the password immediately.
6. **Disable bootstrap** — set in `.env`:
   ```
   APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=false
   APP_BOOTSTRAP_SUPER_ADMIN_PASSWORD=
   ```
7. `docker compose up -d` to apply config change.

---

## 5. Nginx SSL Setup

```bash
# Install nginx on host
sudo apt install nginx

# Copy config templates
sudo cp deploy/nginx/4thitek.vn.conf     /etc/nginx/sites-available/
sudo cp deploy/nginx/admin.4thitek.vn.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/api.4thitek.vn.conf   /etc/nginx/sites-available/
sudo cp deploy/nginx/ws.4thitek.vn.conf    /etc/nginx/sites-available/
sudo cp deploy/nginx/shared-config.conf    /etc/nginx/conf.d/

# Place SSL certs
sudo mkdir -p /etc/ssl/4thitek.vn /etc/ssl/admin.4thitek.vn /etc/ssl/api.4thitek.vn /etc/ssl/ws.4thitek.vn
# Copy fullchain.crt + private.key into each dir

# Enable sites
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/4thitek.vn.conf .
sudo ln -s ../sites-available/admin.4thitek.vn.conf .
sudo ln -s ../sites-available/api.4thitek.vn.conf .
sudo ln -s ../sites-available/ws.4thitek.vn.conf .

sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Post-Deploy Smoke Test

| # | Check | Expected |
|---|---|---|
| 1 | `https://4thitek.vn` | Public homepage loads |
| 2 | `https://admin.4thitek.vn` | Login page loads |
| 3 | `curl -fsS http://127.0.0.1:8080/actuator/health` | `{"status":"UP"}` |
| 4 | Admin login | Token returned, dashboard loads |
| 5 | Dealer app login | Auth succeeds, dashboard loads |
| 6 | Create a test order + simulate payment webhook | Order transitions to CONFIRMED |
| 7 | `https://api.4thitek.vn/swagger-ui` | Returns 403 (docs blocked on public vhost) |
| 8 | `https://api.4thitek.vn/v3/api-docs` | Returns 403 |

---

## 7. Ongoing Operations

| Task | Frequency | Reference |
|---|---|---|
| DB backup (pg_dump) | Daily | `docs/BACKUP_RESTORE.md` §2 |
| MinIO backup | Daily | `docs/BACKUP_RESTORE.md` §3 |
| Restore drill (staging) | Monthly | `docs/BACKUP_RESTORE.md` §6 |
| SSL cert renewal | Before expiry (90-day certs: renew at 60 days) | `docs/RUNBOOK.md` §7 |
| OWASP dep-check review | Weekly (CI uploads artifact) | `.github/workflows/security-scan.yml` |
| Monitor unmatched payments | Daily | `docs/SEPAY_WEBHOOK.md` §6 |
| Review audit logs | Weekly | Admin → Audit Logs |
| Secret rotation | Quarterly or after incident | `docs/security/P0_SECRET_ROTATION_CHECKLIST.md` |

---

## 8. Key Credentials to Hand Over

The following must be transferred securely (e.g. encrypted password manager) to the operator/customer:

- [ ] `.env` production file (or secret manager entries)
- [ ] SSL private keys for all 4 domains
- [ ] MinIO root credentials
- [ ] SePay webhook token (and configured on SePay dashboard)
- [ ] Firebase service account JSON (if FCM enabled)
- [ ] Android upload keystore `upload-keystore.jks` + `key.properties` password (Play Console signing)
- [ ] SMTP credentials (if email enabled)
- [ ] Server SSH access credentials
- [ ] DNS records ownership/access (A records for 4 subdomains)

---

## 9. Contact & Source of Truth

| Item | Location |
|---|---|
| Source code | This repository, branch `main` |
| Business logic contract | `BUSINESS_LOGIC.md` |
| Deployment guide | `docs/DEPLOYMENT_GUIDE.md` |
| Incident runbook | `docs/RUNBOOK.md` |
| Backup/restore | `docs/BACKUP_RESTORE.md` |
| SePay webhook | `docs/SEPAY_WEBHOOK.md` |
| Secret rotation | `docs/security/P0_SECRET_ROTATION_CHECKLIST.md` |
| Changelog | `CHANGELOG.md` |

---

## 10. Handover Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Developer (handover from) | | 2026-04-29 | |
| Operator / Customer (handover to) | | | |
| Witness | | | |
