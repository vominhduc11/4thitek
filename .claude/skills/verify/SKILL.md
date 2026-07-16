# Verify 4thitek admin-fe + backend (isolated local stack)

Cách dựng môi trường verify tách biệt, KHÔNG đụng stack Docker production (ports 4173/8081)
và KHÔNG cần credentials thật.

## Backend verify (H2 in-memory, port 18080)

```bash
cd backend && JWT_SECRET=$(openssl rand -hex 64) SERVER_PORT=18080 \
  SPRING_FLYWAY_ENABLED=false SPRING_JPA_HIBERNATE_DDL_AUTO=create-drop \
  APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=true \
  APP_BOOTSTRAP_SUPER_ADMIN_EMAIL=verify@local.test \
  APP_BOOTSTRAP_SUPER_ADMIN_PASSWORD='Verify#12345-local' \
  APP_CORS_ALLOWED_ORIGIN_PATTERNS='http://localhost:15173' \
  bash mvnw -q spring-boot:run   # ~40s để boot; ./mvnw không có +x, phải `bash mvnw`
```

- Giống cấu hình test (H2 PostgreSQL mode, Flyway off, ddl create-drop). DB rỗng — seed dữ liệu qua API.
- Bootstrap tạo SUPER_ADMIN username = email, `requirePasswordChange=true` → PHẢI đổi mật khẩu
  trước khi UI cho vào app: `PATCH /api/v1/admin/password {currentPassword,newPassword}` (mật khẩu mạnh ≥8, hoa+thường+số+ký tự đặc biệt).
- Login: `POST /api/v1/auth/login {username,password}` → envelope `{success,data:{accessToken}}`.
- Blog `introduction` là jsonb: phải gửi chuỗi JSON hợp lệ, ví dụ `JSON.stringify([{type:'paragraph',text:'…'}])`.

## Admin-fe verify (Vite dev, port 15173)

```bash
cd admin-fe && VITE_API_ORIGIN=http://localhost:18080 \
  VITE_API_BASE_URL=http://localhost:18080/api/v1 \
  npm run dev -- --port 15173 --strictPort
```

## Drive bằng Playwright

- Cài trong scratchpad: `npm i playwright@1.61.1`; chromium sẵn có tại
  `/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome` → truyền `executablePath`.
- **Bắt buộc** shim trước khi app chạy (Vite dev có dep dùng `global` của Node, production build không bị):
  `page.addInitScript(() => { window.global = window; })` — thiếu shim này app trắng màn hình.
- Login UI: điền `input` đầu tiên (username) + `input[type=password]`, click `button[type=submit]`
  (getByRole name "Đăng nhập" không match ổn định).
- Crash detector: đếm text `"Đã xảy ra lỗi khi tải nội dung của trang"` (RouteErrorBoundary) + gom
  `page.on('console'|'pageerror')`.

## Luồng đáng drive

- `/blogs/:id` (từng crash React #310), `/products` Quick Add → `/products/:sku`, trash/restore,
  `/orders/:id`, permission gating (tạo staff user role thấp qua API rồi login), dirty guard (sửa form → click sidebar).

## Gotchas

- Stack Docker prod đang chạy sẵn ở 4173/8081/3001/9002 — đừng đụng, đừng dùng DB thật.
- `mvnw` không có execute bit → `bash mvnw`.
- Backend boot xong log `Started BackendApplication`; health: `GET :18080/actuator/health`.
