# Permission Matrix — 4thitek

> Generated: 2026-05-17 from `config/SecurityConfig.java`, the 13 `controller/Admin*Controller.java`
> classes (the former `AdminController` was split — see `API_CONTRACT.md` §5 for the list),
> `entity/Account.java`, `security/PermissionCatalog.java`, and migration
> `V42__create_permissions_and_seed_internal_roles.sql`. Updated: 2026-07-16.
> Evidence markers: `CONFIRMED_FROM_CODE`, `NEEDS_VERIFICATION`. When code and this doc
> disagree, treat the drift as a defect and reconcile in the same change.

## 1. How authorization works

- Authentication is stateless JWT. The token carries only the username; **authorities are
  resolved fresh from the database on every request** (`security/JWTAuthFilter.java` →
  `OurUserDetailsService` → `Account.getAuthorities()`).
- `Account.getAuthorities()` emits, for every role the account holds: the **role name** (e.g.
  `SALES`) and every **permission code** of that role (e.g. `orders.approve`). Both are plain
  `SimpleGrantedAuthority` strings.
- `ADMIN` and `SUPER_ADMIN` are full-access roles: `getAuthorities()` synthesizes **every**
  permission code for them via `security/PermissionCatalog.java`, independent of the
  `role_permissions` seed.
- Two enforcement layers:
  1. **Coarse URL gate** in `SecurityConfig` — which role families may reach a path prefix.
  2. **Method-level `@PreAuthorize`** on admin controller methods — which permission code is
     required for that specific operation (`@EnableMethodSecurity`).
- Status: `CONFIRMED_FROM_CODE`.

## 2. Role catalog

| Role | Who | Source |
|---|---|---|
| `SUPER_ADMIN` | System owner. Implicitly holds every permission + the `SUPER_ADMIN`-only surfaces. | bootstrap initializer |
| `ADMIN` | Full operational staff. Implicitly holds every permission code (not the `SUPER_ADMIN`-only surfaces). | seeded / assignable |
| `SALES` | Order operations, dealer management, returns, support, discounts. | `V42` |
| `WAREHOUSE` | Serials, inventory, warranty, returns, order processing. | `V42` |
| `ACCOUNTANT` | Payment confirmation, reconciliation, financial settlement. | `V42` |
| `CONTENT_EDITOR` | Products, blogs, public content, media. | `V42` |
| `DEALER` | Dealer-facing app (`/api/v1/dealer/**`). Not a staff role. | dealer registration |

Staff accounts created via `POST /api/v1/admin/users` may be assigned one of
`ADMIN, SALES, WAREHOUSE, ACCOUNTANT, CONTENT_EDITOR` (`systemRole` field). `SUPER_ADMIN` is
**not** assignable through that endpoint. Status: `CONFIRMED_FROM_CODE`
(`AdminManagementService.resolveAssignableSystemRole`).

## 3. Permission code catalog (25 codes)

Defined in migrations `V42` + `V46` and mirrored in `security/PermissionCatalog.ALL_CODES`.

| Code | Grants |
|---|---|
| `orders.read` | View orders |
| `orders.approve` | Approve an order (`PENDING → CONFIRMED`) |
| `orders.process` | Advance processing (`CONFIRMED → PROCESSING → SHIPPING → COMPLETED`) |
| `orders.cancel.review` | Review dealer cancel requests (approve / reject), cancel directly |
| `orders.payment.confirm` | Record / confirm order payments, financial settlement, reconciliation |
| `serials.read` | View product serials |
| `serials.write` | Mutate serials: import, status, RMA, delete |
| `serials.assign` | Assign serials to an order |
| `warranties.read` | View warranties |
| `warranties.write` | Mutate warranty status |
| `returns.read` | View return requests |
| `returns.write` | Process return requests |
| `dealers.read` | View dealers |
| `dealers.write` | Mutate dealer profile / status |
| `support.read` | View support tickets |
| `support.write` | Reply to / update support tickets |
| `products.write` | Mutate products |
| `blogs.write` | Mutate blogs |
| `content.write` | Mutate public content sections |
| `media.write` | Upload / mutate media assets |
| `discounts.write` | Mutate wholesale discount rules |
| `reports.read` | View / export reports |
| `notifications.read` | View admin notifications |
| `notifications.write` | Compose / dispatch admin notifications (`V46`) |
| `dashboard.read` | View the admin dashboard |

## 4. Role × permission matrix

`●` = granted. `SUPER_ADMIN` and `ADMIN` hold all 25 (synthesized in Java). Status:
`CONFIRMED_FROM_CODE` (`V42` + `V46` seed).

