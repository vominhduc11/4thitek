# Data Contract — 4thitek

> Generated: 2026-05-17 from `backend/.../entity`, `.../dto`, and the frontend wire types.
> Evidence markers: `CONFIRMED_FROM_CODE`, `NEEDS_VERIFICATION`. When code and this doc
> disagree, treat the drift as a defect and reconcile in the same change.

## 1. Identity model

JOINED-inheritance: `Account` is the base (`accounts` table); `Admin` and `Dealer` extend it.
Evidence: `entity/Account.java`, `entity/Admin.java`, `entity/Dealer.java`.

| Type | Table | Notable fields |
|---|---|---|
| `Account` | `accounts` | `username` (unique), `email` (unique), `password` (bcrypt), `emailVerified`, `roles` (M:N) |
| `Admin` | `admins` | `displayName`, `roleTitle` (free-text display), `userStatus` (`StaffUserStatus`), `requirePasswordChange` |
| `Dealer` | `dealers` | `businessName`, `contactName`, `taxCode`, `phone`, address parts, `avatarUrl`, `salesPolicy`, `customerStatus` |
| `Role` | `roles` | `name` (= a JWT authority), `permissions` (M:N) |
| `Permission` | `permissions` | `code` (= a JWT authority, e.g. `orders.approve`) — see migration `V42` |

Status: `CONFIRMED_FROM_CODE`. The `dealers` table no longer has `credit_limit` (`V41`); there
is no dealer credit/debt ledger.

## 2. Money & price

| Field | Type in entity/DTO | Notes |
|---|---|---|
| `Product.retailPrice` | `BigDecimal` | Admin write DTO `AdminProductUpsertRequest.retailPrice` is `BigDecimal`, `@DecimalMin 0.0` |
| `Order.subtotalAmount/discountAmount/vatAmount/totalAmount/paidAmount` | `BigDecimal` (`precision 19, scale 2`) | |
| `Order.shippingFee`, `discountPercent`, `vatPercent` | `Integer` | |
| Public product DTO `price` | `long` | `PublicProductDetailResponse`/`PublicProductSummaryResponse` serialize price as an **integer VND `long`**, not `BigDecimal` |

⚠️ **Representation split:** the same business value is `BigDecimal` on the admin/entity side
and `long` on the public side. Intent is whole-VND amounts. Document the serialized shape,
not fractional meaning. Status: `CONFIRMED_FROM_CODE` (`entity/Product.java`,
`dto/publicapi/PublicProductDetailResponse.java`).

## 3. Product media — jsonb columns (highest contract risk)

`Product` stores four schema-free `jsonb` columns. Evidence: `entity/Product.java` lines 49–61.

| Column | Entity Java type | Admin write DTO (`AdminProductUpsertRequest`) | Public read DTO |
|---|---|---|---|
| `image` | `Map<String,Object>` | `Map<String,Object>` | `PublicProductDetailResponse.image` = **`String`** |
| `descriptions` | `List<Map<String,Object>>` | `List<Map<String,Object>>` | `Object` |
| `videos` | `List<Map<String,Object>>` | `List<Map<String,Object>>` | `Object` |
| `specifications` | `List<Map<String,Object>>` | `List<Map<String,Object>>` | `Object` |

⚠️ **Known drift, `NEEDS_VERIFICATION`:**
1. The **inner keys** of these maps are not enforced anywhere (free-form `jsonb`). The schema
   is whatever the admin-fe product editor writes. The canonical key set must be verified
   against `admin-fe/src/lib/blogContent.ts` / the product editor components and the main-fe
   consumer (`main-fe/src/types/api.ts`).
2. **admin-fe internal mismatch:** `admin-fe/src/types/product.ts` (lines 13–16) types
   `image/descriptions/videos/specifications` as **`string`**, while `admin-fe/src/lib/adminApi.ts`
   (lines 111–133) types them as `Record<string,unknown>` / `Array<Record<string,unknown>>`.
   One of the two is wrong — reconcile before relying on either.
3. `image` is an **object** at write/storage time but a **flat `String` URL** in the public
   detail response — confirm the flattening logic in `PublicApiService`.

