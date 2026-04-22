# SePay Webhook Guide

## 1) Required Environment Variables

Bat buoc khi dung SePay:

- `SEPAY_ENABLED=true`
- `SEPAY_WEBHOOK_TOKEN=<strong-random-token>`
- `SEPAY_BANK_NAME`
- `SEPAY_ACCOUNT_NUMBER`
- `SEPAY_ACCOUNT_HOLDER`

Khuyen nghi:

- rotate token dinh ky
- log masking cho token

## 2) Token Setup

1. Tao token manh (vi du `openssl rand -hex 32`).
2. Cap nhat token trong `.env`.
3. Restart backend de load config moi.
4. Cap nhat token giong het tren SePay dashboard webhook config.

## 3) Test Webhook

Checklist test:

1. Tao 1 order pending.
2. Gui test webhook payload hop le (transaction code + amount + content).
3. Xac minh payment duoc ghi nhan va order state update dung.
4. Thu gui payload sai token, ky vong bi tu choi.
5. Thu gui lai cung payload, ky vong khong tao duplicate side effects.

## 4) Duplicate Handling

Backend can xu ly idempotent cho transaction code:

- Cung transaction code khong duoc tao payment moi nhieu lan.
- Log su kien duplicate de audit.
- Khong cap nhat order state lap lai neu da xu ly xong.

## 5) Ly do unmatched payment thuong gap

- Noi dung chuyen khoan khong co order code hop le.
- Sai amount so voi expected.
- Transaction den truoc khi order duoc tao/confirm.
- Webhook bi retry sau khi order da dong.
- Timezone/clock drift gay so sanh sai cua so thoi gian.

## 6) Reconciliation / Admin Review Flow

1. Theo doi danh sach `unmatched_payments`.
2. Phan loai theo reason.
3. Doi chieu voi order/payment records.
4. Neu hop le, manual reconcile va gan matched order.
5. Luu ghi chu dieu tra + nguoi xu ly.

## 7) Security Checklist

- Bat buoc verify webhook token moi request.
- Rate-limit webhook endpoint.
- Log request id + source metadata, khong log full secret.
- Chay backend sau reverse proxy tin cay, cau hinh forwarded headers dung.
- Review quyen admin cho chuc nang reconcile.
- Kiem tra alerts khi unmatched tang dot bien.
