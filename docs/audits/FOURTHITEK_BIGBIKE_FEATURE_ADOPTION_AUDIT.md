# 4thitek x BigBike Feature Adoption Audit

> Audit date: 2026-05-17
> Auditor: Claude Code (automated source audit)
> Phase: AUDIT + TRACE + REPORT only — no business code changed.
> Projects audited:
> - 4thitek — `S:\project\4thitek` (B2B distributor / dealer system for SCS motorcycle intercom)
> - BigBike — `S:\project\bigbike` (B2C / B2C-like ecommerce)

---

## 1. Executive Summary

### Overall verdict

**4thitek is NOT a greenfield project that needs BigBike modules imported wholesale.** It is already a reasonably mature B2B distributor platform with backend (Spring Boot, 41 Flyway migrations V1–V41, ~80+ tests), admin-fe (Vite/React, ~47 pages with tests), main-fe (Next.js public site), and a Flutter dealer app. It already owns the core B2B flow: dealer auth, dealer cart/checkout, admin order approval, bank-transfer + SePay payment, serial/inventory lifecycle, warranty activation, return-request workflow, audit logs, media library, blog CMS, support tickets, and notifications.

Therefore BigBike's value to 4thitek is **as a pattern reference and a gap-detector**, not as a code donor. BigBike is a B2C retail system; copying its commerce logic directly would actively damage 4thitek's B2B model.

The correct way to use BigBike: treat it as a checklist of "operational maturity features a Vietnamese ecommerce/distribution admin platform tends to need", then adopt only the *patterns* for the handful of capabilities 4thitek genuinely lacks.

### Top BigBike modules/patterns 4thitek SHOULD adopt (pattern only)

| Rank | Pattern from BigBike | Why | Priority |
|---|---|---|---|
| 1 | Granular roles & permissions (`roles`/`permissions` tables, `*.read`/`*.write` authorities) | 4thitek currently has only 3 coarse authorities (`SUPER_ADMIN`, `ADMIN`, `DEALER`). No sales/warehouse/accountant/content separation. | P0 |
| 2 | Redirect manager (`RedirectEntity`, `AdminRedirectController`, WordPress redirect import) | 4thitek main-fe is SEO-first but has no admin-managed redirect table — only hardcoded Next.js redirects. | P1 |
| 3 | Menu manager + Slider/Hero + Home video (system-slot pattern) | 4thitek has a limited `PublicContentEntry` CMS but no menu/slider/home-video management. | P1/P2 |
| 4 | Reports module depth (export indexes, dedicated report permissions) | 4thitek has `AdminReportingService` + export; BigBike's report indexing/permission pattern is a useful maturity reference. | P2 |
| 5 | Contact / lead inbox (`ContactMessageEntity`, status workflow) | 4thitek main-fe has a contact page but no audited evidence of a persisted lead inbox. NEEDS_CONFIRMATION. | P2 |
| 6 | Shipping fulfillment tracking fields (carrier + tracking code) | 4thitek `Order` has no carrier/tracking-code columns; only a `SHIPPING` status. | P1 |

### Top BigBike modules 4thitek MUST NOT copy

| BigBike module | Why it must not be copied |
|---|---|
| Guest checkout / `CheckoutController` retail flow | 4thitek orders are dealer-scoped, idempotency-keyed per dealer, bank-transfer only. A guest/retail checkout breaks the actor model. |
| Customer account B2C (`CustomerEntity`, `CustomerAuthController`, customer sessions) | 4thitek explicitly removed customer accounts (`V3__remove_customer_accounts.sql`). End-customers are not accounts. |
| Wishlist (`WishlistItemEntity`, `CustomerWishlistController`) | A B2C convenience feature; dealers order from a catalog, they do not "wishlist". |
| POS retail (`AdminPosController`, `PosOrderService`, CASH/CARD_TERMINAL) | 4thitek is a distributor; there is no retail counter sale. |
| Public order lookup (`OrderLookupController`) | B2B orders carry dealer pricing, discount tiers and financial data — must never be publicly lookable. |
| Coupons / coupon-gift campaigns (`CouponEntity`, `AdminCouponController`) | Retail promo mechanic. 4thitek already has `BulkDiscount` wholesale tiers, which is the correct B2B equivalent. |
| User-generated reviews (`ReviewEntity`, `PublicReviewController`) | B2C UGC. For 4thitek, "review/trust" content should be editorial/SEO content, not customer-submitted. |
| B2C return/refund with payment refund transactions (`RefundTransactionEntity`) | 4thitek already has a first-class `ReturnRequest` workflow; do not layer the B2C refund model on top. |

### Biggest risks

1. **Risk of regression by adoption.** 4thitek's commerce contract is documented as runtime truth in `BUSINESS_LOGIC.md` (bank-transfer only, dealer-scoped idempotency, return-request as aggregate root). Importing BigBike retail patterns risks silently violating these.
2. **Permission model is the weakest area.** All admin staff currently collapse into `ADMIN` or `SUPER_ADMIN`. A warehouse user can hit the same endpoints as an accountant. This is a real operational/audit risk for a distributor.
3. **SePay webhook auth is a static shared token, not a signature.** Acceptable for SePay (which only issues an API key) but should be confirmed and documented.
4. **No credit limit / debt ledger.** `V41__drop_dealers_credit_limit.sql` removed credit limit; `FinancialSettlement` is only for cancellation refunds and stale-order review, not a receivables ledger. If the business wants dealer "công nợ", that is a *new build*, not a BigBike copy — and `ReceivableEntity` from BigBike is customer-AR, not dealer-credit.

---

## 2. Scope & Methodology

### Paths audited

- 4thitek: `S:\project\4thitek` — `backend/`, `admin-fe/`, `main-fe/`, `dealer/`, `docs/`, `schema_only.sql`, `BUSINESS_LOGIC.md`, `CHANGELOG.md`, `README.md`.
- BigBike: `S:\project\bigbike` — `bigbike-backend/`, `bigbike-admin/`, `bigbike-web/`, `bigbike_mobile/`, `docs/business/`, `docs/engineering/`, `CLAUDE.md`.

### What was inspected (evidence base)

- **4thitek backend**: 12 controllers, 36 entities, 32 enums, ~60 services/support classes, 41 migrations (`V1`–`V41`), `config/SecurityConfig.java`, ~70 test files in `backend/src/test`.
- **4thitek admin-fe**: `src/pages/` (~47 page files incl. `*.test.tsx`), `src/lib/` API client layer (`adminApi.ts`, `backendApi.ts`, `authApi.ts`, `adminRealtime.ts`).
- **4thitek main-fe**: `src/app/` route tree, `src/lib/` (`publicApiServer.ts`, `seo.ts`, `warrantyLookup.ts`), `src/services/apiService.ts`, `src/types/api.ts`.
- **4thitek dealer**: `dealer/lib/` (~70 Dart files — auth, cart, checkout, orders, inventory, returns, warranty, support, notifications).
- **BigBike backend**: 50 controllers under `api/**`, 68 entities, ~123 migrations (`V1`–`V123`), `docs/business/MODULE_CATALOG.md`, `docs/business/STATE_MACHINES.md`.
- **BigBike admin**: 37 screens under `bigbike-admin/src/screens/`.
- **BigBike web**: route tree under `bigbike-web/app/`.

### Limitations / UNKNOWN

- **BigBike `bigbike-backend/src/test` is empty** (0 test files found). BigBike's documented "tests" in `MODULE_CATALOG.md` reference test names that are not present in the audited tree — treat BigBike test coverage as `UNKNOWN`.
- 4thitek main-fe `Contact` page persistence path was not fully traced to a backend entity — marked `NEEDS_CONFIRMATION`.
- 4thitek admin-fe / main-fe / dealer field-level DTO diffing was sampled, not exhaustively diffed line-by-line — type-mismatch findings are `NEEDS_CONFIRMATION` where not directly confirmed.
- No running containers were queried; this audit is static-source only.
- Where evidence was insufficient, the row is marked `UNKNOWN` or `NEEDS_CONFIRMATION` — no guessing.

---

## 3. BigBike Module Inventory

