# API Contract — 4thitek Backend

> Generated: 2026-05-17 from `backend/src/main/java/com/devwonder/backend`.
> Evidence markers: `CONFIRMED_FROM_CODE` (traced to a controller), `NEEDS_VERIFICATION`
> (shape inferred, not fully traced). When code and this doc disagree, treat the drift as
> a defect and reconcile — update this doc in the same change.

## 0. Conventions

- **Base URL.** Canonical `https://api.4thitek.vn/api/v1`. The backend also serves the legacy
  alias `/api` (auth only) — not for new clients.
- **Response envelope.** Almost every JSON endpoint returns `ApiResponse<T>`:
  `{ "success": boolean, "data": T, "message": string|null }`. Validation failures return
  `success=false` with field errors under `data` (e.g. `data.email = "email is required"`).
  Evidence: `dto/ApiResponse.java`, `exception/RestExceptionHandler.java`.
- **Auth.** Stateless JWT `Authorization: Bearer <accessToken>`; authorities resolved fresh
  from DB each request (`security/JWTAuthFilter.java`, `entity/Account.getAuthorities()`).
- **Authorities.** Roles: `SUPER_ADMIN`, `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTANT`,
  `CONTENT_EDITOR`, `DEALER`. Admin endpoints additionally enforce granular permission codes
  via method-level `@PreAuthorize` — see [`PERMISSION_MATRIX.md`](PERMISSION_MATRIX.md) and
  migration `V42`.
- **Pagination.** `*/page` endpoints accept `page`, `size`, `sortBy`, `sortDir` and return
  `PagedResponse` (`util/PaginationUtils.java`).
- All endpoint rows below are `CONFIRMED_FROM_CODE` unless marked otherwise.

## 1. Coarse access map (`config/SecurityConfig.java`)

| Path | Access |
|---|---|
| `/api/v1/auth/**`, `/api/auth/**` | public |
| `/api/v1/product/**`, `/api/v1/blog/**`, `/api/v1/content/**`, `/api/v1/search` | public |
| `/api/v1/warranty/check/**` | public |
| `GET /api/v1/user/dealer`, `/api/v1/user/dealer/page` | public |
| `/api/v1/webhooks/sepay`, `/api/v1/health`, `/actuator/health`, `/ws/**`, `/uploads/**` | public |
| `GET /api/v1/upload/**`, `GET /api/v1/media/*/download` | public |
| `POST /api/v1/warranty-activation` | `DEALER` |
| `/api/v1/dealer/**` | `DEALER` |
| `/api/v1/admin/users/**`, `GET /api/v1/admin/audit-logs`, `/api/v1/admin/settings` | `SUPER_ADMIN` only |
| `/api/v1/admin/**` | any staff role + per-method permission code |
| media upload-session / finalize / access-url | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| anything else | authenticated |

## 2. Auth — `/api/v1/auth` (`AuthController`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/login` | Username/email + password → access + refresh token |
| POST | `/refresh` | Rotate refresh token (cookie-backed) |
| POST | `/logout` | Revoke refresh session |
| POST | `/forgot-password` | Always returns generic success (no account-existence leak) |
| GET | `/reset-password/validate` | Validate a reset token |
| POST | `/reset-password` | Submit new password |
| POST | `/resend-email-verification` | Re-send admin email verification |
| POST | `/verify-email` | Confirm admin email verification token |
| POST | `/register-dealer` | Public dealer onboarding request |

`POST /login` and `POST /refresh` return an identical envelope: `data.{accessToken, refreshToken,
tokenType, expiresIn, user}`, where `user` = `{id, username, accountType, roles: string[],
permissions: string[], requirePasswordChange}`. `permissions` are the account's granular codes
(`PERMISSION_MATRIX.md` §3); `ADMIN`/`SUPER_ADMIN` receive all 24. admin-fe gates its nav + routes
on `permissions` (`PERMISSION_MATRIX.md` §8). Shape guarded by `AuthResponseShapeTests`.

