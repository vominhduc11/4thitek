# Huong dan thay doi domain

Tai lieu nay mo ta cac buoc can thiet khi ban muon deploy he thong voi domain rieng thay vi `4thitek.vn` mac dinh.

## 1) Cac file can sua

### Nginx config (4 file vhost + 1 file shared)

| File | Chua hardcode domain |
|---|---|
| `deploy/nginx/4thitek.vn.conf` | `4thitek.vn`, `www.4thitek.vn`, duong dan cert, log |
| `deploy/nginx/admin.4thitek.vn.conf` | `admin.4thitek.vn`, duong dan cert, log |
| `deploy/nginx/api.4thitek.vn.conf` | `api.4thitek.vn`, duong dan cert, log |
| `deploy/nginx/ws.4thitek.vn.conf` | `ws.4thitek.vn`, duong dan cert, log |
| `deploy/nginx/shared-config.conf` | Khong co domain — chi dung `127.0.0.1:port`, **khong can sua** |

### Bien moi truong trong `.env`

| Bien | Vi sao can doi |
|---|---|
| `APP_CORS_ALLOWED_ORIGIN_PATTERNS` | Phai khop domain thuc te, neu sai tat ca API call tu browser bi CORS reject |
| `APP_AUTH_REFRESH_COOKIE_DOMAIN` | Phai dat thanh `.yourdomain.com` (co dau cham dau) de cookie refresh dung chung giua cac subdomain |
| `PUBLIC_SITE_BASE_URL` | URL public site — dung boi dealer app va cac link internal |
| `APP_PASSWORD_RESET_BASE_URL` | URL trang reset password gui trong email — phai tro dung domain moi |
| `APP_ADMIN_PASSWORD_RESET_BASE_URL` | Tuong tu, danh cho admin dashboard |
| `APP_EMAIL_VERIFICATION_BASE_URL` | URL xac minh email — gui trong email kich hoat tai khoan |
| `APP_MAIL_FROM` | Dia chi email nguoi gui (`info@4thitek.vn`) — doi thanh email cua domain moi |

## 2) Thay the hang loat bang sed

Chay tu thu muc goc cua repo. Thay `yourdomain.com` bang domain thuc cua ban:

```bash
OLD="4thitek.vn"
NEW="yourdomain.com"

# Thay the noi dung ben trong 4 file vhost
sed -i "s/${OLD}/${NEW}/g" deploy/nginx/4thitek.vn.conf
sed -i "s/${OLD}/${NEW}/g" deploy/nginx/admin.4thitek.vn.conf
sed -i "s/${OLD}/${NEW}/g" deploy/nginx/api.4thitek.vn.conf
sed -i "s/${OLD}/${NEW}/g" deploy/nginx/ws.4thitek.vn.conf

# Doi ten file cho khop voi domain moi
mv deploy/nginx/4thitek.vn.conf       deploy/nginx/${NEW}.conf
mv deploy/nginx/admin.4thitek.vn.conf deploy/nginx/admin.${NEW}.conf
mv deploy/nginx/api.4thitek.vn.conf   deploy/nginx/api.${NEW}.conf
mv deploy/nginx/ws.4thitek.vn.conf    deploy/nginx/ws.${NEW}.conf
```

Lenh `sed` tren thay ca `server_name`, duong dan SSL cert (`/etc/ssl/4thitek.vn/`) va duong dan log file mot lan.

Kiem tra ket qua truoc khi ap dung:

```bash
grep -r "4thitek.vn" deploy/nginx/
# Ket qua mong doi: khong co dong nao
```

## 3) Cap nhat bien moi truong trong `.env`

```env
# --- CORS ---
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://yourdomain.com,https://admin.yourdomain.com

# --- Cookie refresh token (luu y dau cham o dau) ---
APP_AUTH_REFRESH_COOKIE_DOMAIN=.yourdomain.com

# --- URL public site ---
PUBLIC_SITE_BASE_URL=https://yourdomain.com

# --- Email links (phai tro dung domain moi) ---
APP_PASSWORD_RESET_BASE_URL=https://yourdomain.com/reset-password
APP_ADMIN_PASSWORD_RESET_BASE_URL=https://admin.yourdomain.com/reset-password
APP_EMAIL_VERIFICATION_BASE_URL=https://admin.yourdomain.com/verify-email

# --- Email nguoi gui ---
APP_MAIL_FROM=info@yourdomain.com
```

## 4) Chuan bi SSL certificate

Cac file cert phai ton tai dung duong dan tuong ung sau khi da doi ten:

```
/etc/ssl/yourdomain.com/fullchain.crt
/etc/ssl/yourdomain.com/private.key

/etc/ssl/admin.yourdomain.com/fullchain.crt
/etc/ssl/admin.yourdomain.com/private.key

/etc/ssl/api.yourdomain.com/fullchain.crt
/etc/ssl/api.yourdomain.com/private.key

/etc/ssl/ws.yourdomain.com/fullchain.crt
/etc/ssl/ws.yourdomain.com/private.key
```

Vi du cap cert bang certbot (Nginx phai dang chay):

```bash
certbot certonly --nginx \
  -d yourdomain.com -d www.yourdomain.com \
  -d admin.yourdomain.com \
  -d api.yourdomain.com \
  -d ws.yourdomain.com
```

Sau do copy hoac symlink file cert vao cac duong dan tren.

## 5) Kiem tra sau khi doi domain

### HTTP → HTTPS redirect

```bash
curl -I http://yourdomain.com
# Mong doi: 301 Location: https://yourdomain.com/
```

### www redirect ve canonical

```bash
curl -I https://www.yourdomain.com
# Mong doi: 301 Location: https://yourdomain.com/
```

### API health check

```bash
curl -fsS https://api.yourdomain.com/actuator/health
# Mong doi: {"status":"UP"}
```

### Swagger bi chan

```bash
curl -o /dev/null -s -w "%{http_code}" https://api.yourdomain.com/swagger-ui.html
# Mong doi: 403
```

### CORS tu frontend

```bash
curl -I https://api.yourdomain.com/api/v1/products \
  -H "Origin: https://yourdomain.com"
# Mong doi: Access-Control-Allow-Origin: https://yourdomain.com
```

### WebSocket endpoint phan hoi

```bash
curl -I https://ws.yourdomain.com/ws
# Mong doi: 400 (WebSocket handshake chua co Upgrade header — day la binh thuong)
# Ket qua 502 hoac 404 la co van de
```

### Kiem tra nginx config hop le truoc khi reload

```bash
nginx -t
# Mong doi: syntax is ok / test is successful

systemctl reload nginx
```