Evidence roots: `bigbike/bigbike-backend/src/main/java/com/bigbike/bigbike_backend/`, `bigbike/bigbike-admin/src/screens/`, `bigbike/bigbike-web/app/`, `bigbike/docs/business/MODULE_CATALOG.md`.

| # | BigBike module | UI surface | Backend evidence | Entity / table evidence |
|---|---|---|---|---|
| 1 | Customer auth (B2C) | web `/dang-nhap`,`/dang-ky`,`/quen-mat-khau`,`/xac-nhan-email` | `api/customer/CustomerAuthController.java` | `customer/CustomerEntity.java`, `CustomerSessionEntity`, `CustomerEmailVerificationTokenEntity`, `CustomerPasswordResetTokenEntity` (V3, V9) |
| 2 | Admin auth | admin `LoginScreen.jsx` | `api/auth/AuthController.java` | `auth/AdminUserEntity.java`, `AdminRefreshTokenEntity`, `AdminRoleEntity` (V2) |
| 3 | Product catalog | web `/san-pham`,`/product/[slug]`; admin `ProductListScreen`,`ProductDetailScreen` | `api/catalog/CatalogController.java`, `api/admin/AdminCatalogController.java` | `catalog/ProductEntity`, `ProductVariantEntity`, `ProductVariantOptionEntity` (V1) |
| 4 | Categories / brands | web `/danh-muc-san-pham`,`/brands`; admin `CategoryListScreen`,`BrandListScreen` | `AdminCatalogController.java`, `CatalogController.java` | `catalog/CategoryEntity`, `BrandEntity` (V1, V91 brand banner) |
| 5 | Product media / gallery / spec / video | admin `ProductDetailScreen` | `AdminCatalogController.java` | `ProductGalleryImageEntity`, `ProductSpecificationEntity`, `ProductVideoEntity`, `ProductVariantGalleryImageEntity` (V41) |
| 6 | Product attributes / tags | admin product detail | `AdminCatalogController.java` | `AttributeEntity`, `AttributeValueEntity`, `ProductTagEntity` (V14,V15) |
| 7 | Cart | web `/gio-hang` | `api/cart/CartController.java` | `commerce/cart/CartEntity`, `CartItemEntity`, `CartCouponEntity` (V6,V115) |
| 8 | Checkout | web `/thanh-toan` | `api/checkout/CheckoutController.java` | `commerce/order/CheckoutIdempotencyKeyEntity` (V62) |
| 9 | Customer orders | web `/don-hang`,`/tai-khoan/don-hang` | `api/order/CustomerOrderController.java` | `commerce/order/OrderEntity`, `OrderLineItemEntity`, `OrderAddressEntity`, `OrderNoteEntity`, `OrderFeeItemEntity`, `OrderShippingItemEntity` (V7) |
| 10 | Public order lookup | web `/don-hang/[id]` | `api/order/OrderLookupController.java` | `OrderEntity` |
| 11 | Admin order management | admin `OrderListScreen`,`OrderDetailScreen` | `api/admin/AdminOrderController.java` | `OrderEntity`; states `PENDING/PROCESSING/ON_HOLD/COMPLETED/CANCELLED/FAILED/REFUNDED` (`STATE_MACHINES.md` §6) |
| 12 | Customer account | web `/tai-khoan/*` | `api/customer/CustomerController.java`, `CustomerAddressController.java` | `CustomerEntity`, `CustomerAddressEntity` |
| 13 | Wishlist | web `/tai-khoan/yeu-thich` | `api/customer/CustomerWishlistController.java` | `commerce/WishlistItemEntity` (V103) |
| 14 | Reviews (UGC) | web product page; admin `ReviewListScreen` | `api/public_/PublicReviewController.java`, `api/admin/AdminReviewController.java` | `catalog/ReviewEntity` (V14,V60,V63) |
| 15 | Coupons / promotions | admin `CouponListScreen` | `api/admin/AdminCouponController.java`, `AdminCouponGiftController.java` | `coupon/CouponEntity` (V20,V118,V119) |
| 16 | POS | admin `PosScreen.jsx` | `api/admin/AdminPosController.java` | reuses `OrderEntity`; `PosOrderService` (V71,V79,V112,V113) |
| 17 | Inventory | admin `InventoryScreen.jsx` | `api/admin/AdminInventoryController.java` | `catalog/StockMovementEntity`, `StockMovementSerialEntity` (V30,V50,V57) |
| 18 | Serial management | admin `SerialListScreen.jsx` | `AdminInventoryController.java` | `catalog/ProductSerialEntity`, `OrderLineItemSerialEntity`, `ReturnItemSerialEntity` (V51,V89,V90,V99) |
| 19 | Warranty | web `/bao-hanh`; admin `WarrantyListScreen` | `api/public_/PublicWarrantyController.java`, `api/admin/AdminWarrantyController.java` | `commerce/warranty/WarrantyRecordEntity` (V90) |
| 20 | Returns / RMA | admin `ReturnListScreen`; web `/tai-khoan/doi-tra` | `api/admin/AdminReturnController.java` | `commerce/returns/ReturnEntity`, `ReturnItemEntity`, `ReturnHistoryEntity` (V31,V39,V65,V66,V104) |
| 21 | Accounts receivable / credit | admin `ReceivablesListScreen`,`ReceivableDetailScreen` | `api/admin/AdminReceivableController.java` | `commerce/receivable/ReceivableEntity` (V75,V83) |
| 22 | Payment / SePay | (checkout) | webhook + `PaymentEntity` logic | `commerce/payment/PaymentEntity`, `PaymentEventEntity`, `RefundTransactionEntity` (V8,V44,V47,V101,V114) |
| 23 | Shipping config | admin `ShippingScreen.jsx` | `api/admin/AdminShippingController.java` | `shipping/ShippingZoneEntity`, `ShippingMethodEntity` (V5,V68,V100) |
| 24 | Reports / analytics | admin `ReportsScreen.jsx` | `api/admin/AdminReportController.java` | report indexes (V77,V78,V113) |
| 25 | Dashboard | admin `DashboardScreen.jsx` | `api/admin/AdminDashboardController.java` | aggregate reads |
| 26 | Content CMS (articles/pages) | web `/tin-tuc`,`/[slug]`; admin `ContentListScreen` | `api/content/ContentController.java`, `api/admin/AdminContentController.java` | `content/ArticleEntity`, `PageEntity`, `ContentCategoryEntity`, `ContentAuthorEntity`, `BlogTagEntity` (V1,V69,V98) |
| 27 | Media library | admin `MediaLibraryScreen.jsx` | `AdminMediaController.java`, `AdminMediaFolderController.java` | `media/MediaEntity`, `MediaFolderEntity` (V4,V37,V85) |
| 28 | Menu manager | admin `MenuScreen.jsx` | `api/admin/AdminMenuController.java`, `api/public_/PublicMenuController.java` | `menu/MenuEntity`, `MenuItemEntity` (V4,V84 system slots) |
| 29 | Slider / banner | admin `SliderListScreen.jsx` | `api/admin/AdminSliderController.java`, `PublicSliderController.java` | `slider/SliderEntity` (V17,V27,V34,V92) |
| 30 | Home video | admin `HomeVideoListScreen.jsx` | `api/admin/AdminHomeVideoController.java`, `PublicHomeVideoController.java` | `video/HomeVideoEntity` (V35,V36,V72) |
| 31 | Redirect / SEO migration | admin `RedirectListScreen.jsx` | `api/admin/AdminRedirectController.java`, `api/internal/InternalRedirectController.java` | `redirect/RedirectEntity` (V58,V80,V106); `migration/wordpress/**` importer |
| 32 | Contact inbox | web `/lien-he`; admin `ContactInboxScreen.jsx` | `api/public_/ContactController.java`, `api/admin/AdminContactController.java` | `contact/ContactMessageEntity` (V105) |
| 33 | Notifications / WebSocket | admin notification bell | `api/admin/AdminNotificationController.java` | `admin/AdminNotificationEntity` (V102) |
| 34 | Settings | admin `SettingsScreen.jsx` | `api/admin/AdminSettingsController.java`, `PublicSettingsController.java` | `settings/SiteSettingEntity` (V5,V21–V24,V29,V40,V45,V48) |
| 35 | Admin users | admin `AdminUsersScreen.jsx` | `api/admin/AdminAdminUsersController.java` | `auth/AdminUserEntity` (V2,V12) |
| 36 | Roles / permissions | admin `RolesScreen.jsx` | `api/admin/AdminRolesController.java`, `AdminPermissionsController.java` | `roles`/`permissions` tables (V49,V81); `*.read`/`*.write` authorities |
| 37 | Audit logs | admin `AuditLogListScreen.jsx` | `api/admin/AdminAuditLogController.java` | `audit/AuditLogEntity` (V76) |
| 38 | VN address lookup | web checkout | `api/public_/VnAddressController.java` | static dataset |
| 39 | WordPress migration | (offline tool) | `migration/wordpress/**` (importer, redirect, media, normalizer, parser) | legacy import (V93,V106) |