Until the inner schema is pinned down here, any change to product media is high-risk.

## 4. Order

`entity/Order.java` — key fields: `orderCode` (unique), `status` (`OrderStatus`),
`paymentStatus` (`PaymentStatus`), `paymentMethod` (`PaymentMethod`), financial fields (§2),
`appliedDiscountRuleId/Label`, `idempotencyKey` (dealer-scoped, `V24`), `version` (optimistic
lock, `V19`), `cancelRequestedFrom` + `cancelRequestReason` (`V43`), lifecycle timestamps
`createdAt/confirmedAt/completedAt/updatedAt`, `financialSettlementRequired`, `staleReviewRequired`.

`OrderItem` snapshots `productNameSnapshot`, `productSkuSnapshot`, `unitPrice`, `quantity`.
`V34` added order financial + item snapshots. Status: `CONFIRMED_FROM_CODE`.

## 5. Enum catalog

All from `entity/enums/`. Status: `CONFIRMED_FROM_CODE`.

| Enum | Values |
|---|---|
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `COMPLETED`, `CANCEL_REQUESTED`, `CANCEL_REJECTED`, `CANCELLED` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED` (legacy-only), `CANCELLED` |
| `PaymentMethod` | `BANK_TRANSFER` (only — rejects any other value) |
| `ProductSerialStatus` | `AVAILABLE`, `RESERVED`, `ASSIGNED`, `WARRANTY`, `DEFECTIVE`, `RETURNED`, `INSPECTING`, `SCRAPPED`, `WARRANTY_REPLACED` |
| `WarrantyStatus` | `ACTIVE`, `EXPIRED`, `VOID` |
| `ReturnRequestStatus` | `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_RECEIPT`, `RECEIVED`, `INSPECTING`, `PARTIALLY_RESOLVED`, `COMPLETED`, `CANCELLED` |
| `PublishStatus` | product/blog publish states — see `entity/enums/PublishStatus.java` |
| `BlogStatus` | `PUBLISHED`, `SCHEDULED`, `DRAFT` (per blog publish job) |
| `DealerSupportTicketStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `StaffUserStatus` | `ACTIVE`, `PENDING` (+ others — see file) |
| `CustomerStatus` | dealer account lifecycle (`ACTIVE`, `UNDER_REVIEW`, `SUSPENDED`) |
| `FinancialSettlementType` | `CANCELLATION_REFUND`, `STALE_ORDER_REVIEW` |
| `FinancialSettlementStatus` | settlement lifecycle |
| `UnmatchedPaymentStatus` / `UnmatchedPaymentReason` | SePay reconciliation |
| Others | `DiscountRuleStatus`, `MediaCategory/Status/Type`, `StorageProvider`, `NotifyType`, `OrderAdjustmentType`, `ReturnRequest*` sub-enums, `SupportTicketMessageAuthorRole` |

Enum values surface verbatim in JSON. The frontends mirror them as lowercase strings — see
`admin-fe/src/context/adminDataTypes.ts` and `dealer/lib/models.dart`. Adding an enum value is
a contract change: ship the matching admin-fe + dealer-app labels in the same release.

Allowed **transitions** for every status enum above are documented in
[`../business/STATE_MACHINES.md`](../business/STATE_MACHINES.md).

## 6. Audit log

`entity/AuditLog.java`: `createdAt`, `actor`, `actorRole` (role names only, comma-joined,
`varchar 255`), `action`, `requestMethod`, `requestPath`, `entityType`, `entityId`,
`ipAddress`, `payload` (`jsonb`, free-form). Status: `CONFIRMED_FROM_CODE`.

## 7. Financial settlement

`entity/FinancialSettlement.java`: `order` (FK), `typeValue` (`FinancialSettlementType`),
`amount` (`BigDecimal`), `status`, `createdBy`, `resolution`, `resolvedBy`, timestamps.
This is **not** a dealer receivables ledger — only cancellation-refund and stale-order-review
artifacts. Status: `CONFIRMED_FROM_CODE`.

## 8. Timestamps

`V40` normalized timestamp timezones; `application.properties` sets
`hibernate.jdbc.time_zone=UTC`. Persist/serialize UTC; localize only in the UI.
