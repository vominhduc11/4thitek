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

## 5. Admin — `/api/v1/admin` (`AdminController`, `AdminMediaController`)

Endpoints are gated by **granular permission codes** (`@PreAuthorize`). Summary by domain;
full endpoint list in `AdminController.java`.

| Domain | Endpoints (representative) | Permission code |
|---|---|---|
| Products | `GET/POST/PUT/DELETE /products*` | read: open to staff; write: `products.write` |
| Orders | `GET /orders*` ; `PATCH /orders/{id}/status` ; `POST /orders/{id}/assign-serials` ; `POST /orders/{id}/payments` | `orders.read`, `orders.approve` / `orders.process` / `orders.cancel.review` (per transition), `serials.assign`, `orders.payment.confirm` |
| Serials | `GET/POST/PATCH/DELETE /serials*`, `PATCH /serials/{id}/rma` | read `serials.read`, write `serials.write` |
| Warranties | `GET /warranties`, `PATCH /warranties/{id}/status` | `warranties.read` / `warranties.write` |
| Returns | `GET /returns*`, `PATCH /returns/{id}/{review,receive,complete}`, `PATCH /returns/{id}/items/{itemId}/inspect` | `returns.read` / `returns.write` |
| Dealers | `GET /dealers*`, `PATCH/PUT /dealers/accounts/{id}*` | `dealers.read` / `dealers.write` |
| Support | `GET /support-tickets*`, `PATCH /support-tickets/{id}`, `POST .../messages` | `support.read` / `support.write` |
| Financial | `GET/PATCH /financial-settlements*`, `GET /payments/recent`, `GET/PATCH /unmatched-payments*`, `GET/POST /orders/{id}/adjustments` | `orders.payment.confirm` |
| Content | `GET/PUT /content/{section}`, `GET/POST/PUT/DELETE /blogs*` | `content.write`, `blogs.write` |
| Media | `AdminMediaController` mutations | `media.write` |
| Discounts | `GET/POST/PUT/PATCH /discount-rules*` | `discounts.write` |
| Reports/Dashboard | `GET /reports/export`, `GET /dashboard`, `GET /notifications/page` | `reports.read`, `dashboard.read`, `notifications.read` |
| Users / Settings / Audit | `/users**`, `/settings`, `GET /audit-logs` | `SUPER_ADMIN` only (URL-level) |

## 6. Media & Upload

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/media/upload-session`, `/upload-session/{id}/content`, `/finalize` | `DEALER`/`ADMIN`/`SUPER_ADMIN` |
| GET | `/api/v1/media/{id}/download` | public |
| GET | `/api/v1/media/{id}/access-url` | `DEALER`/`ADMIN`/`SUPER_ADMIN` |
| DELETE | `/api/v1/media/{id}` | authenticated (owner/admin checks in `MediaAssetService`) |
| POST | `/api/v1/upload/{category}` | `products/blogs/avatars` → admin; `dealer-avatars/payment-proofs/support-tickets` → dealer+admin |
| GET | `/api/v1/upload/{*path}`, `/uploads/{*path}` | public |

## 7. Webhook

| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/webhooks/sepay` | Static webhook token via `?token=`, `X-Webhook-Token`, or `Authorization: Apikey <token>`; validated against admin settings. Idempotent on `transactionCode` (`SepayService`). Not an HMAC signature — SePay issues only an API key. |

## 8. Active-surface guarantees

`BUSINESS_LOGIC.md` §6 defines the minimum API surface that must not regress. Any change to
auth, dealer, admin return/support, or public catalog/search endpoints must keep that surface
intact and update this document.