---

## 4. 4thitek Current Module Inventory

Evidence roots: `4thitek/backend/src/main/java/com/devwonder/backend/`, `4thitek/admin-fe/src/pages/`, `4thitek/main-fe/src/app/`, `4thitek/dealer/lib/`, `BUSINESS_LOGIC.md`.

| # | 4thitek module | UI surface | Backend evidence | Entity / migration evidence |
|---|---|---|---|---|
| 1 | Auth (admin + dealer, JWT, refresh sessions) | dealer `login_screen.dart`; admin `LoginPage.tsx`; main-fe `/reset-password` | `controller/AuthController.java`, `service/AuthService.java`, `AuthRefreshCookieService` | `entity/Account.java`, `Admin`, `Dealer`, `RefreshTokenSession`, `PasswordResetToken`, `EmailVerificationToken` (V20,V22) |
| 2 | Roles | — (coarse) | `config/SecurityConfig.java` authorities `SUPER_ADMIN/ADMIN/DEALER` | `entity/Role.java` (name + description only, no permissions) |
| 3 | Dealer management | admin `DealersPageRevamp.tsx`,`DealerDetailPage.tsx` | `service/AdminManagementService.java`, `DealerAccountLifecycleService` | `entity/Dealer.java`, `CustomerStatus` (V16,V41 dropped credit limit) |
| 4 | Dealer auth / profile | dealer `account_screen.dart`,`business_profile.dart` | `AuthController.java`, `DealerController.java` | `Dealer` profile fields |
| 5 | Product / catalog | admin `ProductsPage.tsx`,`CreateProductPage.tsx`,`ProductDetailPage.tsx`; main-fe `/products/[id]`; dealer `product_list_screen.dart` | `controller/PublicController.java`, `AdminController.java` | `entity/Product.java` (jsonb image/descriptions/videos/specifications), `PublishStatus` |
| 6 | Product media / specs / videos | admin product editor | `AdminController.java`, `MediaAssetService` | `Product` jsonb columns; `MediaAsset` |
| 7 | Bulk / wholesale discount | admin `WholesaleDiscountsPageRevamp.tsx` | `BulkDiscountTierSupport.java`, `AdminDiscountRuleContractTests` | `entity/BulkDiscount.java`, `DiscountRuleStatus` (V30) |
| 8 | Dealer cart | dealer `cart_screen.dart`,`cart_controller.dart` | `DealerCartSupport.java`, `DealerPortalService` | `entity/DealerCartItem.java`, `DealerCartItemId` |
| 9 | Dealer checkout / order | dealer `checkout_screen.dart`,`orders_screen.dart` | `DealerController.java`, `DealerOrderWorkflowSupport`, `OrderStatusTransitionPolicy` | `entity/Order.java`, `OrderItem`, `OrderStatus` (PENDING/CONFIRMED/SHIPPING/COMPLETED/CANCELLED) |
| 10 | Admin order management | admin `OrdersPageRevamp.tsx`,`OrderDetailPage.tsx` | `AdminOperationsService.java`, `AdminOrderNotificationSupport` | `Order`, `OrderAdjustment` (V19 version, V27 confirmed_at, V34 snapshots) |
| 11 | Payment / bank transfer / SePay | dealer `bank_transfer_support.dart`; admin `RecentPaymentsPageRevamp.tsx`,`UnmatchedPaymentsPageRevamp.tsx` | `controller/SepayWebhookController.java`, `service/SepayService.java`, `PaymentReconciliationJob` | `entity/Payment.java`, `UnmatchedPayment`, `PaymentMethod` (BANK_TRANSFER only), `PaymentStatus` (V23,V24,V26,V47) |
| 12 | Financial settlement | admin `FinancialSettlementsPageRevamp.tsx` | `service/AdminFinancialService.java` | `entity/FinancialSettlement.java`, type `CANCELLATION_REFUND`/`STALE_ORDER_REVIEW` (V34) |
| 13 | Inventory (dealer + admin) | dealer `inventory_screen.dart`; admin `SerialsPageRevamp.tsx` | `service/DealerInventoryService.java`, `AdminOperationsService` | `entity/ProductSerial.java`, `ProductSerialStatus` (V8,V9,V10,V15,V89-style) |
| 14 | Serial lifecycle | admin serials; dealer `serial_scan_screen.dart` | `ProductSerialOrderSupport.java`, `OrderInventorySupport` | `ProductSerialStatus`: AVAILABLE/RESERVED/ASSIGNED/WARRANTY/DEFECTIVE/RETURNED/INSPECTING/SCRAPPED/WARRANTY_REPLACED |
| 15 | Warranty activation / lookup | dealer `warranty_activation_screen.dart`,`warranty_hub_screen.dart`; main-fe `/warranty-check` | `controller/WarrantyActivationController.java`, `DealerWarrantyManagementService` | `entity/WarrantyRegistration.java`, `WarrantyStatus` (ACTIVE/EXPIRED/VOID) |
| 16 | Return request / RMA | dealer `returns_screen.dart`,`return_create_screen.dart`; admin `ReturnsPageRevamp.tsx`,`ReturnDetailPage.tsx` | `service/ReturnRequestService.java`, `AdminRmaService`, `service/returns/ReturnRequestPolicy` | `entity/ReturnRequest.java`, `ReturnRequestItem`, `ReturnRequestAttachment`, `ReturnRequestEvent`, `ReturnRequestStatus` (V31-V38) |
| 17 | Support tickets | dealer `support_screen.dart`; admin `SupportTicketsPageRevamp.tsx` | `service/DealerSupportTicketService.java`, `service/support/SupportTicketPayloadSupport` | `entity/DealerSupportTicket.java`, `SupportTicketMessage`, `SupportTicketMessageAttachment`, `DealerSupportTicketStatus` (V25,V29,V35) |
| 18 | Notifications / WebSocket / FCM push | dealer `notifications_screen.dart`,`push_messaging_controller.dart`; admin `NotificationsPageRevamp.tsx` | `service/NotificationService.java`, `WebSocketEventPublisher`, `PushNotificationDispatchService` | `entity/Notify.java`, `PushDeviceToken`, `NotifyType` (V12,V14) |
| 19 | Dashboard / reports / export | admin `DashboardPageRevamp.tsx`,`ReportsPageRevamp.tsx` | `service/AdminReportingService.java`, `AdminReportExportApiContractTests` | aggregate reads; CSV/XLSX export |
| 20 | Media library | admin `MediaLibraryPage.tsx` | `controller/MediaController.java`,`AdminMediaController.java`,`UploadController.java`, `MediaAssetService`, `MediaFileValidationService`, `MediaSignedUrlService` | `entity/MediaAsset.java`, `MediaCategory`, `MediaStatus`, `StorageProvider` (V35,V36) |
| 21 | Blog CMS | admin `BlogsPageRevamp.tsx`,`BlogDetailPageRevamp.tsx`; main-fe `/blogs/[id]` | `controller/PublicBlogController.java`, `service/PublicBlogService`, `BlogPublishJob` | `entity/Blog.java`, `CategoryBlog`, `BlogStatus` (V18 scheduled_at) |
| 22 | Public content entries (limited CMS) | admin `PublicContentPage.tsx`; main-fe static pages | `controller/PublicContentController.java`, `PublicContentService` | `entity/PublicContentEntry.java` (V28) |
| 23 | Settings | admin `SettingsPage.tsx` | `service/AdminSettingsService.java` | `entity/AdminSettings.java` (V11,V21 vat_percent) |
| 24 | Admin users / staff | admin `UsersPageRevamp.tsx`,`ProfilePage.tsx`,`ChangePasswordPage.tsx` | `AdminManagementService.java`, `AdminStaffUserContractTests` | `entity/Admin.java`, `StaffUserStatus` (V13,V22 email verification) |
| 25 | Audit logs | admin `AuditLogsPage.tsx` | `service/AuditLogService.java`, `AdminAuditLoggingAspectTests` | `entity/AuditLog.java` (V2; actor/action/entityType/entityId/ip/payload jsonb) |
| 26 | Public site (catalog/blog/search/locator/warranty) | main-fe routes | `PublicController.java`,`PublicApiService`,`PublicBlogController` | dealer locator uses real dealer data |
| 27 | Scheduled jobs | — | `PendingOrderTimeoutJob`,`BlogPublishJob`,`InventoryAlertSweepJob`,`PaymentReconciliationJob`,`MediaAssetCleanupJob` | — |
| 28 | Idempotency | — | `service/IdempotencyStore.java`, `IdempotencyStoreTests` | `Order.idempotencyKey` (V24 dealer-scoped) |

