# TĂ i liá»‡u Logic Nghiá»‡p Vá»¥ â€” Há»‡ thá»‘ng 4thitek

> PhiĂªn báº£n: 2026-03-22
> Pháº¡m vi: Backend (Spring Boot) Â· Dealer App (Flutter) Â· Admin Dashboard (React) Â· Main Website (Next.js)

---

## Má»¥c lá»¥c

0. [Quy Æ°á»›c Nguá»“n Sá»± Tháº­t](#0-quy-Æ°á»›c-nguá»“n-sá»±-tháº­t)
1. [Tá»•ng quan há»‡ thá»‘ng](#1-tá»•ng-quan-há»‡-thá»‘ng)
2. [Danh sĂ¡ch chá»©c nÄƒng](#2-danh-sĂ¡ch-chá»©c-nÄƒng)
3. [Logic nghiá»‡p vá»¥ chi tiáº¿t](#3-logic-nghiá»‡p-vá»¥-chi-tiáº¿t)
   - [3.1 XĂ¡c thá»±c & phĂ¢n quyá»n](#31-xĂ¡c-thá»±c--phĂ¢n-quyá»n)
   - [3.2 Sáº£n pháº©m & danh má»¥c](#32-sáº£n-pháº©m--danh-má»¥c)
   - [3.3 Giá» hĂ ng & Chiáº¿t kháº¥u](#33-giá»-hĂ ng--chiáº¿t-kháº¥u)
   - [3.4 Äáº·t hĂ ng & Thanh toĂ¡n](#34-Ä‘áº·t-hĂ ng--thanh-toĂ¡n)
   - [3.5 Theo dĂµi cĂ´ng ná»£](#35-theo-dĂµi-cĂ´ng-ná»£)
   - [3.6 Kho hĂ ng & Serial](#36-kho-hĂ ng--serial)
   - [3.7 Báº£o hĂ nh](#37-báº£o-hĂ nh)
   - [3.8 Xuáº¥t hĂ ng theo serial](#38-xuáº¥t-hĂ ng-theo-serial)
   - [3.9 Dashboard bĂ¡o cĂ¡o](#39-dashboard-bĂ¡o-cĂ¡o)
   - [3.10 ThĂ´ng bĂ¡o](#310-thĂ´ng-bĂ¡o)
   - [3.11 Há»— trá»£ (Support Ticket)](#311-há»—-trá»£-support-ticket)
   - [3.12 CĂ i Ä‘áº·t á»©ng dá»¥ng](#312-cĂ i-Ä‘áº·t-á»©ng-dá»¥ng)
   - [3.13 Dealer Profile & TĂ i khoáº£n](#313-dealer-profile--tĂ i-khoáº£n)
   - [3.14 Quáº£n lĂ½ Admin & Staff](#314-quáº£n-lĂ½-admin--staff)
   - [3.15 Quáº£n lĂ½ Äáº¡i lĂ½ (Admin)](#315-quáº£n-lĂ½-Ä‘áº¡i-lĂ½-admin)
   - [3.16 Blog & Ná»™i dung tÄ©nh](#316-blog--ná»™i-dung-tÄ©nh)
   - [3.17 Public Website API](#317-public-website-api)
   - [3.18 Dashboard & CĂ i Ä‘áº·t há»‡ thá»‘ng (Admin)](#318-dashboard--cĂ i-Ä‘áº·t-há»‡-thá»‘ng-admin)
   - [3.19 Xuáº¥t bĂ¡o cĂ¡o (Admin)](#319-xuáº¥t-bĂ¡o-cĂ¡o-admin)
   - [3.20 Upload & LÆ°u trá»¯ File](#320-upload--lÆ°u-trá»¯-file)
   - [3.21 Rate Limiting](#321-rate-limiting)
4. [User Flow](#4-user-flow)
5. [Edge Cases](#5-edge-cases)
6. [So sĂ¡nh ná»n táº£ng](#6-so-sĂ¡nh-ná»n-táº£ng)
7. [Giáº£ Ä‘á»‹nh Chuáº©n & Pending Decisions](#7-giáº£-Ä‘á»‹nh-chuáº©n--pending-decisions)

---

## 0. Quy Æ°á»›c Nguá»“n Sá»± Tháº­t

TĂ i liá»‡u nĂ y lĂ  **business source of truth** cho há»‡ thá»‘ng 4thitek ká»ƒ tá»« phiĂªn báº£n `2026-03-22`, nhÆ°ng chá»‰ Ä‘á»‘i vá»›i cĂ¡c rule Ä‘Æ°á»£c gáº¯n nhĂ£n rĂµ rĂ ng bĂªn dÆ°á»›i.

### 0.1 NhĂ£n tráº¡ng thĂ¡i

| NhĂ£n | Ă nghÄ©a | CĂ¡ch sá»­ dá»¥ng |
|---|---|---|
| `[Implemented]` | ÄĂ£ pháº£n Ă¡nh Ä‘Ăºng behavior hiá»‡n Ä‘ang cháº¡y trong code | Backend, frontend, QA vĂ  tĂ i liá»‡u phá»¥ pháº£i bĂ¡m theo |
| `[Policy]` | Quy Ä‘á»‹nh nghiá»‡p vá»¥/cĂ´ng ty báº¯t buá»™c Ă¡p dá»¥ng trĂªn toĂ n há»‡ thá»‘ng | Náº¿u code lá»‡ch policy, pháº£i sá»­a code hoáº·c cĂ³ quyáº¿t Ä‘á»‹nh thay Ä‘á»•i policy |
| `[Pending Decision]` | Váº¥n Ä‘á» chÆ°a chá»‘t hoáº·c target state chÆ°a implement | KhĂ´ng Ä‘Æ°á»£c xem lĂ  contract production hiá»‡n hĂ nh |

### 0.2 Thá»© tá»± Æ°u tiĂªn khi Ä‘á»c tĂ i liá»‡u

1. Rule cĂ³ nhĂ£n `[Implemented]` lĂ  contract runtime hiá»‡n hĂ nh.
2. Rule cĂ³ nhĂ£n `[Policy]` lĂ  rĂ ng buá»™c báº¯t buá»™c cho toĂ n há»‡ thá»‘ng.
3. Rule cĂ³ nhĂ£n `[Pending Decision]` chá»‰ lĂ  backlog/Ä‘á»‹nh hÆ°á»›ng, **chÆ°a** pháº£i logic production.

### 0.3 Pháº¡m vi hiá»‡n Ä‘Ă£ Ä‘á»§ cháº·t Ä‘á»ƒ lĂ m source of truth

- Auth, phĂ¢n quyá»n, dealer lifecycle
- Order lifecycle, serial lifecycle, warranty lifecycle
- Support ticket workflow
- Upload private/public access
- Report export contract
- Rate limiting hiá»‡n táº¡i
- VAT 10% vĂ  `shippingFee = 0` theo policy cĂ´ng ty

### 0.4 Pháº¡m vi chÆ°a pháº£i source of truth tuyá»‡t Ä‘á»‘i

- Debt payment verification workflow nhiá»u bÆ°á»›c
- Quan há»‡ Ä‘áº§y Ä‘á»§ giá»¯a `paymentStatus` vĂ  `order.status`
- RMA / reset serial tá»« `DEFECTIVE` hoáº·c `RETURNED`
- Support SLA
- SePay partial / over payment

> NguyĂªn táº¯c thay Ä‘á»•i: má»i thay Ä‘á»•i behavior á»Ÿ cĂ¡c vĂ¹ng `[Implemented]` hoáº·c `[Policy]` pháº£i cáº­p nháº­t file nĂ y cĂ¹ng lĂºc vá»›i code trong cĂ¹ng má»™t batch thay Ä‘á»•i.

---

## 1. Tá»•ng quan há»‡ thá»‘ng

Há»‡ thá»‘ng quáº£n lĂ½ phĂ¢n phá»‘i sáº£n pháº©m B2B: Ä‘áº¡i lĂ½ Ä‘áº·t hĂ ng, theo dĂµi cĂ´ng ná»£, quáº£n lĂ½ kho serial, kĂ­ch hoáº¡t báº£o hĂ nh.

### Kiáº¿n trĂºc

| ThĂ nh pháº§n | CĂ´ng nghá»‡ | Vai trĂ² |
|---|---|---|
| **Backend** | Spring Boot 3.4.3, Java 17, PostgreSQL, Redis-ready config (optional), AWS S3 | REST API + WebSocket |
| **Dealer App** | Flutter (Material 3), Dart, ChangeNotifier | á»¨ng dá»¥ng mobile cho Ä‘áº¡i lĂ½ |
| **Admin Dashboard** | React 18, TypeScript, Vite | Giao diá»‡n quáº£n trá»‹ ná»™i bá»™ |
| **Main Website** | Next.js (App Router) | Trang web public (ISR, SEO) |

```
Dealer App (Flutter) â”€â”€â”€â”€ REST + WebSocket â”€â”€â”€â”€â”
                                                â–¼
Admin Dashboard (React) â”€â”€â”€â”€ REST â”€â”€â”€â”€â–º Backend API â”€â”€â”€â”€ PostgreSQL
                                                â”‚    â”€â”€â”€â”€ Redis (optional / theo mĂ´i trÆ°á»ng)
Main Website (Next.js) â”€â”€â”€â”€ REST â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€ AWS S3 / MinIO (file)
```

### PhĂ¢n quyá»n

| Role | MĂ´ táº£ | JWT Authority |
|---|---|---|
| `DEALER` | Äáº¡i lĂ½ bĂ¡n hĂ ng | `"DEALER"` |
| `ADMIN` | Quáº£n trá»‹ viĂªn | `"ADMIN"` |
| `SUPER_ADMIN` | Quáº£n trá»‹ viĂªn cao cáº¥p | `"SUPER_ADMIN"` |
| `public` | KhĂ´ng cáº§n Ä‘Äƒng nháº­p | â€” |

**Quy táº¯c truy cáº­p:**

| Endpoint | Quyá»n truy cáº­p |
|---|---|
| `POST /api/v1/admin/users`, `/api/v1/admin/users/**` | `SUPER_ADMIN` only |
| `/api/v1/admin/**` | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/dealer/**` | `DEALER` |
| `POST /api/v1/warranty-activation` | `DEALER` |
| `POST /api/v1/upload/products`, `/upload/blogs`, `/upload/avatars` | `ADMIN`, `SUPER_ADMIN` |
| `POST /api/v1/upload/dealer-avatars`, `/upload/payment-proofs` | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| `DELETE /api/v1/upload` | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| `GET /api/v1/upload/**` | Public á»Ÿ táº§ng security; path public (`products/`, `blogs/`) má»Ÿ cĂ´ng khai, path private bá»‹ `UploadController` cháº·n theo auth/ownership |
| `/api/v1/auth/**`, `/api/v1/content/**`, `/api/v1/blog/**`, `/api/v1/product/**` | Public |
| `/api/v1/warranty/check/**`, `/api/v1/webhooks/sepay` | Public |
| `GET /api/v1/user/dealer`, `GET /api/v1/user/dealer/page` | Public |
| `/uploads/**`, `/ws/**`, `/api/v1/health`, `/v3/api-docs/**`, `/swagger-ui/**` | Public |

> `ADMIN` vĂ  `SUPER_ADMIN` há»— trá»£ dealer qua `/api/v1/admin/**`, upload route phĂ¹ há»£p, vĂ  cĂ¡c topic admin WebSocket; runtime hiá»‡n táº¡i **khĂ´ng** cho admin dĂ¹ng chung namespace `/api/v1/dealer/**`. `SUPER_ADMIN` cĂ³ quyá»n riĂªng duy nháº¥t lĂ  quáº£n lĂ½ staff (`/api/v1/admin/users/**`). ToĂ n bá»™ phĂ¢n quyá»n enforce táº¡i server â€” Dealer App khĂ´ng thá»±c hiá»‡n role-check phĂ­a client.

---

## 2. Danh sĂ¡ch chá»©c nÄƒng

### Dealer App

| # | Chá»©c nÄƒng | MĂ´ táº£ |
|---|---|---|
| F01 | ÄÄƒng nháº­p / ÄÄƒng xuáº¥t | JWT auth, token refresh tá»± Ä‘á»™ng |
| F02 | Danh má»¥c sáº£n pháº©m | Lá»c, phĂ¢n trang, tĂ¬m kiáº¿m client-side |
| F03 | Giá» hĂ ng | ThĂªm, sá»­a sá»‘ lÆ°á»£ng, xĂ³a, xem chiáº¿t kháº¥u |
| F04 | Äáº·t hĂ ng | Chuyá»ƒn khoáº£n hoáº·c ghi ná»£ |
| F05 | Theo dĂµi Ä‘Æ¡n hĂ ng | Lá»‹ch sá»­, tráº¡ng thĂ¡i, chi tiáº¿t, reorder |
| F06 | Ghi nháº­n thanh toĂ¡n | Ghi theo Ä‘Æ¡n tá»« mĂ n OrderDetail hoáº·c DebtTracking |
| F07 | Theo dĂµi cĂ´ng ná»£ | Danh sĂ¡ch Ä‘Æ¡n cĂ²n ná»£, tá»•ng ná»£, ghi thanh toĂ¡n |
| F08 | Kho serial | Xem serial, tráº¡ng thĂ¡i kĂ­ch hoáº¡t |
| F09 | KĂ­ch hoáº¡t báº£o hĂ nh | Serial-first â€” khĂ´ng cáº§n chá»n Ä‘Æ¡n trÆ°á»›c |
| F10 | Xuáº¥t hĂ ng theo serial | Gom serial Ä‘á»§ Ä‘iá»u kiá»‡n, nháº­p thĂ´ng tin khĂ¡ch, kĂ­ch hoáº¡t nhiá»u serial trong má»™t lÆ°á»£t |
| F11 | ThĂ´ng bĂ¡o real-time | WebSocket, reconnect + refetch khi káº¿t ná»‘i láº¡i |
| F12 | Há»— trá»£ | Táº¡o ticket, xem pháº£n há»“i, lá»‹ch sá»­ |
| F13 | Dashboard | Tá»•ng quan theo ká»³ thĂ¡ng/quĂ½ |
| F14 | CĂ i Ä‘áº·t | NgĂ´n ngá»¯ (VI/EN), giao diá»‡n (dark/light/system) |

### Admin Dashboard

| # | Chá»©c nÄƒng |
|---|---|
| A01 | Quáº£n lĂ½ Ä‘áº¡i lĂ½ (danh sĂ¡ch, duyá»‡t tĂ i khoáº£n, cáº­p nháº­t há»“ sÆ¡, credit limit) |
| A02 | Quáº£n lĂ½ sáº£n pháº©m & SKU |
| A03 | Quáº£n lĂ½ Ä‘Æ¡n hĂ ng, duyá»‡t & chuyá»ƒn tráº¡ng thĂ¡i |
| A04 | Quáº£n lĂ½ báº£o hĂ nh |
| A05 | Quáº£n lĂ½ kho serial (import, cáº­p nháº­t, xĂ³a) |
| A06 | Gá»­i thĂ´ng bĂ¡o cho Ä‘áº¡i lĂ½ |
| A07 | BĂ¡o cĂ¡o & xuáº¥t dá»¯ liá»‡u |
| A08 | Audit log backend cho mutation admin |

---

## 3. Logic nghiá»‡p vá»¥ chi tiáº¿t

---

### 3.1 XĂ¡c thá»±c & phĂ¢n quyá»n

#### ÄÄƒng nháº­p â€” `POST /api/v1/auth/login`

Nháº­n `username` (email hoáº·c username) + `password`. Quy trĂ¬nh:
1. Normalize input (trim, lowercase)
2. XĂ¡c thá»±c má»™t bÆ°á»›c qua `AuthenticationManager` (bcrypt) â€” khĂ´ng tĂ¡ch riĂªng email/password Ä‘á»ƒ trĂ¡nh timing attack
3. Náº¿u tháº¥t báº¡i (sai credentials hoáº·c tĂ i khoáº£n disabled) â†’ tráº£ `invalidCredentials` (thĂ´ng bĂ¡o chung)
4. PhĂ¡t hĂ nh `accessToken` (JWT, TTL **30 phĂºt**) + `refreshToken` (TTL **7 ngĂ y**, khĂ´ng rotate)

> Chỉ dealer `ACTIVE` mới đăng nhập thành công. Dealer `UNDER_REVIEW` / `SUSPENDED` bị trả `401` ngay tại bước login và không nhận token.

#### Token Refresh â€” `POST /api/v1/auth/refresh`

Trả `accessToken` mới nếu `refreshToken` còn hợp lệ, tài khoản còn `enabled`, và dealer vẫn có `customerStatus = ACTIVE`. `UNDER_REVIEW` / `SUSPENDED` bị trả `401` tại bước refresh. Hết hạn → `401` → client buộc logout, xóa token.

> **Giá»›i háº¡n thiáº¿t káº¿:** KhĂ´ng cĂ³ server-side token blacklist â€” token váº«n há»£p lá»‡ Ä‘áº¿n khi háº¿t TTL dĂ¹ Ä‘Ă£ Ä‘Äƒng xuáº¥t.

#### ÄÄƒng xuáº¥t

Client-side only: xĂ³a token, clear toĂ n bá»™ state (cart, orders, warranty, notifications).

#### QuĂªn máº­t kháº©u

| BÆ°á»›c | Endpoint | MĂ´ táº£ |
|---|---|---|
| 1 | `POST /api/v1/auth/forgot-password` | Gá»­i link reset náº¿u email tá»“n táº¡i (luĂ´n tráº£ thĂ nh cĂ´ng) |
| 2 | `GET /api/v1/auth/reset-password/validate?token=...` | Kiá»ƒm tra token cĂ²n há»£p lá»‡ |
| 3 | `POST /api/v1/auth/reset-password` | Äáº·t máº­t kháº©u má»›i báº±ng token |

Token reset cĂ³ hiá»‡u lá»±c **30 phĂºt** (cáº¥u hĂ¬nh qua `app.password-reset.expiration-minutes`). YĂªu cáº§u reset má»›i â†’ token cÅ© bá»‹ xĂ³a ngay.

#### ÄÄƒng kĂ½ dealer â€” `POST /api/v1/auth/register-dealer` (public)

TĂ i khoáº£n táº¡o vá»›i `customerStatus = UNDER_REVIEW`. Há»‡ thá»‘ng gá»­i email xĂ¡c nháº­n vĂ  publish WebSocket event cho admin.

**Payload:** `username`* Â· `password`* Â· `email` Â· `businessName` Â· `contactName` Â· `taxCode` Â· `phone` Â· `addressLine` Â· `ward` Â· `district` Â· `city` Â· `country` Â· `avatarUrl`

**Validation:**
- `username`: báº¯t buá»™c, unique
- `email`: unique, Ä‘Ăºng format (náº¿u cĂ³)
- `taxCode`: unique (náº¿u cĂ³)
- `phone`: unique, Ä‘á»‹nh dáº¡ng Vietnam `0[0-9]{9}` (náº¿u cĂ³)
- `password`: tá»‘i thiá»ƒu 8 kĂ½ tá»±, cĂ³ chá»¯ hoa + chá»¯ thÆ°á»ng + chá»¯ sá»‘
- TrĂ¹ng â†’ `409 Conflict` vá»›i field cá»¥ thá»ƒ

#### Quy táº¯c máº­t kháº©u (`assertStrongPassword`)

Ăp dá»¥ng táº¡i Ä‘Äƒng kĂ½ dealer, táº¡o admin staff, Ä‘áº·t láº¡i máº­t kháº©u: **tá»‘i thiá»ƒu 8 kĂ½ tá»±**, báº¯t buá»™c cĂ³ chá»¯ hoa, chá»¯ thÆ°á»ng, chá»¯ sá»‘.

---

### 3.2 Sáº£n pháº©m & danh má»¥c

**Endpoints (public):**
- `GET /api/v1/product/products` â€” danh sĂ¡ch
- `GET /api/v1/product/products/page` â€” phĂ¢n trang (`totalPages`, `totalElements`, `items[]`)
- `GET /api/v1/product/{productId}` â€” chi tiáº¿t
- `GET /api/v1/product/products/search?query&minPrice&maxPrice` â€” tĂ¬m kiáº¿m theo tá»« khĂ³a vĂ /hoáº·c khoáº£ng giĂ¡
- `GET /api/v1/product/products/featured` â€” sáº£n pháº©m ná»•i báº­t (`featured = true`)
- `GET /api/v1/product/products/new` â€” sáº£n pháº©m má»›i nháº¥t

> Dealer App luĂ´n gá»i kĂ¨m token dĂ¹ endpoint lĂ  public. Filter vĂ  sort Ä‘Æ°á»£c thá»±c hiá»‡n **client-side**.

**Quy táº¯c hiá»ƒn thá»‹:**
- `stock â‰¤ 10` (`kLowStockThreshold`) â†’ cáº£nh bĂ¡o "sáº¯p háº¿t hĂ ng"
- `stock = 0` â†’ khĂ´ng cho thĂªm vĂ o giá»

**Lá»c client-side:** stock (`all` | `inStock` | `lowStock` | `outOfStock`), text (so sĂ¡nh `name`, `sku`, `shortDescription`)

**Sáº¯p xáº¿p client-side:** `none` | `priceAsc` | `priceDesc` | `nameAsc` | `nameDesc`

**Cáº¥u trĂºc dá»¯ liá»‡u:**
```
Product { id, sku, name, shortDescription, price (VNÄ, integer),
          stock, warrantyMonths, imageUrl?, descriptions[], videos[], specifications[] }

ProductDescriptionItem { type: title|description|image|gallery|video,
                         text?, url?, caption?, gallery[] }

ProductVideoItem { title, url, description?, type (default: 'tutorial') }
```

---

### 3.3 Giá» hĂ ng & Chiáº¿t kháº¥u

**Endpoints:**
- `GET /api/v1/dealer/cart` â€” láº¥y giá»
- `PUT /api/v1/dealer/cart/items` â€” thĂªm/cáº­p nháº­t item
- `DELETE /api/v1/dealer/cart/items/{productId}` â€” xĂ³a item
- `DELETE /api/v1/dealer/cart` â€” xĂ³a toĂ n bá»™
- `GET /api/v1/dealer/discount-rules` â€” láº¥y quy táº¯c chiáº¿t kháº¥u

**Kiáº¿n trĂºc:** Local-first, optimistic update + rollback khi lá»—i máº¡ng.

**CĂ´ng thá»©c tĂ­nh giĂ¡:**
```
subtotal           = Î£ (price Ă— quantity)
discountAmount     = bulkDiscountAmount(cartItems, activeRules)
totalAfterDiscount = subtotal - discountAmount
vatAmount          = totalAfterDiscount Ă— 10%      // VAT cá»‘ Ä‘á»‹nh 10% theo policy cĂ´ng ty
total              = totalAfterDiscount + vatAmount // KhĂ´ng cĂ³ phĂ­ giao hĂ ng theo policy cĂ´ng ty
```

> `shippingFee` luĂ´n = 0 theo policy cĂ´ng ty â€” server tá»« chá»‘i báº¥t ká»³ giĂ¡ trá»‹ nĂ o khĂ¡c 0.

**Chiáº¿t kháº¥u theo sá»‘ lÆ°á»£ng (Bulk Discount):**

Quy táº¯c Æ°u tiĂªn khi chá»n rule Ă¡p dá»¥ng:
1. Rule product-specific Æ°u tiĂªn hÆ¡n rule global
2. Trong cĂ¹ng loáº¡i: chá»n `minQty` cao nháº¥t phĂ¹ há»£p
3. CĂ¹ng `minQty`: chá»n `discountPercent` cao nháº¥t

```
BulkDiscountRule { productId? (null = global), minQty, maxQty?, discountPercent }
```

Chá»‰ rule cĂ³ `status = ACTIVE` Ä‘Æ°á»£c Ă¡p dá»¥ng. `BulkDiscountTarget` hiá»ƒn thá»‹ tiáº¿n trĂ¬nh Ä‘áº¿n tier tiáº¿p theo.

**Validation:** sá»‘ lÆ°á»£ng â‰¥ 1, â‰¤ stock, khĂ´ng cho phĂ©p thĂªm sáº£n pháº©m háº¿t hĂ ng.

---

### 3.4 Äáº·t hĂ ng & Thanh toĂ¡n

**Tráº¡ng thĂ¡i section:** `[Implemented]` cho táº¡o Ä‘Æ¡n, order status, SePay webhook, dealer/admin payment hiá»‡n táº¡i. `[Policy]` cho VAT 10% vĂ  `shippingFee = 0`. `[Pending Decision]` cho debt payment verification nhiá»u bÆ°á»›c trong tÆ°Æ¡ng lai.

#### Táº¡o Ä‘Æ¡n â€” `POST /api/v1/dealer/orders`

**Payload:**
```json
{
  "paymentMethod": "BANK_TRANSFER | DEBT",
  "receiverName": "...", "receiverPhone": "...", "receiverAddress": "...",
  "note": "...",
  "items": [{ "productId": "...", "quantity": 3 }]
}
```

**Quy trĂ¬nh:**
1. Validate sản phẩm tồn tại; backend khóa inventory liên quan và pick đủ serial `AVAILABLE` thực tế cho từng SKU trước khi tạo đơn
2. Snapshot giĂ¡ â†’ lÆ°u `unitPrice` vĂ o `DealerOrderItem` (giĂ¡ thay Ä‘á»•i sau khĂ´ng áº£nh hÆ°á»Ÿng)
3. TĂ­nh subtotal, discount, VAT, total; enforce `shippingFee = 0` theo policy cĂ´ng ty
4. Náº¿u `DEBT`: kiá»ƒm tra `currentOutstandingDebt + total â‰¤ creditLimit` â€” dĂ¹ng `SELECT FOR UPDATE` trĂªn row Dealer
5. Reserve serial: khóa row `Product` và serial liên quan, pick đúng số serial từ pool khả dụng `dealer IS NULL AND order IS NULL AND status = AVAILABLE`, chuyển `AVAILABLE → RESERVED` trong cùng transaction; sau đó đồng bộ `product.stock` như giá trị phái sinh
6. LÆ°u Ä‘Æ¡n `status = PENDING`; gá»­i email xĂ¡c nháº­n cho dealer (async); publish `adminNewOrder` WebSocket

Client tá»± gá»i `DELETE /api/v1/dealer/cart` sau khi nháº­n pháº£n há»“i thĂ nh cĂ´ng.

> Runtime hiện tại dùng pool serial khả dụng `dealer IS NULL AND order IS NULL AND status = AVAILABLE` làm nguồn sự thật để chặn oversell giữa các dealer. `Product.stock` chỉ còn là số liệu đồng bộ/phái sinh từ pool serial khả dụng của SKU. Serial còn `dealer IS NULL` nhưng đã gắn `order` không còn được tính là tồn kho bán được.

**MĂ£ Ä‘Æ¡n:** `SCS-{dealerId}-{timestamp}-{random6}` â€” dĂ¹ng Ä‘á»ƒ khá»›p ná»™i dung chuyá»ƒn khoáº£n SePay.

#### Tráº¡ng thĂ¡i Ä‘Æ¡n hĂ ng

```
PENDING â”€â”€â–º CONFIRMED â”€â”€â–º SHIPPING â”€â”€â–º COMPLETED
   â”‚              â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º CANCELLED
```

| Transition | Ai thá»±c hiá»‡n | Há»‡ quáº£ |
|---|---|---|
| `PENDING â†’ CONFIRMED` | Admin | â€” |
| `CONFIRMED â†’ SHIPPING` | Admin | WebSocket `/user/queue/order-status` â†’ dealer |
| `SHIPPING â†’ COMPLETED` | Admin | Serial `RESERVED â†’ ASSIGNED`; vĂ o kho dealer |
| `PENDING/CONFIRMED â†’ CANCELLED` | Admin hoáº·c Dealer | Serial `RESERVED â†’ AVAILABLE`; thĂ´ng bĂ¡o Ä‘áº¿n táº¥t cáº£ admin `ACTIVE` |

> ÄÆ¡n Ä‘ang `SHIPPING` khĂ´ng thá»ƒ há»§y. `COMPLETED` vĂ  `CANCELLED` lĂ  tráº¡ng thĂ¡i cuá»‘i. Admin dĂ¹ng `SELECT FOR UPDATE` trĂªn row Order khi cáº­p nháº­t tráº¡ng thĂ¡i.

#### Thanh toĂ¡n â€” Bank Transfer

1. Dealer xem thĂ´ng tin tĂ i khoáº£n ngĂ¢n hĂ ng (`GET /api/v1/dealer/payment-instructions`), sao chĂ©p vĂ  chuyá»ƒn tiá»n
2. SePay webhook tá»± Ä‘á»™ng xĂ¡c nháº­n khi nháº­n giao dá»‹ch khá»›p â†’ `paymentStatus = PAID`

**Quy táº¯c SePay webhook (`POST /api/v1/webhooks/sepay`):**
- Token qua query param `?token=...` hoáº·c header `X-Webhook-Token` (query param Æ°u tiĂªn)
- Chá»‰ cháº¥p nháº­n sá»‘ tiá»n **Ä‘Ăºng báº±ng** `outstandingAmount` â€” khĂ´ng cháº¥p nháº­n thanh toĂ¡n má»™t pháº§n
- Idempotent: trĂ¹ng `transactionCode` bá»‹ bá» qua
- ÄÆ¡n Ä‘Ă£ há»§y hoáº·c Ä‘Ă£ thanh toĂ¡n Ä‘á»§ â†’ bá» qua
- DĂ¹ng `SELECT FOR UPDATE` trĂªn row Order (theo `orderCode`) khi xá»­ lĂ½

Náº¿u `sepay.enabled=true`, dealer **khĂ´ng thá»ƒ** tá»± ghi payment cho Ä‘Æ¡n bank transfer. Admin cĂ³ thá»ƒ override qua `POST /api/v1/admin/orders/{id}/payments`.

**Äá»“ng bá»™ FE sau SePay thĂ nh cĂ´ng** `[Implemented]`
- Khi webhook SePay xĂ¡c nháº­n thanh toĂ¡n thĂ nh cĂ´ng, backend cáº­p nháº­t tráº¡ng thĂ¡i payment/order vĂ  publish event `/user/queue/order-status`.
- Dealer App Ä‘á»“ng bá»™ láº¡i tráº¡ng thĂ¡i thanh toĂ¡n qua WebSocket; khi reconnect sáº½ refetch láº¡i dá»¯ liá»‡u liĂªn quan.
- Náº¿u ngÆ°á»i dĂ¹ng Ä‘ang má»Ÿ bank-transfer sheet, sheet tá»± Ä‘Ă³ng khi tháº¥y `paymentStatus = PAID`.
- Náº¿u ngÆ°á»i dĂ¹ng Ä‘ang á»Ÿ `OrderSuccessScreen` hoáº·c mĂ n Ä‘ang Ä‘á»c cĂ¹ng order state, UI Ä‘á»•i sang tráº¡ng thĂ¡i Ä‘Ă£ thanh toĂ¡n sau khi sync.
- Hiá»‡n chÆ°a cĂ³ cÆ¡ cháº¿ redirect toĂ n cá»¥c tá»« má»i context báº¥t ká»³ sang má»™t mĂ n success riĂªng.

#### Thanh toĂ¡n â€” Ghi ná»£ (Debt) `[Implemented]`

`paymentStatus = DEBT_RECORDED` ngay khi táº¡o Ä‘Æ¡n. `outstandingAmount = total âˆ’ paidAmount` (tĂ­nh Ä‘á»™ng, khĂ´ng lÆ°u field riĂªng).

#### Ghi nháº­n thanh toĂ¡n cĂ´ng ná»£ â€” `POST /api/v1/dealer/orders/{id}/payments` `[Implemented]`

```json
{ "amount": 1000000, "method": "BANK_TRANSFER|DEBT|...", "channel": "cash|bankTransfer|...",
  "note": "...", "proofFileName": "...", "paidAt": "2026-03-21T10:00:00Z" }
```

**Behavior hiá»‡n hĂ nh:**
- Dealer tá»± táº¡o payment record cho Ä‘Æ¡n cĂ²n ná»£ cá»§a mĂ¬nh
- Payment cĂ³ hiá»‡u lá»±c ngay khi request há»£p lá»‡ vĂ  transaction commit thĂ nh cĂ´ng
- `outstandingAmount` giáº£m ngay sau khi payment Ä‘Æ°á»£c ghi nháº­n

**Validation hiá»‡n hĂ nh:**
- `amount > 0` (`@DecimalMin(0.01)`)
- `amount â‰¤ outstandingAmount`
- `outstandingAmount > 0` â€” Ä‘Æ¡n Ä‘Ă£ Ä‘á»§ â†’ tá»« chá»‘i
- TrĂ¹ng láº·p: cĂ¹ng `orderId` + `amount` trong **5 giĂ¢y** â†’ tá»« chá»‘i (check DB trá»±c tiáº¿p)
- `transactionCode` unique toĂ n há»‡ thá»‘ng (náº¿u cĂ³)
- DĂ¹ng `SELECT FOR UPDATE` trĂªn row Order

**Quy táº¯c háº¡ch toĂ¡n hiá»‡n hĂ nh:**
- `paidAmount`: tá»•ng payment Ä‘Ă£ Ä‘Æ°á»£c ghi nháº­n
- `outstandingAmount = max(0, total âˆ’ paidAmount)`

> ÄĂ¢y lĂ  contract runtime hiá»‡n táº¡i. ChÆ°a cĂ³ bÆ°á»›c `PENDING_VERIFICATION / CONFIRMED / REJECTED` á»Ÿ production flow.

#### Admin ghi payment â€” `POST /api/v1/admin/orders/{id}/payments` `[Implemented]`

Payload nhÆ° dealer + khĂ´ng bá»‹ cháº·n bá»Ÿi SePay restriction. Admin cĂ³ thá»ƒ ghi payment trá»±c tiáº¿p trong cĂ¡c trÆ°á»ng há»£p há»— trá»£/override.

> Vá» quáº£n trá»‹ dá»¯ liá»‡u, váº«n Æ°u tiĂªn soft-delete hoáº·c archive thay vĂ¬ xĂ³a cá»©ng Ä‘Æ¡n `CANCELLED`, nhÆ°ng Ä‘Ă¢y hiá»‡n lĂ  Ä‘á»‹nh hÆ°á»›ng quáº£n trá»‹ hÆ¡n lĂ  contract API báº¯t buá»™c.

---

### 3.5 Theo dĂµi cĂ´ng ná»£

**Tráº¡ng thĂ¡i section:** `[Implemented]`

**MĂ n hĂ¬nh:** `DebtTrackingScreen` â€” má»Ÿ tá»« shortcut Dashboard (khĂ´ng pháº£i tab Ä‘á»™c láº­p).

Hiá»ƒn thá»‹ cĂ¡c Ä‘Æ¡n thá»a: `paymentMethod = DEBT AND outstandingAmount > 0 AND status â‰  CANCELLED`.

Tá»•ng há»£p: tá»•ng ná»£ tá»“n (`Î£ outstandingAmount`), sá»‘ Ä‘Æ¡n cĂ²n ná»£, danh sĂ¡ch cĂ³ thá»ƒ báº¥m Ä‘á»ƒ ghi nháº­n thanh toĂ¡n.

> Dealer cĂ³ thá»ƒ ghi nháº­n thanh toĂ¡n cho Ä‘Æ¡n cĂ²n ná»£ cá»§a mĂ¬nh; khi request thĂ nh cĂ´ng thĂ¬ `outstandingAmount` giáº£m ngay theo payment Ä‘Ă£ ghi.

---

### 3.6 Kho hĂ ng & Serial

**Tráº¡ng thĂ¡i section:** `[Implemented]` cho lifecycle hiá»‡n táº¡i. `[Pending Decision]` cho RMA/reset serial tá»« `DEFECTIVE` hoáº·c `RETURNED`.

**MĂ´ hĂ¬nh:**
```
ProductSerial { serial (unique toĂ n há»‡ thá»‘ng), product, warehouse,
                status: AVAILABLE|RESERVED|ASSIGNED|WARRANTY|DEFECTIVE|RETURNED, importedAt }
```

**VĂ²ng Ä‘á»i tráº¡ng thĂ¡i:**
```
AVAILABLE â”€â”€â–º RESERVED â”€â”€â–º ASSIGNED â”€â”€â–º WARRANTY
(admin import)  (Ä‘áº·t Ä‘Æ¡n)   (COMPLETED)  (kĂ­ch hoáº¡t)
     â–²               â”‚            â”‚
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜            â”œâ”€â”€â–º DEFECTIVE
  (Ä‘Æ¡n há»§y)                      â””â”€â”€â–º RETURNED
```

> `WARRANTY` hiá»ƒn thá»‹ lĂ  `activated` trong Dealer App.

**Import serial (Admin) â€” `POST /api/v1/admin/serials/import`:**
- Bulk import; normalize: trim + uppercase
- Serial đã tồn tại trong DB không làm fail cả batch; item đó bị skip với reason rõ ràng trong response summary
- Duplicate lặp lại trong cùng request được dedupe một lần; các serial hợp lệ còn lại vẫn tiếp tục import
- Response trả partial-success summary gồm `importedItems`, `skippedItems`, `importedCount`, `skippedCount`
- Nếu import và đồng thời link serial vào một order:
  - order `COMPLETED` → serial buộc về `ASSIGNED`
  - order chưa `COMPLETED` → serial buộc về `RESERVED`
  - không được dùng `AVAILABLE` cho serial đã gắn order
  - nếu client gửi `RESERVED` hoặc `ASSIGNED`, backend vẫn chuẩn hóa về trạng thái bắt buộc theo order; các status khác bị từ chối

**Auto-reserve khi tạo đơn:** Hệ thống tự pick serial `AVAILABLE` đúng số lượng từ pool serial thực tế. Không đủ → từ chối đơn.

**Serial vào kho dealer:** Khi đơn chuyển `COMPLETED` → backend gán serial cho dealer (`serial.dealer = order.dealer`), chuyển `RESERVED → ASSIGNED`, đồng thời đồng bộ lại `product.stock` từ pool serial còn `AVAILABLE` của NPP.

> Serial chá»‰ **chĂ­nh thá»©c thuá»™c dealer** ká»ƒ tá»« thá»i Ä‘iá»ƒm Ä‘Æ¡n chá»©a serial Ä‘Ă³ chuyá»ƒn `COMPLETED`. á» tráº¡ng thĂ¡i `RESERVED`, serial má»›i chá»‰ Ä‘Æ°á»£c giá»¯ cho Ä‘Æ¡n, chÆ°a Ä‘Æ°á»£c coi lĂ  tĂ i sáº£n/kho chĂ­nh thá»©c cá»§a dealer.

> Dealer inventory runtime chỉ hiển thị serial đã thuộc dealer và hoặc không gắn order, hoặc gắn order đã `COMPLETED`. Serial gắn order chưa hoàn tất chưa được coi là tồn kho khả dụng của dealer.

**Dealer cáº­p nháº­t tráº¡ng thĂ¡i:** `PATCH /api/v1/dealer/serials/{id}/status` â€” Ä‘Ă¡nh dáº¥u `DEFECTIVE` hoáº·c `RETURNED` (chá»‰ Ă¡p dá»¥ng cho serial `ASSIGNED` hoáº·c `WARRANTY`).

---

### 3.7 Báº£o hĂ nh

**Tráº¡ng thĂ¡i section:** `[Implemented]`

#### Triáº¿t lĂ½: Serial-First

Dealer chá»‰ cáº§n serial â€” há»‡ thá»‘ng tá»± resolve thĂ´ng tin Ä‘Æ¡n. KhĂ´ng cáº§n chá»n Ä‘Æ¡n trÆ°á»›c. `orderId` váº«n Ä‘Æ°á»£c lÆ°u trong báº£n ghi Ä‘á»ƒ phá»¥c vá»¥ traceability vĂ  bĂ¡o cĂ¡o.

#### KĂ­ch hoáº¡t báº£o hĂ nh â€” `POST /api/v1/warranty-activation`

```json
{ "productSerialId": 42, "customerName": "...", "customerEmail": "...",
  "customerPhone": "...", "customerAddress": "...", "purchaseDate": "2026-03-19" }
```

**Quy trĂ¬nh:**
1. Normalize serial (trim + uppercase), resolve `productSerialId` qua `GET /api/v1/dealer/serials`
2. Validate: serial thuá»™c kho dealer, chÆ°a kĂ­ch hoáº¡t, Ä‘Æ¡n liĂªn káº¿t `status = COMPLETED`
3. Dealer App hiá»‡n yĂªu cáº§u dealer nháº­p thá»§ cĂ´ng cáº£ `name/email/phone/address`; á»Ÿ backend, náº¿u request Ä‘á»ƒ trá»‘ng `name/phone/address` thĂ¬ server má»›i fallback tá»« receiver info cá»§a Ä‘Æ¡n. `email` luĂ´n pháº£i dealer nháº­p thá»§ cĂ´ng
4. Dealer chá»n `purchaseDate` (máº·c Ä‘á»‹nh = ngĂ y táº¡o Ä‘Æ¡n, cĂ³ thá»ƒ chá»‰nh)
5. Gá»i API â†’ táº¡o `WarrantyRegistration`, cáº­p nháº­t serial `â†’ WARRANTY`
6. NgĂ y háº¿t báº£o hĂ nh = `purchaseDate + warrantyMonths`

**Validation:** má»™t serial chá»‰ kĂ­ch hoáº¡t má»™t láº§n; chá»‰ serial Ä‘Ă£ **chĂ­nh thá»©c thuá»™c dealer** (tá»©c Ä‘Ă£ vĂ o kho dealer qua Ä‘Æ¡n `COMPLETED`) má»›i Ä‘Æ°á»£c kĂ­ch hoáº¡t; `purchaseDate` khĂ´ng trÆ°á»›c ngĂ y táº¡o Ä‘Æ¡n, khĂ´ng sau hĂ´m nay; táº¥t cáº£ thĂ´ng tin khĂ¡ch hĂ ng báº¯t buá»™c.

**Tráº¡ng thĂ¡i báº£o hĂ nh:**

| Status | MĂ´ táº£ |
|---|---|
| `ACTIVE` | CĂ²n hiá»‡u lá»±c |
| `EXPIRED` | Háº¿t háº¡n theo `purchaseDate + warrantyMonths` |
| `VOID` | Bá»‹ vĂ´ hiá»‡u hoĂ¡ bá»Ÿi admin (vĂ­ dá»¥: vi pháº¡m Ä‘iá»u khoáº£n) |

**Admin quáº£n lĂ½ â€” `PATCH /api/v1/admin/warranties/{id}/status`:**
- KhĂ´ng thá»ƒ set `ACTIVE` náº¿u warranty Ä‘Ă£ expired
- Äá»“ng bá»™ serial theo tráº¡ng thĂ¡i warranty:
  - `ACTIVE` â†’ serial `WARRANTY`
  - `EXPIRED` hoáº·c `VOID` â†’ serial vá» `ASSIGNED` náº¿u gáº¯n vá»›i Ä‘Æ¡n `COMPLETED`, ngÆ°á»£c láº¡i vá» `AVAILABLE`
  - náº¿u serial Ä‘ang `DEFECTIVE` hoáº·c `RETURNED` thĂ¬ giá»¯ nguyĂªn, khĂ´ng bá»‹ warranty update ghi Ä‘Ă¨
- Má»i thay Ä‘á»•i clear cache `PUBLIC_WARRANTY_LOOKUP`

**Dealer Warranty CRUD (`/api/v1/dealer/warranties`):** NgoĂ i luá»“ng serial-first, dealer cĂ³ thá»ƒ táº¡o/sá»­a/xĂ³a warranty record thá»§ cĂ´ng. Khi xĂ³a:
- ÄÆ¡n `COMPLETED` hoáº·c serial Ä‘ang `WARRANTY` â†’ serial vá» `ASSIGNED`
- ÄÆ¡n chÆ°a hoĂ n thĂ nh â†’ serial vá» `AVAILABLE`

**Local sync (Dealer App):** Cache báº£o hĂ nh trong `SharedPreferences`. Khi boot: táº£i tá»« `/api/v1/dealer/serials` vĂ  `/api/v1/dealer/warranties`. `_ensureImportedSerialsForActivations()` táº¡o dummy record náº¿u thiáº¿u, báº£o toĂ n `warehouseId` gá»‘c khi Ä‘Ă£ cĂ³.

---

### 3.8 Xuáº¥t hĂ ng theo serial

**MĂ n hĂ¬nh:** `WarrantyExportScreen` â€” tĂªn UI hiá»‡n táº¡i lĂ  "Xuáº¥t hĂ ng".

1. Scan QR hoáº·c nháº­p serial; app validate serial Ä‘á»§ Ä‘iá»u kiá»‡n kĂ­ch hoáº¡t
2. ThĂªm serial vĂ o "giá» xuáº¥t hĂ ng"
3. Dealer nháº­p thĂ´ng tin khĂ¡ch hĂ ng + ngĂ y mua
4. App gá»i luá»“ng kĂ­ch hoáº¡t báº£o hĂ nh serial-first cho tá»«ng serial trong giá»

> MĂ n hĂ¬nh nĂ y hiá»‡n **khĂ´ng** táº¡o file PDF/Excel. TĂªn `WarrantyExportScreen` lĂ  tĂªn mĂ n hĂ¬nh legacy trong code, nhÆ°ng behavior thá»±c táº¿ lĂ  gom serial Ä‘á»ƒ kĂ­ch hoáº¡t báº£o hĂ nh theo lĂ´.

---

### 3.9 Dashboard bĂ¡o cĂ¡o

**MĂ n hĂ¬nh:** Tab "Tá»•ng quan" (`DashboardScreen`). Bá»™ lá»c: `thĂ¡ng` hoáº·c `quĂ½`, Ä‘iá»u hÆ°á»›ng ká»³ trÆ°á»›c/sau.

| Card | MĂ´ táº£ |
|---|---|
| Quick Actions | Shortcut: Táº¡o Ä‘Æ¡n, CĂ´ng ná»£, Kho hĂ ng, Báº£o hĂ nh |
| Overview | Doanh thu, cĂ´ng ná»£ tá»“n, sá»‘ Ä‘Æ¡n, tá»· lá»‡ hoĂ n thĂ nh â€” theo ká»³ |
| Low Stock Alert | Sáº£n pháº©m `stock â‰¤ 10` |
| Order Status Distribution | PhĂ¢n bá»• tráº¡ng thĂ¡i Ä‘Æ¡n trong ká»³ |
| Revenue Chart | Doanh thu theo thĂ¡ng trong ká»³ |
| Aging Debt | CĂ´ng ná»£ phĂ¢n theo tuá»•i ná»£ |
| Activation Trend | Xu hÆ°á»›ng kĂ­ch hoáº¡t báº£o hĂ nh â€” theo **ká»³ Ä‘Æ°á»£c chá»n** |
| Warranty Status Donut | Tá»· lá»‡ serial Ä‘Ă£/chÆ°a kĂ­ch hoáº¡t â€” cá»­a sá»• cá»‘ Ä‘á»‹nh **90 ngĂ y** |
| Recent Orders | ÄÆ¡n hĂ ng gáº§n Ä‘Ă¢y trong ká»³ |

> TrĂªn mobile: Activation Trend vĂ  Warranty Donut thu gá»n máº·c Ä‘á»‹nh.

---

### 3.10 ThĂ´ng bĂ¡o

**Káº¿t ná»‘i:** WebSocket táº¡i `/ws`. Token xĂ¡c thá»±c qua STOMP header `Authorization: Bearer ...` hoáº·c header native `token` khi CONNECT. Dealer App hiá»‡n dĂ¹ng reconnect + refetch sau reconnect; khĂ´ng cĂ³ polling loop Ä‘á»‹nh ká»³.

**Admin gá»­i thĂ´ng bĂ¡o â€” `POST /api/v1/admin/notifications`:**
- Targeting: `DEALERS` | `ALL_ACCOUNTS` | `ACCOUNTS` (danh sĂ¡ch ID)
- Payload: `title`, `body`, `type` (SYSTEM | PROMOTION | ORDER | WARRANTY), `link?`, `deepLink?`

**Danh sĂ¡ch WebSocket events:**

| Event | Destination | Trigger | Nháº­n bá»Ÿi |
|---|---|---|---|
| `orderStatusChanged` | `/user/queue/order-status` | Backend cáº­p nháº­t tráº¡ng thĂ¡i Ä‘Æ¡n hoáº·c payment status liĂªn quan order | Dealer |
| `notificationCreated` | `/user/queue/notifications` | Backend táº¡o notification cho user cá»¥ thá»ƒ | User Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh |
| `loginConfirmed` | `/user/queue/login-confirmed` | ÄÄƒng nháº­p thĂ nh cĂ´ng | User |
| `dealerRegistrationFromAuth` | `/topic/dealer-registrations` | Dealer Ä‘Äƒng kĂ½ má»›i | Admin (broadcast) |
| `adminNewOrder` | `/topic/admin/new-orders` | Dealer táº¡o Ä‘Æ¡n | Admin (broadcast) |
| `adminNewSupportTicket` | `/topic/admin/support-tickets` | Dealer má»Ÿ ticket | Admin (broadcast) |

> Event user-specific dĂ¹ng `convertAndSendToUser(username, ...)`. Broadcast dĂ¹ng `/topic/...`.

**API Ä‘á»c/quáº£n lĂ½ thĂ´ng bĂ¡o:**
- `GET /api/v1/dealer/notifications` â€” danh sĂ¡ch
- `PATCH /api/v1/dealer/notifications/{id}/read` â€” Ä‘Ă¡nh dáº¥u Ä‘Ă£ Ä‘á»c
- `PATCH /api/v1/dealer/notifications/{id}/unread` â€” Ä‘Ă¡nh dáº¥u chÆ°a Ä‘á»c
- `PATCH /api/v1/dealer/notifications/read-all` â€” Ä‘á»c táº¥t cáº£ (tráº£ vá» `{ "status": "updated", "updatedCount": N }`)

**Loáº¡i thĂ´ng bĂ¡o:**
- Backend `NotifyType`: `SYSTEM` | `PROMOTION` | `ORDER` | `WARRANTY`
- Dealer App `DistributorNotice`: `order` | `system` | `promotion`
- Mapping hiá»‡n táº¡i: `WARRANTY` Ä‘Æ°á»£c render nhÆ° `system` trong Dealer App

---

### 3.11 Há»— trá»£ (Support Ticket)

**Tráº¡ng thĂ¡i section:** `[Implemented]`

**MĂ n hĂ¬nh:** `SupportScreen` â€” truy cáº­p tá»« tab Account.

**Táº¡o ticket:** category (`order|warranty|product|payment|returnOrder|other`), priority (`normal|high|urgent`), subject (â‰¤ 80 kĂ½ tá»±), message (â‰¤ 500 kĂ½ tá»±).

**MĂ´ hĂ¬nh:** Má»™t chiá»u â€” dealer gá»­i 1 message, admin tráº£ lá»i qua `adminReply`. KhĂ´ng cĂ³ chat thread.

**Tráº¡ng thĂ¡i & transition há»£p lá»‡:**
- `OPEN â†’ IN_PROGRESS | CLOSED`
- `IN_PROGRESS â†’ OPEN | RESOLVED | CLOSED`
- `RESOLVED â†’ IN_PROGRESS | CLOSED`
- `CLOSED` lĂ  tráº¡ng thĂ¡i cuá»‘i

**MĂ£ ticket:** `SPT-{8 kĂ½ tá»± cuá»‘i epoch ms}` â€” tá»± Ä‘á»™ng, unique.

**ThĂ´ng bĂ¡o khi admin cáº­p nháº­t:** Dealer nháº­n in-app notification + email khi admin thay Ä‘á»•i status hoáº·c thĂªm/xĂ³a reply.

**Quy táº¯c timestamp:**
- chuyá»ƒn vá» `OPEN` hoáº·c `IN_PROGRESS` â†’ clear `resolvedAt`, `closedAt`
- chuyá»ƒn sang `RESOLVED` â†’ set `resolvedAt` náº¿u chÆ°a cĂ³, clear `closedAt`
- chuyá»ƒn sang `CLOSED` â†’ set `closedAt`; náº¿u chÆ°a cĂ³ `resolvedAt` thĂ¬ set luĂ´n

**Quy táº¯c `adminReply`:**
- `null` â†’ giá»¯ nguyĂªn reply hiá»‡n táº¡i
- chuá»—i rá»—ng / chá»‰ cĂ³ khoáº£ng tráº¯ng â†’ xĂ³a reply hiá»‡n táº¡i
- chuá»—i cĂ³ ná»™i dung â†’ thay tháº¿ reply hiá»‡n táº¡i

**LiĂªn há»‡ trá»±c tiáº¿p:** Hotline `1900 1234` Â· Email `support@4thitek.vn`

**Endpoints:**
- `POST /api/v1/dealer/support-tickets` â€” táº¡o ticket
- `GET /api/v1/dealer/support-tickets/latest` â€” ticket má»›i nháº¥t
- `GET /api/v1/dealer/support-tickets/page` â€” lá»‹ch sá»­ phĂ¢n trang
- `PATCH /api/v1/admin/support-tickets/{id}` â€” admin cáº­p nháº­t status / reply theo transition matrix á»Ÿ trĂªn

---

### 3.12 CĂ i Ä‘áº·t á»©ng dá»¥ng

- **Theme:** `light` | `dark` | `system` â€” lÆ°u trong `SharedPreferences` Ä‘Ăºng giĂ¡ trá»‹ chuá»—i. `system` theo setting thiáº¿t bá»‹.
- **NgĂ´n ngá»¯:** `vi` | `en` â€” toĂ n bá»™ UI, validation message, snackbar Ä‘á»u Ä‘Æ°á»£c dá»‹ch.

---

### 3.13 Dealer Profile & TĂ i khoáº£n

**Cáº­p nháº­t profile â€” `PUT /api/v1/dealer/profile`:** tĂªn doanh nghiá»‡p, liĂªn há»‡, Ä‘á»‹a chá»‰, avatar URL. Credit limit lĂ  readonly â€” chá»‰ admin thay Ä‘á»•i.

---

### 3.14 Quáº£n lĂ½ Admin & Staff

#### Báº¯t buá»™c Ä‘á»•i password láº§n Ä‘áº§u

`AdminPasswordChangeRequiredFilter` cháº¡y trĂªn má»i request tá»›i `/api/v1/admin/**`. Náº¿u `requirePasswordChange = true` â†’ `403 Forbidden` má»i endpoint trá»« `/api/v1/auth/**` vĂ  `PATCH /api/v1/admin/password`. Admin má»›i luĂ´n Ä‘Æ°á»£c táº¡o vá»›i flag nĂ y báº­t. Sau khi Ä‘á»•i thĂ nh cĂ´ng â†’ flag reset.

#### Quáº£n lĂ½ Staff Users (SUPER_ADMIN only)

| Endpoint | MĂ´ táº£ |
|---|---|
| `GET /api/v1/admin/users` | Liá»‡t kĂª staff users |
| `POST /api/v1/admin/users` | Táº¡o admin staff má»›i |
| `PATCH /api/v1/admin/users/{id}/status` | Báº­t / táº¯t tĂ i khoáº£n |

Khi táº¡o staff: sinh password táº¡m thá»i **12 kĂ½ tá»±** (chá»¯ hoa, chá»¯ thÆ°á»ng, sá»‘, `@#$%`; loáº¡i bá» kĂ½ tá»± dá»… nháº§m `I O 1 0`), set `requirePasswordChange = true`, gá»­i credentials qua email.

#### Bootstrap SUPER_ADMIN

Cháº¡y má»™t láº§n lĂºc startup khi `app.bootstrap-super-admin.enabled=true` vĂ  chÆ°a cĂ³ SUPER_ADMIN trong DB. Táº¡o tĂ i khoáº£n tá»« env vars (`email`, `password`, `name`; default name: *"System Owner"*) vá»›i cáº£ hai role `ADMIN` + `SUPER_ADMIN`, `requirePasswordChange = true`. Idempotent.

#### Audit Logging

`AdminAuditLoggingAspect` tá»± Ä‘á»™ng ghi log má»i mutation (`POST/PUT/PATCH/DELETE`) trong `/api/v1/admin/**`.

ThĂ´ng tin ghi: `actor`, `actorRole`, `action` (create|update|delete|changePassword|import|createNotification), `method`, `path`, `ip`, `payload` (sanitized), `entityType`.

> Audit log hiá»‡n lĂ  behavior á»Ÿ backend; chÆ°a cĂ³ mĂ n hĂ¬nh riĂªng hoáº·c read API riĂªng trong `admin-fe` Ä‘á»ƒ xem danh sĂ¡ch audit log.

---

### 3.15 Quáº£n lĂ½ Äáº¡i lĂ½ (Admin)

**Tráº¡ng thĂ¡i section:** `[Implemented]` cho lifecycle account hiá»‡n táº¡i. `[Policy]` cho viá»‡c chá»‰ dealer `ACTIVE` má»›i dĂ¹ng Ä‘Æ°á»£c portal vĂ  asset private.

| Endpoint | MĂ´ táº£ |
|---|---|
| `GET /api/v1/admin/dealers/accounts` | Danh sĂ¡ch dealer |
| `GET /api/v1/admin/dealers/accounts/page` | PhĂ¢n trang |
| `PUT /api/v1/admin/dealers/accounts/{id}` | Cáº­p nháº­t profile dealer |
| `PATCH /api/v1/admin/dealers/accounts/{id}/status` | Báº­t/táº¯t account, cáº­p nháº­t credit limit |

**VĂ²ng Ä‘á»i tĂ i khoáº£n dealer:**
```
UNDER_REVIEW â”€â”€â–º ACTIVE
             â””â”€â”€â–º SUSPENDED
```

Admin duyá»‡t â†’ `ACTIVE`; táº¡m khĂ³a â†’ `SUSPENDED`. Admin cáº­p nháº­t `creditLimit` Ä‘á»™c láº­p hoáº·c cĂ¹ng lĂºc Ä‘á»•i status.

**Email lifecycle:** ÄÄƒng kĂ½ má»›i â†’ gá»­i email nháº­n há»“ sÆ¡. Thay Ä‘á»•i status â†’ gá»­i email + in-app notification. Táº¥t cáº£ email gá»­i async (`@Async("mailTaskExecutor")`) â€” lá»—i email khĂ´ng block transaction.

**Quy táº¯c truy cáº­p portal (`assertDealerPortalAccess`):**
- Chỉ `status = ACTIVE` được đăng nhập, refresh token, gọi dealer API, kích hoạt bảo hành, và thao tác asset riêng của dealer (`dealer-avatars`, `payment-proofs`)
- `UNDER_REVIEW` → `401` với message *"Tài khoản đang chờ duyệt..."* ở login, refresh, và dealer API
- `SUSPENDED` → `401` với message tương ứng ở login, refresh, và dealer API
- `null status` táº¡m coi lĂ  `ACTIVE` Ä‘á»ƒ tÆ°Æ¡ng thĂ­ch dá»¯ liá»‡u cÅ©; báº£n ghi má»›i pháº£i cĂ³ status rĂµ rĂ ng
- Kiá»ƒm tra táº¡i: `DealerController`, `WarrantyActivationController`, `UploadController` (Ä‘á»‘i vá»›i asset private cá»§a dealer)

---

### 3.16 Blog & Ná»™i dung tÄ©nh

#### Admin â€” Quáº£n lĂ½ Blog

| Endpoint | MĂ´ táº£ |
|---|---|
| `GET/POST /api/v1/admin/blogs` | Danh sĂ¡ch / Táº¡o bĂ i viáº¿t |
| `PUT /api/v1/admin/blogs/{id}` | Cáº­p nháº­t |
| `DELETE /api/v1/admin/blogs/{id}` | XĂ³a |
| `GET /api/v1/admin/categories` | Danh má»¥c |

**Tráº¡ng thĂ¡i bĂ i viáº¿t:** `DRAFT` (báº£n nhĂ¡p) â†’ `SCHEDULED` (lĂªn lá»‹ch) â†’ `PUBLISHED` (public)

#### Public Blog API (khĂ´ng cáº§n auth)

| Endpoint | MĂ´ táº£ |
|---|---|
| `GET /api/v1/blog/blogs/latest` | BĂ i viáº¿t má»›i nháº¥t (homepage) |
| `GET /api/v1/blog/blogs` | Táº¥t cáº£ bĂ i viáº¿t |
| `GET /api/v1/blog/blogs/search` | TĂ¬m kiáº¿m |
| `GET /api/v1/blog/blogs/related/{id}` | BĂ i viáº¿t liĂªn quan |
| `GET /api/v1/blog/categories` | Danh má»¥c |
| `GET /api/v1/blog/categories/{id}/blogs` | BĂ i viáº¿t theo danh má»¥c |
| `GET /api/v1/blog/{id}` | Chi tiáº¿t |

#### Public Content API (Ná»™i dung tÄ©nh)

`GET /api/v1/content/{section}?lang=vi|en` â€” tráº£ vá» ná»™i dung tÄ©nh (FAQ, Vá» chĂºng tĂ´i, ChĂ­nh sĂ¡ch...). Máº·c Ä‘á»‹nh `lang=vi`. KhĂ´ng cáº§n auth.

---

### 3.17 Public Website API

**Public Warranty Check â€” `GET /api/v1/warranty/check/{serial}`**

Public, rate limit 30 req/60s. Serial normalize (trim + uppercase) trÆ°á»›c khi lookup. Káº¿t quáº£ cache `PUBLIC_WARRANTY_LOOKUP`.

```
WarrantyLookupResponse {
  status: ACTIVE | EXPIRED | VOID | invalid  // invalid = chÆ°a kĂ­ch hoáº¡t hoáº·c khĂ´ng tá»“n táº¡i
  productName, serialNumber, purchaseDate, warrantyEndDate,
  remainingDays,   // 0 náº¿u háº¿t háº¡n
  warrantyCode
}
```

**Dealer listing (public):**
- `GET /api/v1/user/dealer` â€” danh sĂ¡ch dealer
- `GET /api/v1/user/dealer/page` â€” phĂ¢n trang

---

### 3.18 Dashboard & CĂ i Ä‘áº·t há»‡ thá»‘ng (Admin)

**Admin Dashboard â€” `GET /api/v1/admin/dashboard`**

Tá»•ng há»£p sá»‘ liá»‡u váº­n hĂ nh: sá»‘ dealer `UNDER_REVIEW`, thá»‘ng kĂª Ä‘Æ¡n hĂ ng, doanh thu. Káº¿t quáº£ cache `ADMIN_DASHBOARD`.

**System Settings:**
- `GET /api/v1/admin/settings` â€” Ä‘á»c cĂ i Ä‘áº·t
- `PUT /api/v1/admin/settings` â€” cáº­p nháº­t (SePay config, `emailConfirmation`, `sessionTimeoutMinutes`, `orderAlerts`, `inventoryAlerts`, email settings, rate limit overrides...)

**Cache invalidation:**

| Cache | Bá»‹ clear khi |
|---|---|
| `ADMIN_DASHBOARD` | Dealer Ä‘Äƒng kĂ½ má»›i, admin cáº­p nháº­t dealer status, dealer táº¡o Ä‘Æ¡n, discount rule táº¡o má»›i |
| `PUBLIC_PRODUCTS`, `PUBLIC_PRODUCT_BY_ID`, `PUBLIC_FEATURED_PRODUCTS`, `PUBLIC_HOMEPAGE_PRODUCTS` | Admin táº¡o/cáº­p nháº­t sáº£n pháº©m |
| `PUBLIC_WARRANTY_LOOKUP` | Warranty táº¡o/cáº­p nháº­t/xĂ³a (activation, CRUD, admin status change) |

---

### 3.19 Xuáº¥t bĂ¡o cĂ¡o (Admin)

**Tráº¡ng thĂ¡i section:** `[Implemented]`

**`GET /api/v1/admin/reports/export`**

| Param | GiĂ¡ trá»‹ |
|---|---|
| `type` | `ORDERS` \| `REVENUE` \| `WARRANTIES` \| `SERIALS` |
| `format` | `XLSX` \| `PDF` |

**Response:** stream file binary trá»±c tiáº¿p (`Content-Disposition: attachment`) vá»›i `Content-Type` phĂ¹ há»£p Ä‘á»‹nh dáº¡ng; frontend táº£i báº±ng blob, khĂ´ng bá»c `ApiResponse`.

---

### 3.20 Upload & LÆ°u trá»¯ File

**Tráº¡ng thĂ¡i section:** `[Implemented]`

**Upload endpoints:**

| Endpoint | Role | Má»¥c Ä‘Ă­ch |
|---|---|---|
| `POST /api/v1/upload/products` | ADMIN, SUPER_ADMIN | áº¢nh sáº£n pháº©m |
| `POST /api/v1/upload/blogs` | ADMIN, SUPER_ADMIN | áº¢nh bĂ i viáº¿t |
| `POST /api/v1/upload/avatars` | ADMIN, SUPER_ADMIN | Avatar admin |
| `POST /api/v1/upload/dealer-avatars` | DEALER, ADMIN, SUPER_ADMIN | Avatar dealer |
| `POST /api/v1/upload/payment-proofs` | DEALER, ADMIN, SUPER_ADMIN | Chá»©ng tá»« thanh toĂ¡n |
| `DELETE /api/v1/upload?url=...` | DEALER, ADMIN, SUPER_ADMIN | XĂ³a file |
| `GET /api/v1/upload/**` | Public á»Ÿ táº§ng security; controller sáº½ chá»‰ cho Ä‘á»c cĂ´ng khai vá»›i `products/`, `blogs/`, cĂ²n path private bá»‹ cháº·n theo auth/ownership | Äá»c asset |

**Path scoping theo actor:**

| Category | Admin | Dealer |
|---|---|---|
| `avatars` | `avatars/{adminId}/` | â€” |
| `dealer-avatars` | `avatars/dealers/{adminId}/` | `avatars/dealers/{dealerId}/` |
| `payment-proofs` | `payments/proofs/{adminId}/` | `payments/proofs/dealers/{dealerId}/` |
| `products`, `blogs` | `products/`, `blogs/` | â€” |

**Quyá»n xĂ³a:**
- `products/`, `blogs/` â†’ chá»‰ ADMIN/SUPER_ADMIN
- `avatars/dealers/`, `payments/proofs/` â†’ admin xĂ³a má»i file; dealer chá»‰ xĂ³a file trong folder cá»§a mĂ¬nh
- Response: `{ "status": "deleted", "path": "..." }`

**RĂ ng buá»™c lifecycle dealer:**
- Dealer chá»‰ upload / Ä‘á»c / xĂ³a asset riĂªng cá»§a mĂ¬nh khi `status = ACTIVE`
- `UNDER_REVIEW` / `SUSPENDED` bá»‹ cháº·n giá»‘ng dealer portal
- Admin/SUPER_ADMIN khĂ´ng bá»‹ rĂ ng buá»™c bá»Ÿi lifecycle dealer khi há»— trá»£ xá»­ lĂ½ há»“ sÆ¡ / chá»©ng tá»«

**Serve file tÄ©nh â€” `GET /uploads/{*path}`:**
- Public, Cache-Control `max-age=31536000` (365 ngĂ y)
- Chá»‰ serve Ä‘Æ°á»£c asset public `products/` vĂ  `blogs/`
- Chá»‰ active khi `app.storage.provider=s3`

---

### 3.21 Rate Limiting

**Tráº¡ng thĂ¡i section:** `[Implemented]`

CÆ¡ cháº¿ sliding window in-memory theo client key. Cleanup job cháº¡y má»—i **5 phĂºt** (cáº¥u hĂ¬nh qua `app.rate-limit.cleanup-interval-ms`), grace period **300 giĂ¢y**.

**XĂ¡c Ä‘á»‹nh client key:**
- máº·c Ä‘á»‹nh dĂ¹ng `remoteAddr`
- chá»‰ trust `X-Forwarded-For` khi `app.rate-limit.trust-forwarded-for=true`
- phĂ¹ há»£p nháº¥t cho single-instance; náº¿u scale multi-instance cáº§n shared store hoáº·c gateway rate-limit phĂ­a trÆ°á»›c

| Endpoint | Giá»›i háº¡n |
|---|---|
| `POST /api/v1/auth/login` | 10 req / 60s |
| `POST /api/v1/auth/forgot-password` | 5 req / 300s |
| `GET /api/v1/warranty/check/{serial}` | 30 req / 60s |
| `POST /api/v1/upload/**` | 20 req / 60s |
| `POST /api/v1/webhooks/sepay` | 120 req / 60s |

VÆ°á»£t ngÆ°á»¡ng â†’ `429 Too Many Requests`.

---

## 4. User Flow

### 4.1 Äáº·t hĂ ng

```
ÄÄƒng nháº­p â†’ Duyá»‡t sáº£n pháº©m â†’ ThĂªm vĂ o giá» â†’ Kiá»ƒm tra giá» & chiáº¿t kháº¥u â†’ Nháº­p thĂ´ng tin ngÆ°á»i nháº­n
â†’ Chá»n thanh toĂ¡n:
    [Chuyá»ƒn khoáº£n] Sao chĂ©p thĂ´ng tin NH â†’ Chuyá»ƒn tiá»n â†’ SePay tá»± xĂ¡c nháº­n â†’ Dealer App cáº­p nháº­t order state; náº¿u Ä‘ang má»Ÿ bank-transfer sheet thĂ¬ sheet tá»± Ä‘Ă³ng, náº¿u Ä‘ang á»Ÿ mĂ n thĂ nh cĂ´ng thĂ¬ tráº¡ng thĂ¡i hiá»ƒn thá»‹ Ä‘á»•i sang Ä‘Ă£ thanh toĂ¡n
    [Ghi ná»£] XĂ¡c nháº­n â†’ ÄÆ¡n ghi ná»£ ngay
â†’ ÄÆ¡n táº¡o thĂ nh cĂ´ng (PENDING)
```

### 4.2 Thanh toĂ¡n cĂ´ng ná»£

```
Dashboard â†’ Shortcut "CĂ´ng ná»£" â†’ Chá»n Ä‘Æ¡n cĂ²n ná»£ â†’ Ghi nháº­n thanh toĂ¡n (sá»‘ tiá»n, kĂªnh, chá»©ng tá»«)
â†’ Backend validate request
â†’ Payment Ä‘Æ°á»£c ghi nháº­n thĂ nh cĂ´ng
â†’ paidAmount tÄƒng
â†’ outstandingAmount giáº£m ngay
â†’ outstandingAmount = 0 â†’ Ä‘Æ¡n biáº¿n máº¥t khá»i danh sĂ¡ch ná»£
```

### 4.3 KĂ­ch hoáº¡t báº£o hĂ nh

```
[Admin] ÄÆ¡n â†’ COMPLETED â†’ Serial vĂ o kho dealer
[Dealer] Scan/nháº­p serial â†’ Há»‡ thá»‘ng validate serial Ä‘á»§ Ä‘iá»u kiá»‡n
â†’ Dealer nháº­p thĂ´ng tin khĂ¡ch + chá»n ngĂ y mua â†’ XĂ¡c nháº­n â†’ Báº£o hĂ nh kĂ­ch hoáº¡t
â†’ KhĂ´ng cĂ³ bÆ°á»›c xuáº¥t PDF/Excel trong Dealer App hiá»‡n táº¡i
```

### 4.4 Admin duyá»‡t Ä‘Æ¡n

```
Xem Ä‘Æ¡n PENDING â†’ Duyá»‡t (CONFIRMED) â†’ Chuáº©n bá»‹ hĂ ng (SHIPPING) â†’ Giao xong (COMPLETED)
â†’ Há»‡ thá»‘ng push WebSocket vá» Dealer App
```

---

## 5. Edge Cases

### 5.1 Thanh toĂ¡n

| TrÆ°á»ng há»£p | Xá»­ lĂ½ |
|---|---|
| `amount = 0` | `@DecimalMin(0.01)` tá»« chá»‘i táº¡i request level |
| `amount > outstandingAmount` | Hard block â€” `BadRequestException` |
| `outstandingAmount = 0` | Client áº©n nĂºt; server cháº·n cá»©ng `BadRequestException` |
| TrĂ¹ng láº·p (cĂ¹ng orderId + amount trong 5s) | Tá»« chá»‘i â€” `ConflictException` |
| Dealer ghi payment thĂ nh cĂ´ng | CĂ³ hiá»‡u lá»±c ngay, `outstandingAmount` giáº£m tá»©c thĂ¬ |
| ÄÆ¡n `BANK_TRANSFER` khi `sepay.enabled = true` | Dealer khĂ´ng tá»± ghi payment; chá» SePay hoáº·c admin override |

### 5.2 Serial & Báº£o hĂ nh

| TrÆ°á»ng há»£p | Xá»­ lĂ½ |
|---|---|
| Serial Ä‘Ă£ kĂ­ch hoáº¡t | Tá»« chá»‘i, lá»—i "serial Ä‘Ă£ kĂ­ch hoáº¡t" |
| Serial khĂ´ng thuá»™c kho dealer | Tá»« chá»‘i â€” validation error |
| Serial đã tồn tại khi admin import | Không fail cả request; item đó bị skip và trả reason trong summary response |
| ÄÆ¡n liĂªn káº¿t chÆ°a `COMPLETED` | Tá»« chá»‘i (`PENDING`, `CONFIRMED`, `SHIPPING` Ä‘á»u bá»‹ tá»« chá»‘i) |
| ThĂ´ng tin khĂ¡ch hĂ ng trá»‘ng | Backend chá»‰ fallback `name/phone/address` tá»« receiver info náº¿u request thiáº¿u; Dealer App hiá»‡n váº«n yĂªu cáº§u dealer nháº­p Ä‘á»§ 4 trÆ°á»ng trĂªn form |
| `ImportedSerialRecord` Ä‘Ă£ tá»“n táº¡i | Bá» qua, giá»¯ nguyĂªn `warehouseId` gá»‘c |

### 5.3 ÄÆ¡n hĂ ng

| TrÆ°á»ng há»£p | Xá»­ lĂ½ |
|---|---|
| Pool serial `AVAILABLE` không đủ | Từ chối tạo đơn, kể cả khi `Product.stock` cũ đang lệch lớn hơn thực tế |
| Sáº£n pháº©m bá»‹ xĂ³a sau khi vĂ o giá» | Lá»—i khi checkout, yĂªu cáº§u xĂ³a item |
| Há»§y Ä‘Æ¡n | Serial `RESERVED â†’ AVAILABLE` (xem quy táº¯c táº¡i [3.4](#34-Ä‘áº·t-hĂ ng--thanh-toĂ¡n)) |
| Reorder Ä‘Æ¡n cÅ© | ThĂªm vĂ o giá», snackbar "ÄĂ£ thĂªm X sáº£n pháº©m, bá» qua Y (háº¿t hĂ ng)" |

### 5.4 Giá» hĂ ng

| TrÆ°á»ng há»£p | Xá»­ lĂ½ |
|---|---|
| Offline / lá»—i máº¡ng | Rollback optimistic update, hiá»‡n lá»—i |
| Mutation version conflict | Giá»¯ version cao nháº¥t |
| Token háº¿t háº¡n khi thao tĂ¡c | Trigger refresh, retry sau khi cĂ³ token má»›i |

### 5.5 Giao diá»‡n & CĂ i Ä‘áº·t

| TrÆ°á»ng há»£p | Xá»­ lĂ½ |
|---|---|
| `DateTime` thĂ¡ng 13+ | `DateTime(year, month + n, ...)` tá»± overflow sang nÄƒm sau |
| Snackbar khi widget Ä‘Ă£ unmount | Check `!mounted` trÆ°á»›c `ScaffoldMessenger` |
| Snackbar tá»« `didChangeDependencies` | DĂ¹ng `addPostFrameCallback` (`_showSnackBarDeferred`) |
| Theme `system` | LÆ°u chuá»—i `'system'` â€” khĂ´ng lÆ°u sai thĂ nh `'light'` |

---

## 6. So sĂ¡nh ná»n táº£ng

### Dealer App vs Admin Dashboard

| TĂ­nh nÄƒng | Dealer App | Admin Dashboard |
|---|---|---|
| Xem Ä‘Æ¡n hĂ ng | Chá»‰ Ä‘Æ¡n cá»§a mĂ¬nh | ToĂ n bá»™ |
| Thay Ä‘á»•i tráº¡ng thĂ¡i Ä‘Æ¡n | Há»§y (`PENDING`/`CONFIRMED` only) | PENDINGâ†’CONFIRMEDâ†’SHIPPINGâ†’COMPLETED, hoáº·c há»§y |
| Ghi nháº­n thanh toĂ¡n | Dealer tá»± ghi payment cho Ä‘Æ¡n cĂ²n ná»£; bank transfer tá»± Ä‘á»™ng qua SePay | Admin ghi trá»±c tiáº¿p/override; bank transfer tá»± Ä‘á»™ng qua SePay |
| Quáº£n lĂ½ sáº£n pháº©m | Chá»‰ Ä‘á»c | CRUD Ä‘áº§y Ä‘á»§ |
| Quáº£n lĂ½ serial | Xem kho + kĂ­ch hoáº¡t báº£o hĂ nh + cáº­p nháº­t status | Import, xem táº¥t cáº£, cáº­p nháº­t status, xĂ³a |
| ThĂ´ng bĂ¡o | WebSocket + in-app sync | Topic admin WebSocket + dashboard |
| NgĂ´n ngá»¯ | VI / EN (user chá»n) | VI / EN (`LanguageSwitcher`) |
| Audit log | KhĂ´ng | CĂ³ á»Ÿ backend cho má»i mutation admin; chÆ°a cĂ³ mĂ n hĂ¬nh riĂªng |

### Main Website vs Dealer App

| TĂ­nh nÄƒng | Main Website (Next.js) | Dealer App (Flutter) |
|---|---|---|
| Äá»‘i tÆ°á»£ng | KhĂ¡ch hĂ ng public, SEO | Äáº¡i lĂ½ Ä‘Ă£ xĂ¡c thá»±c |
| Xem sáº£n pháº©m | CĂ³ (ISR, cached) | CĂ³ (live API) |
| Äáº·t hĂ ng | KhĂ´ng | CĂ³ |
| Auth | KhĂ´ng báº¯t buá»™c | Báº¯t buá»™c (JWT) |

---

## 7. Giáº£ Ä‘á»‹nh Chuáº©n & Pending Decisions

### 7.1 Giáº£ Ä‘á»‹nh chuáº©n hiá»‡n táº¡i

1. **Má»™t Ä‘Æ¡n = má»™t warehouse** â€” khĂ´ng há»— trá»£ láº¥y hĂ ng tá»« nhiá»u kho.
2. **GiĂ¡ snapshot táº¡i thá»i Ä‘iá»ƒm Ä‘áº·t** â€” khĂ´ng cĂ³ cÆ¡ cháº¿ cáº­p nháº­t giĂ¡ Ä‘Æ¡n cÅ©.
3. **VAT = 10% cá»‘ Ä‘á»‹nh** â€” policy cĂ´ng ty, Ă¡p dá»¥ng Ä‘á»“ng nháº¥t má»i sáº£n pháº©m.
4. **`shippingFee = 0` cá»‘ Ä‘á»‹nh** â€” policy cĂ´ng ty, khĂ´ng thu phĂ­ giao hĂ ng qua há»‡ thá»‘ng.
5. **Má»™t serial = má»™t láº§n kĂ­ch hoáº¡t** â€” khĂ´ng há»— trá»£ chuyá»ƒn báº£o hĂ nh.
6. **Thanh toĂ¡n tá»± Ä‘á»™ng qua SePay** â€” bank transfer tá»± xĂ¡c nháº­n khi webhook khá»›p; dealer payment cho Ä‘Æ¡n cĂ²n ná»£ cĂ³ hiá»‡u lá»±c ngay khi ghi nháº­n thĂ nh cĂ´ng; admin cĂ³ thá»ƒ ghi override.
7. **CĂ´ng ná»£ khĂ´ng tĂ­nh lĂ£i** â€” `outstandingAmount` khĂ´ng thay Ä‘á»•i theo thá»i gian.

### 7.2 Pending Decisions / ChÆ°a lĂ  source of truth

> CĂ¡c má»¥c dÆ°á»›i Ä‘Ă¢y **khĂ´ng pháº£i contract production hiá»‡n hĂ nh**. ÄĂ¢y lĂ  backlog nghiá»‡p vá»¥ hoáº·c cĂ¢u há»i má»Ÿ cáº§n chá»‘t riĂªng trÆ°á»›c khi triá»ƒn khai.

| Äiá»ƒm | Hiá»‡n tráº¡ng | Cáº§n lĂ m rĂµ |
|---|---|---|
| Admin override giĂ¡ | Order cĂ³ `subtotalOverride`, `vatOverride`, `totalOverride` | Ai Ä‘Æ°á»£c override, khi nĂ o, flow ra sao? |
| `paymentStatus` vs `status` | Hai field Ä‘á»™c láº­p (vĂ­ dá»¥: `paymentStatus=PAID` nhÆ°ng `status=PENDING`) | Cáº§n document quan há»‡ vĂ  cĂ¡c tá»• há»£p há»£p lá»‡ |
| Warranty transfer | KhĂ´ng cĂ³ tĂ­nh nÄƒng | CĂ³ cáº§n há»— trá»£ chuyá»ƒn báº£o hĂ nh sang chá»§ má»›i khĂ´ng? |
| Serial `DEFECTIVE` / `RETURNED` khĂ´ng cĂ³ lá»‘i ra | KhĂ´ng cĂ³ endpoint reset vá» `AVAILABLE` â€” serial bá»‹ treo vÄ©nh viá»…n | Cáº§n bá»• sung flow admin reset + quy trĂ¬nh RMA |
| Serial `RESERVED` khĂ´ng cĂ³ timeout | Serial `RESERVED` vĂ´ thá»i háº¡n náº¿u admin khĂ´ng duyá»‡t/há»§y Ä‘Æ¡n â†’ dealer khĂ¡c khĂ´ng Ä‘áº·t Ä‘Æ°á»£c | CĂ¢n nháº¯c: auto-há»§y Ä‘Æ¡n PENDING quĂ¡ X giá»; hoáº·c cáº£nh bĂ¡o admin |
| Support ticket SLA | KhĂ´ng cĂ³ timeout/SLA | Cáº§n bá»• sung náº¿u cam káº¿t thá»i gian pháº£n há»“i |
| Tráº¡ng thĂ¡i `RESERVED` | `RESERVED` váº«n cĂ³ Ă½ nghÄ©a Ä‘á»ƒ phĂ¢n biá»‡t serial Ä‘Ă£ giá»¯ cho Ä‘Æ¡n nhÆ°ng chÆ°a giao vá»›i serial Ä‘Ă£ vĂ o kho dealer (`ASSIGNED`) | Chá»‰ nĂªn cĂ¢n nháº¯c bá» náº¿u thiáº¿t káº¿ láº¡i toĂ n bá»™ inventory allocation + order lifecycle |
| Bulk discount + product-specific rule cĂ¹ng match | Code Æ°u tiĂªn product-specific | Cáº§n confirm Ä‘Ă¢y lĂ  business decision hay chá»‰ lĂ  implementation default |
| Payment verification workflow | Production hiá»‡n táº¡i cho payment dealer cĂ³ hiá»‡u lá»±c ngay sau khi ghi nháº­n thĂ nh cĂ´ng | Náº¿u muá»‘n thĂªm `PENDING_VERIFICATION` / `CONFIRMED` / `REJECTED`, pháº£i thiáº¿t káº¿ láº¡i API/DB/UI vĂ  cáº­p nháº­t toĂ n bá»™ flow |
| SePay partial payment | Hiá»‡n táº¡i chá»‰ cháº¥p nháº­n sá»‘ tiá»n Ä‘Ăºng báº±ng `outstandingAmount` | Cáº§n xĂ¡c nháº­n cĂ³ há»— trá»£ chuyá»ƒn khoáº£n thiáº¿u / nhiá»u láº§n / dÆ° tiá»n hay khĂ´ng |

---

*Cáº­p nháº­t: 2026-03-22 â€” Chuyá»ƒn tĂ i liá»‡u sang format source-of-truth cĂ³ nhĂ£n `Implemented / Policy / Pending Decision`; Ä‘á»“ng bá»™ láº¡i payment, support, dealer upload access, report export, rate limit vá»›i runtime behavior hiá»‡n táº¡i.*