| Permission | SUPER_ADMIN | ADMIN | SALES | WAREHOUSE | ACCOUNTANT | CONTENT_EDITOR |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| orders.read | ● | ● | ● | ● | ● | |
| orders.approve | ● | ● | ● | | | |
| orders.process | ● | ● | ● | ● | | |
| orders.cancel.review | ● | ● | ● | | | |
| orders.payment.confirm | ● | ● | | | ● | |
| serials.read | ● | ● | | ● | | |
| serials.write | ● | ● | | ● | | |
| serials.assign | ● | ● | | ● | | |
| warranties.read | ● | ● | | ● | | |
| warranties.write | ● | ● | | ● | | |
| returns.read | ● | ● | ● | ● | | |
| returns.write | ● | ● | ● | ● | | |
| dealers.read | ● | ● | ● | | | |
| dealers.write | ● | ● | ● | | | |
| support.read | ● | ● | ● | | | |
| support.write | ● | ● | ● | | | |
| products.write | ● | ● | | | | ● |
| blogs.write | ● | ● | | | | ● |
| content.write | ● | ● | | | | ● |
| media.write | ● | ● | | | | ● |
| discounts.write | ● | ● | ● | | | |
| reports.read | ● | ● | ● | | ● | |
| notifications.read | ● | ● | ● | ● | ● | ● |
| notifications.write | ● | ● | | | | |
| dashboard.read | ● | ● | ● | ● | ● | ● |

## 5. SUPER_ADMIN-only surfaces

Enforced at the **URL level** in `SecurityConfig` — not granular codes, and not held by
`ADMIN`:

| Path | Method |
|---|---|
| `/api/v1/admin/users`, `/api/v1/admin/users/**` | all |
| `/api/v1/admin/audit-logs` | `GET` |
| `/api/v1/admin/settings` | all |
| `/api/v1/admin/settings/sepay/webhook-token` | `PUT` (`@PreAuthorize hasAuthority('SUPER_ADMIN')`) |
| `/api/v1/admin/settings/test-email` | `POST` (`@PreAuthorize hasAuthority('SUPER_ADMIN')`) |

## 6. Order status transition — per-transition permission

The single endpoint `PATCH /api/v1/admin/orders/{id}/status` requires a permission that
depends on the transition (enforced in `AdminManagementService.assertOrderTransitionPermission`).
`ADMIN`/`SUPER_ADMIN` always pass.

| Transition | Required code |
|---|---|
| `PENDING → CONFIRMED` | `orders.approve` |
| `CONFIRMED → PROCESSING`, `PROCESSING → SHIPPING`, `SHIPPING → COMPLETED` | `orders.process` |
| any `→ CANCELLED`, any `→ CANCEL_REJECTED`, resuming from `CANCEL_REJECTED` | `orders.cancel.review` |

Status: `CONFIRMED_FROM_CODE`. A non-HTTP / system caller (no authenticated principal) skips
this fine-grained check; the HTTP endpoint is still gated by the coarse `@PreAuthorize`.

## 7. Endpoint → permission map (13 `Admin*Controller` classes — see `API_CONTRACT.md` §5)

| Endpoint group | Code |
|---|---|
| `GET /products*` | none (any staff role; URL gate only) |
| `POST/PUT/DELETE /products*` | `products.write` |
| `GET /orders*`, `/orders/{id}/payments`, `/orders/{id}/adjustments` | `orders.read` |
| `PATCH /orders/{id}/status` | `orders.approve` / `orders.process` / `orders.cancel.review` (per §6) |
| `POST /orders/{id}/assign-serials` | `serials.assign` |
| `POST /orders/{id}/payments`, `POST /orders/{id}/adjustments` | `orders.payment.confirm` |
| `DELETE /orders/{id}` | `orders.process` or `orders.cancel.review` |
| `GET /serials*` | `serials.read` |
| `POST /serials/import`, `PATCH /serials/{id}/status`, `PATCH /serials/{id}/rma`, `DELETE /serials/{id}` | `serials.write` |
| `GET /warranties` | `warranties.read` |
| `PATCH /warranties/{id}/status` | `warranties.write` |
| `GET /returns*` | `returns.read` |
| `PATCH /returns/{id}/{review,receive,complete}`, `PATCH /returns/{id}/items/{itemId}/inspect` | `returns.write` |
| `GET /dealers*` | `dealers.read` |
| `PATCH/PUT /dealers/accounts/{id}*` | `dealers.write` |
| `GET /support-tickets*` | `support.read` |
| `PATCH /support-tickets/{id}`, `POST /support-tickets/{id}/messages` | `support.write` |
| `PUT /content/{section}` | `content.write` |
| `POST/PUT/DELETE /blogs*` | `blogs.write` |
| `AdminMediaController` mutations (`PATCH`, `DELETE`) | `media.write` |
| `POST/PUT/PATCH /discount-rules*` | `discounts.write` |
| `GET /reports/export` | `reports.read` |
| `GET /financial-settlements`, `PATCH /financial-settlements/{id}`, `GET /payments/recent`, `GET/PATCH /unmatched-payments*` | `orders.payment.confirm` |
| `GET /dashboard` | `dashboard.read` |
| `GET /notifications/page` | `notifications.read` |
| `POST /notifications` | `notifications.write` (`V46` — replaces the former `SUPER_ADMIN`/`ADMIN` role-hardcoded gate; policy unchanged: only those two roles hold the code) |
| `GET /content*`, `/blogs`, `/categories` | none (any staff role) |