**Modules 4thitek does NOT have:** menu manager, slider/banner manager, home-video manager, redirect manager, contact/lead inbox (persisted), granular roles/permissions table, dealer credit limit / debt ledger, shipping carrier+tracking fields, coupons, wishlist, POS, customer accounts.

---

## 5. BigBike → 4thitek Applicability Matrix

Applicability enum: `APPLY_DIRECTLY` / `APPLY_WITH_ADAPTATION` / `DO_NOT_APPLY` / `ALREADY_EXISTS_OK` / `ALREADY_EXISTS_NEEDS_FIX` / `MISSING_HIGH_PRIORITY` / `MISSING_LOW_PRIORITY`.

| BigBike module | 4thitek equivalent / status | Applicability | Priority | Required adaptation | Risk if copied as-is |
|---|---|---|---|---|---|
| Customer auth (B2C) | Removed (`V3__remove_customer_accounts.sql`) | DO_NOT_APPLY | — | None — end-customers are not accounts | Re-introduces an actor 4thitek deliberately removed |
| Admin auth | `AuthController` + refresh sessions | ALREADY_EXISTS_OK | — | — | — |
| Dealer auth | `AuthController`, `DealerAuthClient` | ALREADY_EXISTS_OK | — | — | — |
| Product catalog | `Product` (jsonb media) + admin CRUD | ALREADY_EXISTS_OK | P2 | Optional: BigBike's normalized media tables vs 4thitek jsonb — keep jsonb | Normalized schema migration is costly and unneeded |
| Categories / brands | `CategoryBlog` exists for blog; product category — NEEDS_CONFIRMATION | ALREADY_EXISTS_NEEDS_FIX | P2 | Confirm whether products need category/brand taxonomy | SCS intercom line is small; full brand/category tree may be over-engineering |
| Product media / gallery / spec / video | `Product` jsonb `image/descriptions/videos/specifications` | ALREADY_EXISTS_OK | — | — | — |
| Product attributes / variants | No variant model in 4thitek | DO_NOT_APPLY (unless SCS has variants) | P3 | NEEDS_CONFIRMATION: do intercom SKUs have variants? | Adds complexity if SKUs are flat |
| Cart | `DealerCartItem` | ALREADY_EXISTS_OK | — | Dealer-scoped, not guest | — |
| Checkout | `DealerController` order submit + idempotency | ALREADY_EXISTS_OK | — | Bank-transfer only, dealer-scoped | Guest/retail checkout breaks actor model |
| Public order lookup | None | DO_NOT_APPLY | — | — | Exposes dealer pricing/financials publicly |
| Admin order management | `AdminOperationsService` + `OrderStatusTransitionPolicy` | ALREADY_EXISTS_NEEDS_FIX | P1 | See §9 — state machine is thin (5 states) | — |
| Customer account B2C | Removed | DO_NOT_APPLY | — | Dealer profile is the equivalent | — |
| Wishlist | None | DO_NOT_APPLY | — | — | B2C convenience irrelevant to dealers |
| Reviews (UGC) | None | DO_NOT_APPLY (use editorial trust content) | P3 | Convert to editorial/SEO "testimonial" content blocks | UGC moderation burden; not B2B-relevant |
| Coupons / promotions | `BulkDiscount` wholesale tiers | ALREADY_EXISTS_OK (B2B equivalent) | — | — | Retail coupon mechanic wrong for distributor pricing |
| POS | None | DO_NOT_APPLY | — | — | Distributor has no retail counter |
| Inventory (stock movement) | `ProductSerial` + serial-based inventory | ALREADY_EXISTS_OK | P2 | BigBike `StockMovement` audit pattern could enrich 4thitek serial history | — |
| Serial management | Full `ProductSerial` lifecycle (9 states) | ALREADY_EXISTS_OK | — | 4thitek's is arguably richer than BigBike's | — |
| Warranty | `WarrantyRegistration` + activation + public lookup | ALREADY_EXISTS_OK | — | — | — |
| Returns / RMA | First-class `ReturnRequest` aggregate (V31-V38) | ALREADY_EXISTS_OK | — | 4thitek's return model is more mature than BigBike's | B2C refund-transaction model would conflict |
| Accounts receivable / credit | None — `V41` dropped credit limit | MISSING — see note | P1 | NEEDS_CONFIRMATION: does business want dealer công nợ? Build fresh, do NOT copy `ReceivableEntity` (customer-AR) | Customer-AR semantics ≠ dealer credit |
| Payment / SePay | `SepayService` + webhook + reconciliation | ALREADY_EXISTS_OK | — | — | — |
| Refund transactions | `FinancialSettlement` (cancellation refund) | ALREADY_EXISTS_OK | — | — | B2C `RefundTransactionEntity` adds payment-gateway refund concepts not present |
| Shipping config (zones/methods) | None; `Order` has only `shipping_fee` | APPLY_WITH_ADAPTATION | P1 | Distributor likely ships nationwide flat — needs carrier + tracking-code fields, not full zone matrix | Full zone/method matrix is over-engineering for one distributor |
| Reports / analytics | `AdminReportingService` + export | ALREADY_EXISTS_OK | P2 | BigBike report-index/permission pattern is a maturity reference | — |
| Dashboard | `DashboardPageRevamp` + `AdminDashboardSupport` | ALREADY_EXISTS_OK | — | — | — |
| Content CMS (articles/pages) | `Blog` + `PublicContentEntry` | ALREADY_EXISTS_NEEDS_FIX | P2 | `PublicContentEntry` is limited; BigBike `Page`+hero pattern is richer for SEO pages | — |
| Media library | `MediaAsset` + signed URLs + validation | ALREADY_EXISTS_OK | — | 4thitek's signed-URL + validation is solid | — |
| Menu manager | None | MISSING_LOW_PRIORITY → APPLY_WITH_ADAPTATION | P2 | Adopt BigBike system-slot pattern (`primary/footer`), no arbitrary slots | — |
| Slider / banner | None | MISSING_LOW_PRIORITY → APPLY_WITH_ADAPTATION | P2 | Adopt `SliderEntity` pattern for main-fe homepage | — |
| Home video | None | MISSING_LOW_PRIORITY | P3 | Optional — only if marketing needs it | — |
| Redirect / SEO migration | Hardcoded Next.js redirects only | MISSING_HIGH_PRIORITY (for SEO site) → APPLY_WITH_ADAPTATION | P1 | Adopt `RedirectEntity` + admin manager; WordPress importer only if migrating a legacy site | — |
| Contact inbox | main-fe contact page; persistence NEEDS_CONFIRMATION | ALREADY_EXISTS_NEEDS_FIX or MISSING | P2 | Adopt `ContactMessageEntity` + status workflow as lead inbox | — |
| Notifications / WebSocket | `NotificationService` + WS + FCM push | ALREADY_EXISTS_OK | — | 4thitek's push is richer (FCM) | — |
| Settings | `AdminSettings` | ALREADY_EXISTS_OK | — | — | — |
| Admin users / staff | `Admin` + `StaffUserStatus` | ALREADY_EXISTS_OK | — | — | — |
| Roles / permissions | `Role` table (name only) + 3 coarse authorities | ALREADY_EXISTS_NEEDS_FIX | P0 | Adopt BigBike `roles`/`permissions` + `*.read`/`*.write` granular model | Coarse roles = audit/segregation-of-duty gap |
| Audit logs | `AuditLog` + AOP aspect | ALREADY_EXISTS_OK | P2 | See §11 — confirm sensitive-action coverage | — |
| VN address lookup | dealer profile uses ward/district/city strings | APPLY_WITH_ADAPTATION | P3 | Optional structured lookup | — |
| WordPress migration | None | APPLY_WITH_ADAPTATION | P2 | Only if 4thitek.vn migrates from a legacy site — NEEDS_CONFIRMATION | Running an importer with no legacy source is wasted effort |