Password-reset completion is canonical on `main-fe /reset-password`; the dealer app only
starts the request (`BUSINESS_LOGIC.md` §0.3).

## 3. Public — `/api/v1` (`PublicController`, `PublicBlogController`, `PublicContentController`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/product/products`, `/product/products/page` | Product list (all / paged) |
| GET | `/product/products/homepage`, `/new`, `/featured` | Homepage placements |
| GET | `/product/products/search` | Product search |
| GET | `/product/{id}` | Product detail |
| GET | `/product/products/related/{id}` | Related products (dedicated contract) |
| GET | `/search` | Global public search |
| GET | `/user/dealer`, `/user/dealer/page` | Public dealer locator data |
| GET | `/warranty/check/{serial}` | Public warranty lookup |
| GET | `/blog/blogs`, `/blog/blogs/latest`, `/blog/blogs/search` | Blog list |
| GET | `/blog/blogs/related/{id}` | Related blogs (dedicated contract) |
| GET | `/blog/categories`, `/blog/categories/{id}/blogs`, `/blog/{id}` | Blog taxonomy + detail |
| GET | `/content/{section}` | Public CMS content section |

## 4. Dealer — `/api/v1/dealer` (`DealerController`, role `DEALER`)

| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/profile` | Dealer profile read/update |
| GET | `/discount-rules`, `/payment-instructions` | Wholesale tiers, bank-transfer info |
| GET | `/orders`, `/orders/page`, `/orders/{id}` | Dealer order history |
| POST | `/orders` | Create order (idempotency key required; `BANK_TRANSFER` only) |
| PATCH | `/orders/{id}/status` | Dealer status change — only `PENDING/CONFIRMED → CANCEL_REQUESTED` |
| GET/POST | `/orders/{id}/payments` | Order payment records / record bank transfer |
| GET/PUT/DELETE | `/cart`, `/cart/summary`, `/cart/items`, `/cart/items/{productId}` | Dealer cart |
| GET/PATCH | `/notifications`, `/notifications/page`, `/notifications/{id}/read|unread`, `/notifications/read-all` | Notifications |
| POST/DELETE | `/push-tokens` | FCM device token register/unregister |
| GET/POST/PUT/DELETE | `/warranties`, `/warranties/page`, `/warranties/{id}` | Warranty registrations |
| GET | `/serials`, `/inventory/summary`, `/inventory/serials`, `/inventory/serials/{id}` | Dealer inventory |
| PATCH | `/serials/{id}/status` | Serial status (guarded — dealer cannot set `RETURNED`/`DEFECTIVE`) |
| GET/POST | `/returns/page`, `/returns/{id}`, `/returns`, `/returns/{id}/cancel` | Return requests |
| GET | `/orders/{id}/return-eligible-serials`, `/inventory/serials/{id}/return-eligibility` | Return eligibility |
| GET/POST | `/support-tickets*`, `/support-tickets/{id}/messages` | Support ticket thread |
| PATCH | `/password` | Change own password |

## 5. Admin — `/api/v1/admin` (13 `Admin*Controller` classes)

Endpoints are gated by **granular permission codes** (`@PreAuthorize`). The former monolithic
`AdminController` was split into 13 controllers under `controller/` — the full endpoint list
lives in these files:

`AdminProductController` (products, categories), `AdminOrderController` (orders, serial
assignment, payments), `AdminSerialController` (serial inventory, import, RMA),
`AdminWarrantyController` (warranty registrations), `AdminReturnController` (return requests),
`AdminDealerAccountController` (dealers, dealer accounts), `AdminSupportTicketController`
(support tickets), `AdminFinancialController` (settlements, recent/unmatched payments, order adjustments),
`AdminDiscountRuleController` (discount rules), `AdminStaffUserController` (staff users),
`AdminSettingsController` (settings, audit logs), `AdminMiscController` (dashboard, reports,
notifications, content, blogs), `AdminMediaController` (media, base `/api/v1/admin/media`).
Shared helpers live in `AdminControllerSupport` (not a controller). Summary by domain:

| Domain | Endpoints (representative) | Permission code |
|---|---|---|
| Products | `GET /products`, `GET /products/page` (both accept `includeDeleted=true` to include trashed rows; default hides them) ; `POST /products` (**requires `sku`** — unique, ≤100 chars; duplicate → 409; admin-fe detail route is `/products/:sku`) ; `PUT /products/{id}` ; `DELETE /products/{id}` = **move to trash** (`isDeleted=true`, `publishStatus=DRAFT`) ; `DELETE /products/{id}/permanent` = hard delete (record must already be in trash; 409 while order items / serials / cart items / return items reference it) ; `POST /products/preview` | read: open to staff; write & preview: `products.write` |
| Orders | `GET /orders*` ; `PATCH /orders/{id}/status` ; `POST /orders/{id}/assign-serials` ; `POST /orders/{id}/payments` | `orders.read`, `orders.approve` / `orders.process` / `orders.cancel.review` (per transition), `serials.assign`, `orders.payment.confirm` |
| Serials | `GET/POST/PATCH/DELETE /serials*`, `PATCH /serials/{id}/rma` | read `serials.read`, write `serials.write` |
| Warranties | `GET /warranties`, `PATCH /warranties/{id}/status` | `warranties.read` / `warranties.write` |
| Returns | `GET /returns*`, `PATCH /returns/{id}/{review,receive,complete}`, `PATCH /returns/{id}/items/{itemId}/inspect` | `returns.read` / `returns.write` |
| Dealers | `GET /dealers*`, `PATCH/PUT /dealers/accounts/{id}*` | `dealers.read` / `dealers.write` |
| Support | `GET /support-tickets*`, `PATCH /support-tickets/{id}`, `POST .../messages` | `support.read` / `support.write` |
| Financial | `GET/PATCH /financial-settlements*`, `GET /payments/recent`, `GET/PATCH /unmatched-payments*`, `GET/POST /orders/{id}/adjustments` | `orders.payment.confirm` |
| Content | `GET/PUT /content/{section}`, `GET/POST/PUT/DELETE /blogs*` ; `POST /blogs/preview` | `content.write`, `blogs.write` (preview: `blogs.write`) |
| Media | `AdminMediaController` mutations | `media.write` |
| Discounts | `GET/POST/PUT/PATCH /discount-rules*` | `discounts.write` |
| Reports/Dashboard | `GET /reports/export`, `GET /dashboard`, `GET /notifications/page` | `reports.read`, `dashboard.read`, `notifications.read` |
| Users / Settings / Audit | `/users**`, `/settings`, `GET /audit-logs` | `SUPER_ADMIN` only (URL-level) |

### 5.1a Order fulfillment fields

`PATCH /api/v1/admin/orders/{id}/status` accepts optional `carrier` and `trackingCode`
alongside `status`. Both are required, non-blank strings when the requested transition enters
`SHIPPING`; they are ignored by the dealer status endpoint, which remains limited to cancellation
requests. The admin response and every dealer order read response additionally expose nullable
`carrier`, `trackingCode`, `shippedAt`, and `deliveredAt`. The endpoint remains guarded by the
existing per-transition permission rules; entering `SHIPPING` requires `orders.process`.

### 5.1 Live Preview (dry-run)

Content editors preview a **draft** product/blog rendered by the **real public template**
before saving. The flow is a stateless dry-run — **no DB write, no cache**:

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/v1/admin/products/preview` | `products.write` | `AdminProductUpsertRequest` (draft; fields tolerant/optional) | `PublicProductDetailResponse` (same shape as `GET /product/{id}`) |
| POST | `/api/v1/admin/blogs/preview` | `blogs.write` | `AdminBlogUpsertRequest` (draft) | `PublicBlogDetailResponse` (same shape as `GET /blog/{id}`) |

