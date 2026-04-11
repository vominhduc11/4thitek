# Payment Guardrails

## Muc Dich

Tai lieu nay khoa hanh vi agent khi lam viec voi domain thanh toan chuyen khoan hien tai cua du an 4thitek. Muc tieu la bao ve flow dang hoat dong dung, tranh moi thay doi vo tinh lam sai payment, webhook, doi soat don hang, hoac cac lien ket nghiep vu nhay cam lien quan.

Logic thanh toan chuyen khoan hien tai duoc xem la dung va phai duoc giu nguyen, tru khi co yeu cau nghiep vu ro rang, du thong tin, va co phe duyet minh bach tu nguoi dung.

## Pham Vi Nhay Cam

Nhung khu vuc duoi day duoc xem la nhay cam va phai ap dung guardrails nghiem ngat:

- Payment va payment status
- Webhook ngan hang / SePay / callback xu ly giao dich
- Token, secret, API key, webhook token, masked secret metadata
- Order-payment linkage, order code extraction, transaction matching
- Outstanding amount, debt, receivable, amount mismatch, duplicate transaction
- Unmatched payment, manual reconciliation, audit logging
- Inventory, serial ownership, dealer ownership, order ownership neu co lien quan den payment settlement
- Warranty, activation, ownership transfer neu bat dau tu trang thai payment hoac order

## Core Invariants Khong Duoc Pha

- Khong thay doi business rule thanh toan chuyen khoan hien tai neu khong co yeu cau ro rang.
- Khong thay doi contract payment, webhook, hay settings secret bang suy doan.
- Khong tu y thay doi thu tu uu tien cua cac nguon auth webhook.
- Khong duoc log token raw, secret raw, hay du lieu nhay cam co the dung de gia mao webhook.
- Khong duoc tra secret raw trong API response, UI state, toast, audit log, debug log, hay test fixture production-like.
- Khong duoc pha vo lien ket giua order, payment, transaction code, unmatched payment, va audit trail.
- Khong duoc tu y thay doi tieu chi match order code, amount, duplicate transaction, already settled, cancelled order, unsupported payment method.
- Khong duoc tao side effect len inventory, ownership, warranty, hoac debt ledger khi chua xac minh day du nghiep vu lien ket.
- Khong duoc coi placeholder, masked value, hay display metadata la source of truth de ghi de secret.

## Forbidden Changes

Agent khong duoc tu y thuc hien cac thay doi sau:

- Refactor payment flow chi vi "trong dep hon" hoac "de hieu hon".
- Chuyen doi contract webhook, payment, admin settings secret, hoac audit logging ma khong co yeu cau cu the.
- Noi long validation amount, duplicate transaction, order code matching, token validation, hoac auth precedence.
- Them auto-fallback, auto-retry, auto-heal, auto-sync business data ma khong co phe duyet ro rang.
- Tu y doi message, status, enum, reason code, hay response shape ma co the anh huong monitoring, FE, hoac reconciliation.
- Tu y "cai thien UX" trong khu vuc payment neu co the an thay nghiep vu that.
- Thay doi masking rule, secret rotation flow, hoac cache invalidation lien quan payment/settings secret khi chua duoc yeu cau.
- Gop, tach, doi ten, hoac xoa endpoint payment/webhook/settings secret vi ly do refactor.
- Sua test de hop thuc hoa behavior moi neu behavior cu la core invariant da duoc xac nhan dung.

## Quy Trinh Bat Buoc Truoc Khi Sua Vung Payment

Truoc moi thay doi lien quan payment, agent bat buoc:

1. Xac dinh chinh xac yeu cau la bug fix, contract change, hay chi bo sung logging/tai lieu.
2. Doc day du cac file lien quan truc tiep:
   - service
   - controller
   - DTO/request/response
   - repository/entity
   - exception handler
   - test hien co
3. Liet ke ro invariant dang ton tai truoc khi de xuat thay doi.
4. Kiem tra thay doi co anh huong den:
   - webhook auth
   - order matching
   - payment status
   - unmatched payments
   - admin settings secrets
   - audit logging
5. Tim bang chung tu code, test, log, hoac du lieu schema. Khong suy doan thay cho xac minh.
6. Neu can thay doi contract hoac business rule, dung lai va xin xac nhan tu nguoi dung truoc khi sua.
7. Neu duoc phep sua, uu tien fix toi thieu, giu nguyen behavior da xac nhan dung, va bo sung test bao ve regression.

## Stop Conditions

Agent phai dung lai va hoi lai nguoi dung neu gap bat ky tinh huong nao sau day:

- Nghiep vu mo ho giua "bug" va "chu y muon doi rule".
- Khong ro mot status/payment state co dang duoc downstream system su dung hay khong.
- Khong ro order code parsing rule co duoc phep noi long hay khong.
- Khong ro amount mismatch nen reject, hold, hay auto-apply.
- Phat hien lien ket voi debt/receivable, inventory ownership, warranty ownership, hoac manual reconciliation nhung chua co dac ta.
- Can thay doi API contract, DB schema, enum, cache semantics, hoac audit semantics.
- Test va code mau thuan nhau nhung chua xac dinh duoc cai nao la source of truth.

## Output Expectation Cho Cac Task Tuong Lai Lien Quan Payment

Khi xu ly task lien quan payment, agent phai tra loi theo huong sau:

- Neu chi review: uu tien neu bug/risk/regression, khong de xuat refactor lan man.
- Neu chi logging/debug: noi ro nhanh flow dang dung o nhanh nao va bang chung la gi.
- Neu fix code: mo ta invariant duoc giu nguyen, thay doi toi thieu o dau, va test nao bao ve.
- Neu de xuat contract change: danh dau ro la breaking hay non-breaking va doi xac nhan truoc khi lam.
- Luon neu ro nhung gi KHONG thay doi trong payment flow.
- Khong tu y mo rong scope sang cai thien nghiep vu, UX, hay data model neu nguoi dung khong yeu cau.

## Nguyen Tac Mac Dinh

Neu khong co chi dao ro rang va day du, mac dinh an toan la:

- khong sua payment logic
- khong sua webhook logic
- khong sua auth precedence
- khong sua order-payment matching
- khong sua secret handling
- chi tai lieu hoa, logging them, hoac viet test bao ve neu duoc phep