---

## 6. High Priority Modules 4thitek Should Adopt

### 6.1 Granular Roles & Permissions — P0 — `ALREADY_EXISTS_NEEDS_FIX`

- **Current status.** `entity/Role.java` holds only `name` + `description` + an `accounts` relation. `config/SecurityConfig.java` enforces just three authorities: `SUPER_ADMIN`, `ADMIN`, `DEALER`. Endpoint protection is URL-prefix based (`/api/v1/admin/**` → `ADMIN`/`SUPER_ADMIN`; a few hardcoded `SUPER_ADMIN`-only paths). There is no permission table and no per-resource authority.
- **Why needed.** A distributor has distinct internal staff: sales (order approval), warehouse (serial/inventory), accountant (payment confirmation / settlement), content/SEO editor. Today they all collapse into `ADMIN` and can call every admin endpoint. This is a segregation-of-duties and audit weakness for exactly the sensitive actions listed in §11.
- **Recommended design.** Adopt BigBike's pattern (`docs` `PERMISSION_MATRIX.md`; entities behind V49/V81): `permissions` table (`code` like `orders.approve`, `serials.write`, `payments.confirm`, `products.publish`, `users.manage`), `role_permissions` join, and resolve granted permissions into JWT authorities. Migrate URL-prefix rules toward `@PreAuthorize("hasAuthority('orders.approve')")` on controller methods. Keep `SUPER_ADMIN` as an implicit-all role.
- **Files impacted.** New migration `V42__create_permissions_tables.sql`; `entity/Role.java`, new `Permission` entity; `security/` JWT authority resolution; `config/SecurityConfig.java`; `service/AdminManagementService.java`; admin-fe `UsersPageRevamp.tsx` + a new Roles page; `adminApi.ts`.
- **NEEDS_CONFIRMATION.** Exact role catalog and which permissions each internal job needs — this is a business org-chart decision, not derivable from code.

### 6.2 Redirect Manager — P1 — `MISSING_HIGH_PRIORITY` → `APPLY_WITH_ADAPTATION`

- **Current status.** main-fe is explicitly an SEO-first site (`README.md`, `src/lib/seo.ts`, `sitemap.ts`, `robots.ts`). Redirects are hardcoded in Next.js config (`/warranty_check`, `/home` per `CHANGELOG.md`). No DB-backed, admin-editable redirect table.
- **Why needed.** SEO operations need to add 301s without a redeploy when URLs change, products are renamed, or legacy paths must be preserved.
- **Recommended design.** Adopt BigBike `RedirectEntity` + `AdminRedirectController` + `InternalRedirectController` pattern: a `redirects` table (`source`, `target`, `type`, `active`, unique source), an admin CRUD page, and a main-fe lookup in middleware. Skip BigBike's WordPress importer unless a legacy site migration is confirmed.
- **Files impacted.** New `entity/Redirect.java` + repo + migration; a public/internal redirect endpoint; main-fe `middleware.ts`; admin-fe new Redirects page + `adminApi.ts`.
- **NEEDS_CONFIRMATION.** Whether 4thitek.vn is replacing an existing legacy/WordPress site (decides if a bulk importer is worth building).

### 6.3 Shipping Carrier + Tracking Fields — P1 — `APPLY_WITH_ADAPTATION`

- **Current status.** `entity/Order.java` has `shipping_fee`, `receiver_name/address/phone`, and an order status `SHIPPING`, but **no carrier name and no tracking code**. Dealers cannot see where a shipment is.
- **Why needed.** `BUSINESS_LOGIC.md` §0 implies dealer transparency; a dealer ordering stock needs a tracking number.
- **Recommended design.** Do **not** adopt BigBike's full `ShippingZoneEntity`/`ShippingMethodEntity` matrix — a single distributor shipping nationwide does not need a zone/method engine. Instead add `carrier`, `tracking_code`, `shipped_at`, `delivered_at` columns to `Order` (or a small `order_shipment` table), an admin action to set them on `CONFIRMED → SHIPPING`, and expose them in the dealer order detail.
- **Files impacted.** New migration; `entity/Order.java`; `AdminOperationsService.java`; dealer `order_detail_screen.dart`; admin `OrderDetailPage.tsx`.
- **NEEDS_CONFIRMATION.** Whether the business wants GHN/GHTK/ViettelPost API integration now, or manual tracking-code entry first (recommend manual first).

### 6.4 Dealer Credit / Debt (công nợ) — P1 — `MISSING` (build fresh, do not copy)

- **Current status.** `V41__drop_dealers_credit_limit.sql` removed the credit limit. `FinancialSettlement` covers only `CANCELLATION_REFUND` and `STALE_ORDER_REVIEW` — it is **not** a receivables ledger. New orders are `BANK_TRANSFER` only and start `PENDING`/`PENDING` (`BUSINESS_LOGIC.md` §0.1).
- **Why it may be needed.** Distributors commonly let trusted dealers order on credit. Today 4thitek has no mechanism.
- **Recommended design (if business wants it).** Build a dedicated dealer-credit module: `dealer_credit` (limit, used, available per dealer) + a debt ledger keyed to orders. **Do not** copy BigBike `ReceivableEntity` — it models *customer* AR from POS credit sales, with different semantics. Business rule to encode: debt arises only when `order.status = COMPLETED` AND `paymentStatus != PAID`; never on submit; block/warn when a dealer exceeds limit or has overdue debt.
- **NEEDS_CONFIRMATION (business decision).** Whether 4thitek's business model allows dealer credit at all. Until confirmed, this stays a proposal — `V41` shows the team already considered and removed it once.

### 6.5 Menu / Slider / Hero CMS for main-fe — P2 — `APPLY_WITH_ADAPTATION`

- **Current status.** `PublicContentEntry` (V28) gives a limited content store; main-fe pages (`/about`, `/certification`, `/policy`, `/home`) appear largely static-componentized. No menu manager, no slider/banner, no home-video.
- **Why needed.** For an SEO/brand-trust site, marketing needs to change homepage banners and nav without a deploy.
- **Recommended design.** Adopt BigBike's *system-slot* menu pattern (fixed slots `primary`/`footer`, admin edits items only — never arbitrary slots) and a `Slider` entity for the homepage. Home-video is optional (P3).
- **Files impacted.** New entities/migrations; admin pages; main-fe `home/components/`.

---

## 7. Modules 4thitek Must Not Copy Directly

