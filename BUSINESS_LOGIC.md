# Business Logic - 4thitek Runtime Truth

> Runtime truth version: 2026-04-09
> Scope: `backend`, `dealer`, `admin-fe`, `main-fe`

---

## 0. Mandatory Runtime Rules

These rules are the current production contract. If code, UI, tests, or docs drift away from them, that drift should be treated as a defect.

### 0.1 Payment and order runtime

- New orders support `BANK_TRANSFER` only.
- Backend is the business authority for order, payment, serial, warranty, reconciliation, and notification side effects.
- Order creation must create a real order, generate `orderCode`, preserve idempotency, and reserve stock or serials according to contract.
- A new order starts with `order.status = PENDING` and `paymentStatus = PENDING`.
- Admin must not confirm or process unpaid orders.
- Payment reconciliation is a bank-transfer flow only.

### 0.2 Dealer app runtime

- Dealer app is dark-only.
- Dealer app does not expose a runtime theme switch.
- Language settings may remain runtime features where implemented.

### 0.3 Password reset canonical journey

- Dealer app only starts the forgot-password request.
- `main-fe` is the canonical reset completion surface at `/reset-password`.
- Standard journey:
  1. Dealer or public user submits forgot-password.
  2. Backend always returns a generic success message.
  3. User opens the email link.
  4. `main-fe` validates the token.
  5. `main-fe` submits the new password.
  6. User signs in again with the new password.

### 0.4 Inventory and support

- Dealer inventory is a first-class feature with dedicated backend contracts for summary, serial list, and serial detail or timeline.
- Support ticketing is a threaded workflow with messages, assignee, status, and audit trail.
- Dealer and admin must operate against the same conversation contract.

### 0.5 Public surface

- Public related products and related blogs must use dedicated backend contracts, not fetch-all then slice in the client.
- Public search must use a dedicated backend search contract.
- Public dealer locator must use real dealer data and keep a dedicated route.

### 0.6 Observability

- Blog scheduled publish, payment or webhook async flow, and push dispatch must emit useful structured logs.
- Logs should support tracing and operations, not add noisy or sensitive output.

---

## 1. System Roles

| Component | Primary role |
| --- | --- |
| `backend` | Business authority, API, scheduling, webhook, notification, persistence |
| `dealer` | Dealer-facing transactional app: auth, ordering, inventory, warranty, support |
| `admin-fe` | Internal operations: orders, dealers, serials, support, reconciliation, settings |
| `main-fe` | Public site: catalog, blogs, search, warranty lookup, dealer locator, password reset |

Any behavior change should be traceable from route or screen to API, controller, service, DTO, side effect, and tests.

---

## 2. Dealer Runtime Contract

### 2.1 Authentication

- Dealer sign-in only succeeds for valid and allowed accounts.
- Refresh and logout are backend-controlled.

### 2.2 Forgot password

#### Backend

- `POST /api/v1/auth/forgot-password`
- `GET /api/v1/auth/reset-password/validate`
- `POST /api/v1/auth/reset-password`

Forgot-password must not leak account existence. Reset validation and completion must return flow-safe responses without exposing sensitive account details.

#### Dealer app

- Dealer app only provides the reset request screen.
- Dealer copy should clearly state that reset completion happens on the website through the email link.

#### Main website

- `/reset-password` is the canonical completion flow.
- It must handle missing token, valid token, invalid token, expired token, successful submit, and failed submit.

### 2.3 Ordering and payment

- Dealer creates orders with `BANK_TRANSFER`.
- Dealer checkout must not expose any alternate payment method.
- Payment records are created and advanced only through bank-transfer confirmation and reconciliation flows.

### 2.4 Inventory

- Minimum active contracts:
  - `GET /api/v1/dealer/inventory/summary`
  - `GET /api/v1/dealer/inventory/serials`
  - `GET /api/v1/dealer/inventory/serials/{id}`

### 2.5 Support

- Dealer can create a ticket, view the thread, and send follow-up messages while the ticket is still operationally open.
- A resolved ticket may be reopened through follow-up if current workflow allows it.

### 2.6 Settings

- Dealer app does not expose runtime light or dark switching.

---

## 3. Admin Runtime Contract

### 3.1 Dealer management

- Admin manages dealer profile and dealer status.
- Admin surfaces must not present unsupported payment controls as active runtime operations.

### 3.2 Support operations

- Admin can review ticket lists and ticket threads.
- Admin can update valid statuses, assign ownership, send public replies, and leave internal notes where supported.
- Important workflow changes should leave an audit trail.

### 3.3 Payment reconciliation

- Admin reviews recent bank-transfer payments, unmatched payments, and settlement-related data.
- UI copy must describe these as reconciliation and payment operations.

---

## 4. Public Website Runtime Contract

### 4.1 Catalog and related content

- Product detail uses a dedicated related-products API.
- Blog detail uses a dedicated related-blogs API.

### 4.2 Search

- Public search uses a dedicated backend contract.

### 4.3 Dealer locator

- Dealer locator uses real public dealer data.
- Legacy aliases may redirect for compatibility.

### 4.4 Warranty lookup

- Public warranty lookup must follow the existing serial and warranty invariants.

---

## 5. Backend Domain Rules

### 5.1 Orders and payments

- Order idempotency must remain intact.
- Exact-match payment reconciliation rules must not regress.
- Stale orders with financial evidence must not be cancelled blindly.

### 5.2 Serial lifecycle

- Inventory read models must follow current serial lifecycle rules.
- Valid serial and warranty transitions must not regress.

### 5.3 Support workflow

- Minimum ticket statuses remain `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
- Thread messages must preserve author role.
- Internal notes must never leak to dealer-facing surfaces.

---

## 6. Minimum Active API Surface

### 6.1 Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `GET /api/v1/auth/reset-password/validate`
- `POST /api/v1/auth/reset-password`

### 6.2 Dealer

- `GET /api/v1/dealer/inventory/summary`
- `GET /api/v1/dealer/inventory/serials`
- `GET /api/v1/dealer/inventory/serials/{id}`
- `GET /api/v1/dealer/support-tickets/latest`
- `GET /api/v1/dealer/support-tickets/page`
- `GET /api/v1/dealer/support-tickets`
- `POST /api/v1/dealer/support-tickets`
- `POST /api/v1/dealer/support-tickets/{id}/messages`

### 6.3 Admin

- `GET /api/v1/admin/support-tickets`
- `PATCH /api/v1/admin/support-tickets/{id}`
- `POST /api/v1/admin/support-tickets/{id}/messages`
- Reconciliation endpoints for recent payments, unmatched payments, and financial settlements

### 6.4 Public

- `GET /api/v1/product/products`
- `GET /api/v1/product/{id}`
- `GET /api/v1/product/products/related/{id}`
- `GET /api/v1/blog/blogs`
- `GET /api/v1/blog/{id}`
- `GET /api/v1/blog/blogs/related/{id}`
- `GET /api/v1/search`
- `GET /api/v1/user/dealer`
- `GET /api/v1/user/dealer/page`

---

## 7. Test Alignment

After business-contract changes, tests should continue to protect:

- bank-transfer-only order and payment runtime
- password reset canonical journey
- threaded support workflow
- dealer inventory contracts
- related content contracts
- public search contract
- important observability side effects
- user-facing copy or encoding when touched
