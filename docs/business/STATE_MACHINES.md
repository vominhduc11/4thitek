# State Machines — 4thitek

> Generated: 2026-05-17 from `entity/enums/`, `service/support/*TransitionPolicy.java`,
> `AdminManagementService`, `DealerOrderWorkflowSupport`, `AdminOperationsService`,
> `ReturnRequestService`, and `BUSINESS_LOGIC.md`.
> Evidence markers: `CONFIRMED_FROM_CODE` (transition map traced to a policy/service),
> `NEEDS_VERIFICATION` (states confirmed, exact transition rules not exhaustively traced).
> When code and this doc disagree, treat the drift as a defect and reconcile in the same change.

This document is the single reference for every status enum and its allowed transitions.
`BUSINESS_LOGIC.md` remains the runtime business contract; this file expands the state detail.

---

## 1. Order status — `OrderStatus`

States: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `COMPLETED`, `CANCEL_REQUESTED`,
`CANCEL_REJECTED`, `CANCELLED`. Stored as `varchar` (`@Enumerated(STRING)`), no DB check
constraint. Authority: `service/support/OrderStatusTransitionPolicy.java`. Status:
`CONFIRMED_FROM_CODE`.

### Admin transitions

| From | To | Side effects |
|---|---|---|
| `PENDING` | `CONFIRMED` | requires `paymentStatus = PAID`; sets `confirmedAt` |
| `PENDING` | `CANCELLED` | release serials, restore stock, settlement if `paidAmount > 0` |
| `CONFIRMED` | `PROCESSING` | — |
| `CONFIRMED` | `CANCELLED` | release serials, restore stock, settlement if paid |
| `PROCESSING` | `SHIPPING` | — |
| `PROCESSING` | `CANCELLED` | release serials, restore stock, settlement if paid |
| `SHIPPING` | `COMPLETED` | assign reserved serials to the dealer; sets `completedAt` |
| `CANCEL_REQUESTED` | `CANCELLED` | approve dealer cancel → release serials, restore stock, settlement if paid |
| `CANCEL_REQUESTED` | `CANCEL_REJECTED` | reject dealer cancel — no inventory/financial effect |
| `CANCEL_REJECTED` | `PENDING` / `CONFIRMED` / `PROCESSING` | resume the order; clears `cancelRequestedFrom`/`cancelRequestReason` |
| `CANCEL_REJECTED` | `CANCELLED` | — |
| `COMPLETED`, `CANCELLED` | — | terminal |

### Dealer transitions

| From | To |
|---|---|
| `PENDING` | `CANCEL_REQUESTED` |
| `CONFIRMED` | `CANCEL_REQUESTED` |

A dealer cannot cancel directly. `cancelRequestedFrom` stores the pre-request status so a
rejected request resumes the order. The per-transition permission codes are in
`PERMISSION_MATRIX.md` §6.

### System transitions

`PendingOrderTimeoutJob` may move a stale unpaid `PENDING` order directly to `CANCELLED`
(bypasses the request flow — it is the system actor).

---

## 2. Order payment status — `PaymentStatus`

States: `PENDING`, `PAID`, `FAILED` (legacy-only — not emitted by current paths), `CANCELLED`.
Derived/advanced by `OrderPricingSupport.resolvePaymentStatus` and bank-transfer / SePay
reconciliation. Status: `CONFIRMED_FROM_CODE`.

| From | To | Trigger |
|---|---|---|
| `PENDING` | `PAID` | confirmed bank transfer / SePay reconciliation covering the order total |
| `PENDING` | `CANCELLED` | order cancelled before any confirmed payment |

`PAID` orders must not be cancelled blindly; `CANCELLED` with `paidAmount > 0` raises a
`FinancialSettlement` (`CANCELLATION_REFUND`).

---

## 3. Product serial status — `ProductSerialStatus`

States: `AVAILABLE`, `RESERVED`, `ASSIGNED`, `WARRANTY`, `DEFECTIVE`, `RETURNED`, `INSPECTING`,
`SCRAPPED`, `WARRANTY_REPLACED`.

| From | To | Trigger | Authority |
|---|---|---|---|
| `AVAILABLE` | `RESERVED` | serials assigned to a confirmed order | `AdminManagementService.assignOrderSerials`, `OrderInventorySupport` |
| `RESERVED` / `AVAILABLE` | `ASSIGNED` | order reaches `COMPLETED` — serial transferred to the dealer | `AdminManagementService.updateOrderStatus` |
| `RESERVED` | `AVAILABLE` | order cancelled — `releaseNonWarrantySerials` | `ProductSerialOrderSupport` |
| `ASSIGNED` | `WARRANTY` | warranty activated for the serial | `WarrantyActivationController`, `DealerWarrantyManagementService` |
| `ASSIGNED` / `WARRANTY` | `RETURNED` / `DEFECTIVE` / `INSPECTING` / `SCRAPPED` | return / RMA processing | `ReturnRequestService`, `AdminRmaService` |
| → | `WARRANTY_REPLACED` | replacement serial trace on a warranty return | `AdminRmaService` (`V37`) |