| BigBike module | Why not | Correct B2B alternative for 4thitek |
|---|---|---|
| **Guest checkout** (`CheckoutController`) | 4thitek orders are dealer-scoped with per-dealer idempotency (`V24`) and `BANK_TRANSFER`-only (`BUSINESS_LOGIC.md` §0.1, §2.3). A guest has no dealer identity, pricing tier, or approval path. | Keep the existing authenticated dealer checkout via `DealerController`. |
| **Customer account B2C** (`CustomerEntity`, `CustomerAuthController`, customer sessions) | 4thitek deliberately removed customer accounts (`V3__remove_customer_accounts.sql`, `V16`). End-customers appear only in warranty lookup / public content. | Dealer profile + public (no-account) warranty lookup. |
| **Wishlist** (`WishlistItemEntity`) | A retail shopper convenience. Dealers reorder known SKUs. | None needed; dealer order history covers reorder. |
| **POS retail** (`AdminPosController`, `PosOrderService`, CASH/CARD_TERMINAL) | A distributor has no over-the-counter retail sale; payment is bank transfer. | None — explicitly out of model. |
| **Public order lookup** (`OrderLookupController`) | B2B orders carry wholesale pricing, discount tier labels, VAT and financial snapshots (`Order` fields `applied_discount_rule_label`, `vat_amount`, `total_amount`). Public exposure leaks commercial terms. | Order visibility stays inside the authenticated dealer portal only. |
| **Coupons / coupon-gift** (`CouponEntity`, `AdminCouponGiftController`) | Retail promo mechanic with per-customer email campaigns. | `BulkDiscount` wholesale tiers already in place — the correct B2B pricing lever. |
| **User-generated reviews** (`ReviewEntity`, `PublicReviewController`) | B2C UGC with moderation overhead; dealers/distributors don't post star reviews. | Editorial "trust"/testimonial content blocks in the CMS, curated by admin — not user-submitted. |
| **B2C refund transactions** (`RefundTransactionEntity`, `PaymentEventEntity` refund path) | Models payment-gateway refunds for retail orders. | 4thitek's `ReturnRequest` aggregate + `FinancialSettlement` (`CANCELLATION_REFUND`) already handle this in B2B terms. |
| **`ReceivableEntity`** (customer accounts receivable) | Tied to POS credit *customer* sales; semantics differ from dealer credit. | If dealer credit is wanted, build a fresh dealer-credit module (§6.4). |
| **Full shipping zone/method matrix** (`ShippingZoneEntity`, `ShippingMethodEntity`) | Designed for retail multi-zone delivery pricing. | Flat carrier + tracking-code fields on the order (§6.3). |
| **Product variants / attributes** (`ProductVariantEntity`, `AttributeEntity`) | Retail apparel-style variant matrix. | Confirm SCS intercom SKUs are flat; if so, keep the flat `Product` model. NEEDS_CONFIRMATION. |
| **WordPress migration importer** (`migration/wordpress/**`) | Only meaningful when migrating an actual legacy WordPress site. | Adopt only if a 4thitek.vn legacy-site migration is confirmed. |

---

## 8. Existing 4thitek Modules That Need Refactor

| Module | Problem | Evidence | Impact | Recommended fix | Flag |
|---|---|---|---|---|---|
| Roles / permissions | Only role *name*; no permission granularity; all admin staff = `ADMIN` | `entity/Role.java`, `config/SecurityConfig.java` (3 authorities) | Segregation-of-duties + audit gap | §6.1 — add `permissions` table + method-level authorization | NEEDS_CONFIRMATION (role catalog) |
| Order state machine | Only 5 states (`PENDING/CONFIRMED/SHIPPING/COMPLETED/CANCELLED`); no explicit `PENDING_APPROVAL`, `PROCESSING`, `READY_TO_SHIP`, `CANCEL_REQUESTED`/`CANCEL_REJECTED` | `entity/enums/OrderStatus.java`, `OrderStatusTransitionPolicy.java` | Dealer cancel is a direct `PENDING/CONFIRMED → CANCELLED`; there is no "cancel request → admin reject" path | Decide whether the richer state machine in §9 is wanted; if yes, extend enum + policy | NEEDS_CONFIRMATION (changes state machine) |
| Shipping visibility | `Order` has no carrier/tracking code; `SHIPPING` status carries no detail | `entity/Order.java` fields | Dealers can't track shipments | §6.3 — add carrier/tracking fields | NEEDS_CONFIRMATION (adds data contract) |
| Public content CMS | `PublicContentEntry` is a limited single-table store; no hero/menu/slider | `entity/PublicContentEntry.java` (V28), main-fe static pages | Marketing changes need redeploys | §6.5 — adopt menu-slot + slider pattern | recommended |
| Contact / lead capture | main-fe `/contact` page exists; backend persistence not traced to an entity | `main-fe/src/app/contact/`, no `ContactMessage` entity found | Inbound dealer/partner leads may not be captured/tracked | Confirm current behavior; if missing, add a lead-inbox entity (§6.6 / BigBike `ContactMessageEntity` pattern) | NEEDS_CONFIRMATION |
| Product taxonomy | `CategoryBlog` exists for blogs; no product category/brand entity found | `entity/CategoryBlog.java`; no `ProductCategory` entity | Product browsing/SEO faceting may be limited | Confirm whether product category/brand filtering is needed for the SEO catalog | NEEDS_CONFIRMATION |

> Per audit principle: none of the above were changed. All are recommendations; every item that touches a state machine, data contract, or permission model is marked `NEEDS_CONFIRMATION`.

---

## 9. Business Rule Alignment

### 9.1 Dealer order

- **Current.** `OrderStatus = PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED`. `OrderStatusTransitionPolicy` defines two transition maps: admin (`PENDING→CONFIRMED/CANCELLED`, `CONFIRMED→SHIPPING/CANCELLED`, `SHIPPING→COMPLETED`) and dealer (`PENDING/CONFIRMED→CANCELLED` only). Order starts `PENDING`/`paymentStatus=PENDING` (`BUSINESS_LOGIC.md` §0.1).
- **Assessment.** Functionally coherent and enforced (`OrderWorkflowLogicTests`, `OrderStatusSerialContractTests`). It is *thinner* than the state machine proposed in the audit brief.
- **Proposed richer state machine (NEEDS_CONFIRMATION — business + state-machine change).** If finer operational tracking is wanted: `DRAFT_CART → SUBMITTED → PENDING_APPROVAL → APPROVED(=CONFIRMED) → PROCESSING → READY_TO_SHIP → SHIPPED(=SHIPPING) → COMPLETED`, plus `CANCEL_REQUESTED → CANCEL_REJECTED/CANCELLED`. Current model folds SUBMITTED+PENDING_APPROVAL into `PENDING` and lets dealers cancel directly with no admin reject step. **Recommendation:** keep the current 5-state model unless operations explicitly need the granularity — adding states is a contract change touching dealer app, admin, tests.

### 9.2 Payment / SePay

- **Webhook auth.** `SepayWebhookController` accepts a token via `?token=`, `X-Webhook-Token`, or `Authorization: Apikey <token>`; `SepayService.validateWebhookToken` checks it against `adminSettingsService.getSepaySettings().webhookToken()`. This is a **shared static token, not an HMAC signature**. SePay only issues an API key, so this is acceptable — but the endpoint is `permitAll` in `SecurityConfig`, so token validation is the only gate. ✅ acceptable; document it.
- **Idempotency.** ✅ Present and layered: `paymentRepository.existsByTransactionCodeIgnoreCase(...)` pre-check **plus** a DB unique-constraint catch (`DataIntegrityViolationException` → `duplicate_transaction`). `V47__add_unique_payment_transaction_id_sepay` enforces it.
- **Transaction → order mapping.** `extractOrderCode` parses order code from `code`/`content`/`transferContent`/`description`/`referenceCode`; unmatched payments land in `UnmatchedPayment` (good — no blind matching). `BUSINESS_LOGIC.md` §5.1 mandates exact-match reconciliation.
- **Payment status update.** `PaymentStatus = PENDING/PAID/FAILED/CANCELLED`; `FAILED` is legacy-only. Order `paymentStatus` advances only via confirmed bank transfer / reconciliation.
- **Verdict:** SePay flow is sound. No fix needed. Only recommendation: add a short doc note in `docs/SEPAY_WEBHOOK.md` clarifying token-vs-signature.

### 9.3 Debt / receivables