Status: `CONFIRMED_FROM_CODE`.

## 8. Frontend gating (admin-fe)

The internal dashboard (`admin-fe`) gates its navigation and routes by the granular permission
codes above — not by role name (except the SUPER_ADMIN-only surfaces, which stay role-gated).

- **Login / refresh return the resolved codes.** `AuthUserResponse` carries
  `permissions: string[]` (`dto/auth/AuthUserResponse.java`), built in `AuthService.buildAuthResponse`
  by filtering `Account.getAuthorities()` against `security/PermissionCatalog.ALL_CODES`. Role-name
  authorities are dropped; only real codes remain. `ADMIN` / `SUPER_ADMIN` receive **all 25 codes
  explicitly** (not a `*` wildcard token) because `getAuthorities()` already synthesizes them.
  The FE `hasPermission` helper still treats a literal `*` as "all" defensively, but the backend
  never emits it. Status: `CONFIRMED_FROM_CODE`.
- **Who may sign in to admin-fe.** Any internal staff account (`accountType == "ADMIN"`, i.e. an
  `Admin` entity — this includes `SALES`, `WAREHOUSE`, `ACCOUNTANT`, `CONTENT_EDITOR`) may log into
  admin-fe; `DEALER` is rejected client-side (`lib/authSession.ts` → `createAuthSessionFromResponse`).
  The backend already grants those staff roles access to `/api/v1/admin/**`
  (`SecurityConfig.java`, §1), so the client gate now matches the server gate.
- **Insufficient-permission UX.** A user who lacks a route's code is routed to the first module they
  can access; when they can access none, they see a "thiếu quyền" panel
  (`components/auth/RouteGuards.tsx` → `PermissionRoute`). The nav (`layouts/AppLayoutRevamp.tsx`)
  hides items whose code the user lacks and drops empty groups.

### 8.1 Route → permission code (admin-fe)

Single source of truth: `admin-fe/src/config/navPermissions.ts`. For routes whose backend read is
open to any staff and has **no** dedicated `*.read` code (`/products`, `/blogs`, `/discounts`,
`/media`), the nav/route is gated on the corresponding `*.write` code (least-privilege UI; no new
codes were invented). Trade-off: a `WAREHOUSE` / `ACCOUNTANT` user does not see Products/Blogs in
the nav even though the backend would let them `GET` the catalog (§8 / §7 note below).

| Route(s) | Gate |
|---|---|
| `/` (Dashboard, index) | `dashboard.read` — absent → redirect to first accessible module |
| `/profile` | none (any authenticated internal user) |
| `/reports` | `reports.read` |
| `/products`, `/products/new`, `/products/:sku` | `products.write` |
| `/orders`, `/orders/:id` | `orders.read` |
| `/blogs`, `/blogs/:id` | `blogs.write` |
| `/discounts` | `discounts.write` |
| `/dealers`, `/dealers/:id` | `dealers.read` |
| `/support-tickets` | `support.read` |
| `/media` | `media.write` |
| `/returns`, `/returns/:id` | `returns.read` |
| `/warranties` | `warranties.read` |
| `/serials` | `serials.read` |
| `/notifications` | `notifications.read` |
| `/payments/recent`, `/unmatched-payments`, `/financial-settlements` | `orders.payment.confirm` |
| `/users`, `/audit-logs`, `/settings`, `/settings/content` | **SUPER_ADMIN role** (unchanged) |

The SUPER_ADMIN-only surfaces remain role-gated (`SuperAdminRoute`), never relaxed to a permission
code — matching the URL-level gate in §5 and the CLAUDE.md invariant.

> Drift check: §3 (the 24-code catalog) was verified against `PermissionCatalog.ALL_CODES` at the
> time of this change — the two match exactly, no drift.

## 9. Known gaps / `NEEDS_VERIFICATION`

- Catalog read endpoints (`GET /products`, `/blogs`, `/categories`, `/content`) are open to
  **any** staff role — a `WAREHOUSE` or `ACCOUNTANT` user can read the product catalog. This is
  intentional (low-sensitivity) but should be confirmed with the business owner.
- The `cancelReason` field sent by admin-fe / dealer-app on the order-status call is named
  `reason` in the backend DTO (`UpdateDealerOrderStatusRequest`); the admin-fe still posts
  `cancelReason` — harmless (ignored) but a `NEEDS_VERIFICATION` cleanup item.
- WebSocket admin topics treat any non-`DEALER` staff role as "admin"
  (`WebSocketAuthorizationInterceptor`). No per-permission gating on WS subscriptions yet.