The endpoints build a **transient** entity from the request (never persisted, no category
side-effects, no SKU-uniqueness enforcement) and map it through the same public mappers used
by the storefront. `id` is `null`, `createdAt/updatedAt` = now, `stock` = request `stock` or `0`.

**Render path.** admin-fe `LivePreview` debounces the editor form → calls the endpoint → posts
the returned public payload via `postMessage` into an `<iframe>` pointing at main-fe
`/preview/product` or `/preview/blog`. Those routes render the exact `ProductPageClient` /
`BlogDetailPageClient` used by the public pages. The preview routes are `noindex, nofollow`
(`X-Robots-Tag`) and only embeddable by the admin origin (CSP `frame-ancestors`, env
`NEXT_PUBLIC_ADMIN_ORIGIN`). admin-fe reads the public web origin from `VITE_WEB_ORIGIN`.

## 6. Media & Upload

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/media/upload-session`, `/upload-session/{id}/content`, `/finalize` | `DEALER`/`ADMIN`/`SUPER_ADMIN` |
| GET | `/api/v1/media/{id}/download` | public |
| GET | `/api/v1/media/{id}/access-url` | `DEALER`/`ADMIN`/`SUPER_ADMIN` |
| DELETE | `/api/v1/media/{id}` | authenticated (owner/admin checks in `MediaAssetService`) |
| POST | `/api/v1/upload/{category}` | `products/blogs/avatars` → admin; `dealer-avatars/payment-proofs/support-tickets` → dealer+admin |
| GET | `/api/v1/upload/{*path}`, `/uploads/{*path}` | public |

⚠️ **Coexistence of Upload Mechanisms:**
- Hệ thống upload cũ (`UploadController.java` qua `POST /api/v1/upload/{category}`) không lưu trữ DB, chỉ lưu file vật lý và trả về URL. Vẫn được giữ lại cho tính tương thích ngược.
- Hệ thống upload mới sử dụng `MediaAsset` thông qua `POST /api/v1/media/upload-session`. Body yêu cầu nhận thêm các category mới: `PRODUCT`, `BLOG`, và `AVATAR`. Folder lưu trữ trên cloud tương ứng là `products/`, `blogs/`, và `avatars/`. Khi lưu Product/Blog, backend sẽ tự động phân tích và tạo liên kết song song (`linkedEntityType` / `linkedEntityId`) với bảng `media_assets` dựa trên URL download dạng `/api/v1/media/{id}/download`.

## 7. Webhook

| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/webhooks/sepay` | Static webhook token via `?token=`, `X-Webhook-Token`, or `Authorization: Apikey <token>`; validated against admin settings. Idempotent on `transactionCode` (`SepayService`). Not an HMAC signature — SePay issues only an API key. |