- **Current.** No dealer debt ledger; no credit limit (`V41` dropped it). `FinancialSettlement` ≠ receivables.
- **Verdict:** This is a genuine *gap*, not a defect. If the business wants dealer công nợ, build fresh per §6.4. The proposed rule — debt arises only at `COMPLETED` + `paymentStatus != PAID`, never at submit — is sound and should be the design baseline. `NEEDS_CONFIRMATION` (business model decision).

### 9.4 Serial ownership

- **Current.** `ProductSerialStatus = AVAILABLE, RESERVED, ASSIGNED, WARRANTY, DEFECTIVE, RETURNED, INSPECTING, SCRAPPED, WARRANTY_REPLACED`. `Dealer` owns `productSerials`. `V8` renamed `SOLD→ASSIGNED`; `V9` cleared dealer for assigned serials; `V15` repaired serial-ownership/stock consistency.
- **Assessment.** Maps cleanly to the audit's proposed lifecycle: `IN_DISTRIBUTOR_STOCK=AVAILABLE`, `RESERVED_FOR_ORDER=RESERVED`, `SOLD_TO_DEALER=ASSIGNED`, `WARRANTY_ACTIVATED=WARRANTY`, `RETURNED`, `VOIDED=SCRAPPED`. 4thitek's model is **richer** than BigBike's. Reserve-on-approve / assign-on-complete / restore-on-cancel are covered by `OrderInventorySupport` + `ProductSerialOrderSupport` and guarded by `AdminSerialInvariantTests`, `OrderStatusSerialContractTests`.
- **Verdict:** `ALREADY_EXISTS_OK`. Do not import BigBike serial logic.

### 9.5 Warranty

- **Current.** `WarrantyRegistration` + `WarrantyStatus (ACTIVE/EXPIRED/VOID)`; dealer activates via `WarrantyActivationController` (POST gated to `DEALER` authority); public lookup at `/api/v1/warranty/check/**` (permitAll). `DealerSerialWarrantyGuardTests` guards transitions; dealer cannot directly set serial `RETURNED`/`DEFECTIVE` (`BUSINESS_LOGIC.md` §0.5).
- **Verdict:** `ALREADY_EXISTS_OK`. Audit trail via `WarrantyStatusSupport` + `AuditLog`.

### 9.6 Cancel / Return / RMA

- **Current.** `ReturnRequest` is the aggregate root (`BUSINESS_LOGIC.md` §5.4); `ReturnRequestStatus = SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AWAITING_RECEIPT, RECEIVED, INSPECTING, PARTIALLY_RESOLVED, COMPLETED, CANCELLED`. Admin RMA (`START_INSPECTION/PASS_QC/SCRAP`) are inspection artifacts, not the lifecycle. Duplicate active returns rejected. Dealer-side direct serial mutation blocked.
- **Verdict:** `ALREADY_EXISTS_OK` and notably more mature than BigBike's return model. Do not copy BigBike returns.

### 9.7 Shipping

- **Current.** Only `Order.status = SHIPPING` + `shipping_fee`. No carrier/tracking. See §6.3 — recommend adding fields, not a zone engine.

---

## 10. API / Data Contract Risks

| Area | Observation | Evidence | Flag |
|---|---|---|---|
| Product media shape | 4thitek `Product` stores `image`, `descriptions`, `videos`, `specifications` as **jsonb** (`Map`/`List<Map>`). Any contract drift between admin-fe editor output and main-fe / dealer-app readers is schema-free and unenforced by the DB. | `entity/Product.java` lines 49–61 | NEEDS_CONFIRMATION — verify admin-fe writes and main-fe (`src/types/api.ts`) + dealer (`models.dart`) read the same jsonb keys |
| Payment method enum | `PaymentMethod` accepts only `BANK_TRANSFER` and throws on anything else; `V26` normalized legacy values. Any client still sending another method will hard-fail. | `entity/enums/PaymentMethod.java` | OK — intentional; ensure dealer app never sends others |
| Order status enum | Backend 5-state enum must match admin-fe `adminLabels.ts` and dealer `orders_screen_support.dart`. Not line-diffed. | — | NEEDS_CONFIRMATION |
| Return status enum | 10 backend states must be mirrored in admin `ReturnsPageRevamp` + dealer `return_request_ui_support.dart` (`BUSINESS_LOGIC.md` §2.7 lists 7 dealer-facing indicators). | `ReturnRequestStatus.java` | NEEDS_CONFIRMATION — verify the 10→7 mapping is intentional and complete |
| Audit log payload | `AuditLog.payload` is free-form `jsonb` with no schema. | `entity/AuditLog.java` line 54 | Low risk; acceptable for an audit store |
| API docs | 4thitek has `docs/` (operational) but **no API_CONTRACT / DATA_CONTRACT** equivalent to BigBike's `docs/engineering/`. `BUSINESS_LOGIC.md` documents a "minimum active API surface" but is not a full contract. | `4thitek/docs/` listing | Gap — see §6 roadmap P2: add an API contract doc |
| BigBike-side test evidence | BigBike `MODULE_CATALOG.md` cites tests (`Phase1LReturnsApiTest`, etc.) but `bigbike-backend/src/test` is empty in the audited tree. | `find bigbike .../src/test` → 0 files | UNKNOWN — do not rely on BigBike test coverage as a reference |

---

## 11. Permission & Audit Risks

### Permission risks

- **Over-coarse roles (HIGH).** Only `SUPER_ADMIN`, `ADMIN`, `DEALER` (`SecurityConfig.java`). Every `ADMIN` staff member can call every `/api/v1/admin/**` endpoint — order approval, serial assignment, payment confirmation, settlement, product publish. No warehouse/accountant/sales/content separation. → §6.1.
- **URL-prefix authorization (MEDIUM).** Authorization is path-prefix based, not method/resource based. Adding a new admin controller automatically inherits broad `ADMIN` access unless someone remembers to special-case it — easy to under-protect a sensitive new endpoint.
- **A few good explicit guards (OK).** `/api/v1/admin/users/**`, `GET /api/v1/admin/audit-logs`, `/api/v1/admin/settings` are correctly `SUPER_ADMIN`-only.
- **No over-broad public exposure found (OK).** Public `permitAll` set is scoped to auth, content, blog, product, search, warranty check, SePay webhook, health, ws — reasonable.

### Audit risks

- **Audit infrastructure exists and is tested (OK).** `AuditLog` entity + `AuditLogService` + an AOP aspect (`AdminAuditLoggingAspectTests`), with actor/role/action/entityType/entityId/ip/payload.
- **Coverage to confirm (NEEDS_CONFIRMATION).** The brief lists sensitive actions that must be logged: order approval, price/debt adjustment, payment confirmation, serial assignment, warranty change, product publish, admin permission change. The AOP aspect likely logs all admin mutations by path, but this was not exhaustively verified per action. Recommend a focused check that each of these 7 actions produces an `AuditLog` row with a meaningful `entityType`/`entityId`.
- **Audit-log read is `SUPER_ADMIN`-only (OK, possibly too strict).** Once granular roles exist (§6.1), consider an `audit-logs.read` permission so a compliance role can read without full super-admin.

---

## 12. Recommended Roadmap

Each item: Why / Dependencies / Risk / Suggested order / Files likely affected.

### Phase 1 — Core B2B Operations hardening (P0–P1)

**1.1 Granular roles & permissions (P0)**
- *Why:* close segregation-of-duties + audit gap (§6.1, §11).
- *Dependencies:* business role catalog confirmed.
- *Risk:* touches every admin endpoint's authorization — must be staged behind tests; mis-mapping locks out staff.
- *Order:* first — everything sensitive below benefits from it.
- *Files:* `V42__create_permissions_tables.sql`, `entity/Role.java`+`Permission`, `security/*`, `SecurityConfig.java`, `AdminManagementService.java`, admin-fe Users/Roles pages.

**1.2 Shipping carrier + tracking fields (P1)**
- *Why:* dealer shipment visibility (§6.3).
- *Dependencies:* none.
- *Risk:* additive data-contract change; low if columns are nullable.
- *Order:* second.
- *Files:* migration, `entity/Order.java`, `AdminOperationsService.java`, dealer `order_detail_screen.dart`, admin `OrderDetailPage.tsx`.