Status: `CONFIRMED_FROM_CODE` for the order-lifecycle transitions; the return/RMA transitions
are `NEEDS_VERIFICATION` — exact guard rules live in `AdminRmaService` and `ReturnRequestPolicy`
and are protected by `AdminSerialInvariantTests` / `DealerSerialWarrantyGuardTests`. A dealer
cannot directly set a serial to `RETURNED` or `DEFECTIVE` (`BUSINESS_LOGIC.md` §0.5).

---

## 4. Warranty status — `WarrantyStatus`

States: `ACTIVE`, `EXPIRED`, `VOID`.

| From | To | Trigger |
|---|---|---|
| (new) | `ACTIVE` | warranty activation |
| `ACTIVE` | `EXPIRED` | warranty period elapsed |
| `ACTIVE` | `VOID` | admin / RMA voids the warranty |

Status: `NEEDS_VERIFICATION` — states `CONFIRMED_FROM_CODE`; exact guards in
`WarrantyStatusSupport` / `DealerWarrantyManagementService`.

---

## 5. Return request status — `ReturnRequestStatus`

`ReturnRequest` is the aggregate root for return business state (`BUSINESS_LOGIC.md` §5.4).
States: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_RECEIPT`, `RECEIVED`,
`INSPECTING`, `PARTIALLY_RESOLVED`, `COMPLETED`, `CANCELLED`.

High-level progression:

1. `SUBMITTED`
2. `UNDER_REVIEW` → `APPROVED` or `REJECTED`
3. `AWAITING_RECEIPT` → `RECEIVED`
4. `INSPECTING` → `PARTIALLY_RESOLVED`
5. `COMPLETED` or `CANCELLED`

Admin RMA actions (`START_INSPECTION`, `PASS_QC`, `SCRAP`) are inspection-level controls on
return items, not a replacement for the request status. Status: `CONFIRMED_FROM_CODE` for the
states and the high-level progression; the exact admin/dealer transition guards live in
`ReturnRequestService` and `service/returns/ReturnRequestPolicy.java` — `NEEDS_VERIFICATION`
for the full per-step matrix.

---

## 6. Support ticket status — `DealerSupportTicketStatus`

States: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. Authority:
`AdminOperationsService.assertSupportTicketTransitionAllowed`. Status: `CONFIRMED_FROM_CODE`.

| From | Allowed to |
|---|---|
| `OPEN` | `OPEN`, `IN_PROGRESS`, `CLOSED` |
| `IN_PROGRESS` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `RESOLVED` | `RESOLVED`, `IN_PROGRESS`, `CLOSED` |
| `CLOSED` | `CLOSED` (terminal) |

Timeline side effects (`synchronizeSupportTicketTimeline`): entering `RESOLVED` sets
`resolvedAt`; entering `CLOSED` sets `closedAt`; returning to `OPEN`/`IN_PROGRESS` clears them.
A `RESOLVED` ticket may be reopened via dealer follow-up.

---

## 7. Dealer account status — `CustomerStatus`

States: `ACTIVE`, `UNDER_REVIEW`, `SUSPENDED`. Authority:
`service/support/DealerAccountStatusTransitionPolicy.java`. Status: `CONFIRMED_FROM_CODE`.

| From | Allowed to |
|---|---|
| `UNDER_REVIEW` | `ACTIVE`, `SUSPENDED` |
| `ACTIVE` | `SUSPENDED` |
| `SUSPENDED` | `ACTIVE` |

A null current status is treated as `ACTIVE`. A non-`ACTIVE` dealer cannot sign in to the
dealer app (`DealerController` / `WarrantyActivationController` enforcement).

---

## 8. Staff user status — `StaffUserStatus`

States: `ACTIVE`, `PENDING`. A new staff account starts `PENDING`; only `ACTIVE` accounts
pass `Account.isEnabled()` and may sign in. An `ACTIVE → PENDING` downgrade is rejected by
`AdminManagementService.updateUserStatus`. Status: `CONFIRMED_FROM_CODE`.

---

## 9. Publish status — `PublishStatus` (products) & `BlogStatus` (blogs)

`PublishStatus` (product / public content): `DRAFT`, `PUBLISHED`, `ARCHIVED`. Public surfaces
show only `PUBLISHED`. Status: `CONFIRMED_FROM_CODE` (enum); transition guards
`NEEDS_VERIFICATION`.

`BlogStatus`: `DRAFT`, `SCHEDULED`, `PUBLISHED`. `BlogPublishJob` promotes `SCHEDULED → PUBLISHED`
when `scheduledAt` (`V18`) is reached. Status: `CONFIRMED_FROM_CODE`.

---

## 10. Media asset status — `MediaStatus`

States observed in `MediaAssetService`: `PENDING` (upload session created), `ACTIVE`
(finalized), `DELETED` (soft delete), `ORPHANED` (cleanup sweep finds no linked entity).
`MediaAssetCleanupJob` drives `ACTIVE/PENDING → ORPHANED/DELETED`. Status: `NEEDS_VERIFICATION`
— states `CONFIRMED_FROM_CODE`, exact transition rules in `MediaAssetService`.

---

## Change rule

Adding or removing a state, or changing a transition, is a contract change: update this file
**and** `BUSINESS_LOGIC.md`, ship the matching admin-fe / dealer-app labels in the same
release, and keep the protective tests (`BUSINESS_LOGIC.md` §7) green.