### 7.1 ISR revalidation (backend → main-fe, internal)

Outbound, not a public backend endpoint. After an admin writes public catalog/blog/content,
the backend fires an on-demand ISR revalidation so the static `main-fe` site refreshes without
waiting for time-based ISR.

| Method | Path (on main-fe) | Auth |
|---|---|---|
| POST | `{MAIN_FE_INTERNAL_URL}/api/revalidate` | Shared secret via header `x-revalidate-secret: <REVALIDATE_SECRET>`. `401` if missing/mismatch. |

- Body: `{ "tags": string[] }`. Tag vocabulary (mirrors `CacheNames`): `products`, `product:{id}`,
  `blogs`, `blog:{id}`, `content`, `content:{section}`.
- Backend triggers: `createProduct`/`updateProduct`/`deleteProduct`, `createBlog`/`updateBlog`/
  `deleteBlog`, `BlogPublishJob.publishDueBlogs` (scheduled auto-publish), and
  `PublicContentService.upsertSection` — sent `@Async` fire-and-forget (failures are logged,
  never block the business transaction).
- Env: `REVALIDATE_SECRET` (shared with main-fe), `MAIN_FE_INTERNAL_URL` (default
  `http://main-fe:3000`). See `DEPLOYMENT_GUIDE.md` §2.1.

## 8. Active-surface guarantees

`BUSINESS_LOGIC.md` §6 defines the minimum API surface that must not regress. Any change to
auth, dealer, admin return/support, or public catalog/search endpoints must keep that surface
intact and update this document.