**1.3 Sensitive-action audit coverage verification (P1)**
- *Why:* confirm §11 audit list is fully covered.
- *Dependencies:* 1.1 helps (actor role granularity).
- *Risk:* low — verification + targeted gap fixes.
- *Order:* third.
- *Files:* `AuditLogService.java`, AOP aspect, new tests.

**1.4 Dealer credit / debt module — DESIGN ONLY until confirmed (P1)**
- *Why:* §6.4.
- *Dependencies:* business decision (the team already dropped credit once in `V41`).
- *Risk:* high if built without a clear business rule; do not start code before sign-off.
- *Order:* design in Phase 1, build in Phase 3 if approved.

### Phase 2 — SEO / Content / Marketing (P1–P2)

**2.1 Redirect manager (P1)** — §6.2. Deps: none. Risk: low. Files: `Redirect` entity/migration, redirect endpoint, main-fe `middleware.ts`, admin Redirects page.

**2.2 API/Data contract docs (P2)** — Why: 4thitek lacks BigBike's `docs/engineering/API_CONTRACT.md`/`DATA_CONTRACT.md`; jsonb product shape is undocumented (§10). Deps: none. Risk: none (docs only). Files: new `docs/engineering/`.

**2.3 Menu / slider / hero CMS (P2)** — §6.5. Deps: 2.2 helpful. Risk: low. Files: new entities/migrations, admin pages, main-fe home components.

**2.4 Contact / lead inbox (P2)** — confirm current state first (§8); if missing, adopt BigBike `ContactMessageEntity` + status workflow. Deps: none. Risk: low.

**2.5 Editorial trust/testimonial content (P3)** — replaces B2C reviews; CMS content blocks. Deps: 2.3. Risk: low.

### Phase 3 — Scale / Automation (P2–P3)

**3.1 Reports depth + export indexes (P2)** — adopt BigBike report-index/permission pattern; deps: 1.1 (report permissions). Risk: low.
**3.2 Dealer credit/debt build (P3, if 1.4 approved)** — deps: 1.1, 1.4 design. Risk: high — financial logic.
**3.3 Carrier API integration GHN/GHTK/ViettelPost (P3)** — deps: 1.2. Risk: medium — external API. Manual tracking first.
**3.4 Advanced dashboard KPIs / aging report (P3)** — deps: 3.1, 3.2. Risk: low.
**3.5 Home video manager (P3)** — optional marketing. Risk: low.

---

## 13. Implementation Prompts

Reusable, scoped prompts for safe per-phase implementation. Each assumes the AUDIT-first, docs-first, no-silent-contract-change discipline.

**Prompt P1.1 — Granular RBAC**
> Implement granular roles & permissions in 4thitek backend. First read `config/SecurityConfig.java`, `entity/Role.java`, `entity/Account.java`, `security/`. Propose a `permissions` table + `role_permissions` join + a new Flyway migration `V42`. Resolve permissions into JWT authorities. Convert `/api/v1/admin/**` URL-prefix rules to method-level `@PreAuthorize`. Do NOT change any endpoint's effective access without listing the before/after authority for each. Provide the role→permission catalog as a proposal and STOP for confirmation before writing the migration. Add tests mirroring `AdminStaffUserContractTests`.

**Prompt P1.2 — Shipping tracking fields**
> Add `carrier`, `tracking_code`, `shipped_at`, `delivered_at` to the order. Read `entity/Order.java`, `AdminOperationsService.java`, `OrderStatusTransitionPolicy.java` first. Columns must be nullable (additive contract). Expose them read-only in the dealer order detail and editable in admin on `CONFIRMED→SHIPPING`. Update `dealer/lib/order_detail_screen.dart` and `admin-fe/src/pages/OrderDetailPage.tsx`. Add a contract test. Do not alter the order state machine.

**Prompt P1.3 — Audit coverage check**
> Verify that each of these admin actions writes an `AuditLog` row with correct `entityType`/`entityId`: order approval, payment confirmation, serial assignment, warranty change, product publish, settlement, admin permission change. Read `service/AuditLogService.java` and the audit AOP aspect. Report a coverage table; only add logging for confirmed gaps. Do not change business logic.

**Prompt P2.1 — Redirect manager**
> Add a DB-backed redirect manager. Create `Redirect` entity (`source` unique, `target`, `type` 301/302, `active`), repo, migration, an internal lookup endpoint, and a main-fe `middleware.ts` lookup. Add an admin Redirects CRUD page using existing admin-fe table components. Migrate the hardcoded Next.js redirects into seed data. No WordPress importer unless told otherwise.

**Prompt P2.2 — API/Data contract docs**
> Create `docs/engineering/API_CONTRACT.md` and `DATA_CONTRACT.md` for 4thitek. Trace every controller in `backend/.../controller/` to its route, request/response DTO, and auth. Document the `Product` jsonb sub-schemas (`image`, `descriptions`, `videos`, `specifications`) exactly as the admin-fe editor writes them. Docs only — no code changes.

**Prompt P2.3 — Menu/Slider CMS**
> Implement a system-slot menu manager (fixed slots `primary`,`footer` — admins edit items only) and a homepage `Slider` entity. Follow the existing `PublicContentEntry` and `MediaAsset` patterns. Provide migrations, public read endpoints, admin pages, and main-fe consumption. STOP for confirmation on the slot list before coding.

**Prompt P3.2 — Dealer credit/debt (only after business sign-off)**
> Design and implement a dealer-credit module: `dealer_credit` (limit/used/available) + a debt ledger keyed to orders. Business rule: debt arises only when `order.status=COMPLETED` AND `paymentStatus!=PAID`; never on submit; block/warn on over-limit or overdue. Do NOT reuse BigBike `ReceivableEntity`. Update `BUSINESS_LOGIC.md` first, then code, in one PR.

---

## 14. Final Verdict

### What to adopt first (safe, high value)

1. **Granular roles & permissions (P0)** — the single most important gap; everything sensitive depends on it.
2. **Shipping carrier/tracking fields (P1)** — small, additive, real dealer value.
3. **Redirect manager (P1)** — needed for an SEO-first public site.
4. **Audit-coverage verification (P1)** — cheap assurance over money/inventory actions.

### What NOT to adopt

- Guest checkout, customer B2C accounts, wishlist, POS retail, public order lookup, retail coupons, user-generated reviews, B2C refund-transaction model, `ReceivableEntity`, full shipping zone/method matrix, product variant matrix, and the WordPress importer (unless a legacy migration is confirmed). BigBike is a B2C system; these are its retail DNA and would corrupt 4thitek's B2B actor model.

### What needs the business owner's decision (NEEDS_CONFIRMATION)

- **Dealer credit / debt (công nợ)** — the team already dropped credit limit once (`V41`); building it back is a business-model decision.
- **Richer order state machine** — whether the operational granularity (`PENDING_APPROVAL`, `READY_TO_SHIP`, `CANCEL_REQUESTED`…) is worth the contract change across backend + dealer app + admin.
- **The internal role catalog** — exact roles (sales/warehouse/accountant/content) and their permissions.
- **Whether 4thitek.vn migrates from a legacy/WordPress site** — decides if a redirect bulk-importer is worth building.
- **Whether SCS intercom SKUs have variants** and whether products need a category/brand taxonomy.
- **Whether the main-fe contact form persists leads today** — confirm before building a lead inbox.

### What can be implemented immediately (no business decision needed)

- API/Data contract documentation (`docs/engineering/`).
- Shipping carrier/tracking fields (additive, nullable).
- Redirect manager (pure addition).
- Audit-coverage verification.
- Menu/slider CMS scaffolding (slot list aside).

### Bottom line

4thitek is a healthy, fairly mature B2B platform — it does **not** need a BigBike module transplant. Use BigBike strictly as a *reference catalog* of operational-maturity features. The real, confirmed work is: **fix the permission model**, **add shipping visibility**, **add a redirect manager**, and **document the contracts**. Everything financial (dealer credit) and every state-machine change must wait for explicit business sign-off. No business code was changed in this audit.

---

*End of report. Generated 2026-05-17 by static source audit of `S:\project\4thitek` and `S:\project\bigbike`.*
