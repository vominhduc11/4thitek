# Business Logic - 4thitek Runtime Truth

> Runtime truth version: 2026-04-13
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

### 0.5 Return request runtime truth

- Return Request is a first-class business workflow and runtime source of truth for dealer returns.
- Support tickets linked to returns are communication channels only, not the return state machine.
- Admin RMA actions are technical inspection or quality decisions inside return processing, not a replacement for return request lifecycle state.
- Dealer-side direct mutation of serial status to `RETURNED` or `DEFECTIVE` is blocked; dealer must submit return requests through return APIs.
- Duplicate active return requests for the same serial are rejected.
- Eligible return creation requires completed order ownership, eligible serial state, and no active return request for that serial.

### 0.6 Public surface

- Public related products and related blogs must use dedicated backend contracts, not fetch-all then slice in the client.
- Public search must use a dedicated backend search contract.
- Public dealer locator must use real dealer data and keep a dedicated route.

### 0.7 Observability

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

### 2.7 Return requests

#### Dealer runtime

- Dealer has dedicated return workflow screens: list, detail, create.
- Dealer can open return workflow from:
  1. dedicated returns navigation entry
  2. completed order detail
  3. inventory serial detail eligibility flow
- If a serial already has an active request, dealer UX deep-links to the active request instead of creating duplicates.
- Return status indicators must represent at least:
  1. eligible for return
  2. return requested
  3. awaiting admin review
  4. awaiting receipt
  5. inspecting
  6. completed
  7. rejected

#### Dealer active APIs

- `GET /api/v1/dealer/returns/page`
- `GET /api/v1/dealer/returns/{id}`
- `POST /api/v1/dealer/returns`
- `POST /api/v1/dealer/returns/{id}/cancel`
- `GET /api/v1/dealer/orders/{id}/return-eligible-serials`
- `GET /api/v1/dealer/inventory/serials/{id}/return-eligibility`

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

### 3.4 Return operations

- Admin return surfaces operate on Return Request as the canonical workflow object.
- Admin can review, receive, inspect, and complete return requests through dedicated return APIs.
- Admin RMA actions (`START_INSPECTION`, `PASS_QC`, `SCRAP`) are inspection-level controls applied to return request items.
- Admin decisions and processing events must be reflected in Return Request status and event timeline.

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

### 5.4 Return request workflow invariants

- `ReturnRequest` is the aggregate root for return business state.
- `ReturnRequestItem` stores per-serial decision, inspection, and final outcome state.
- `ProductSerial` inventory status changes tied to returns are backend-controlled and occur through return processing steps.
- `SupportTicket` linkage is optional and advisory; return validity does not depend on support ticket status.
- Admin RMA records are technical inspection artifacts and do not replace return request status.

High-level state progression (non-exhaustive):
1. `SUBMITTED`
2. `UNDER_REVIEW` / `APPROVED` / `REJECTED`
3. `AWAITING_RECEIPT` / `RECEIVED`
4. `INSPECTING` / `PARTIALLY_RESOLVED`
5. `COMPLETED` or `CANCELLED`

### 5.5 Return entity relationships

- `ReturnRequest (1) -> (many) ReturnRequestItem`
- `ReturnRequest (1) -> (many) ReturnRequestAttachment`
- `ReturnRequest (1) -> (many) ReturnRequestEvent`
- `ReturnRequest -> Dealer`
- `ReturnRequest -> Order`
- `ReturnRequestItem -> ProductSerial`
- `ReturnRequest -> optional DealerSupportTicket`
- Return item inspection may invoke Admin RMA actions; those actions update return item and request workflow state.

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
- `GET /api/v1/dealer/returns/page`
- `GET /api/v1/dealer/returns/{id}`
- `POST /api/v1/dealer/returns`
- `POST /api/v1/dealer/returns/{id}/cancel`
- `GET /api/v1/dealer/orders/{id}/return-eligible-serials`
- `GET /api/v1/dealer/inventory/serials/{id}/return-eligibility`
- `GET /api/v1/dealer/support-tickets/latest`
- `GET /api/v1/dealer/support-tickets/page`
- `GET /api/v1/dealer/support-tickets`
- `POST /api/v1/dealer/support-tickets`
- `POST /api/v1/dealer/support-tickets/{id}/messages`

### 6.3 Admin

- `GET /api/v1/admin/support-tickets`
- `PATCH /api/v1/admin/support-tickets/{id}`
- `POST /api/v1/admin/support-tickets/{id}/messages`
- `GET /api/v1/admin/returns/page`
- `GET /api/v1/admin/returns/{id}`
- `PATCH /api/v1/admin/returns/{id}/review`
- `PATCH /api/v1/admin/returns/{id}/receive`
- `PATCH /api/v1/admin/returns/{id}/items/{itemId}/inspect`
- `PATCH /api/v1/admin/returns/{id}/complete`
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
- return workflow state transitions, duplicate prevention, and eligibility checks
