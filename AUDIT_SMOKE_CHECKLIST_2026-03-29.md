# Audit Smoke Checklist (2026-03-29)

Use this checklist for manual regression after the audit-alignment changes.

## Pricing And VAT

- Update `Admin Settings -> VAT` to a non-default value (for example `8`).
- In Dealer App, open cart and confirm `/dealer/cart/summary`-backed totals show the same VAT percent and amount.
- Create one `BANK_TRANSFER` order and one `DEBT` order; confirm backend responses use the configured VAT.
- In Admin Dashboard and report export, confirm totals reflect the same VAT setting.

## Transition Authority

- Open one order in Admin FE and confirm action buttons come from backend `allowedTransitions`.
- Attempt one invalid order transition via API or UI and confirm backend rejects it.
- Open one dealer account in Admin FE and confirm account status actions follow backend `allowedTransitions`.

## Settlement And Unmatched Payment

- Cancel an order with `paidAmount > 0` and confirm a `FinancialSettlement` is created with type `CANCELLATION_REFUND`.
- Let or simulate a stale pending paid order and confirm a `FinancialSettlement` is created with type `STALE_ORDER_REVIEW`.
- Resolve one settlement and confirm `resolution`, `resolvedBy`, and `resolvedAt` are persisted.
- Resolve one unmatched payment as `MATCHED` and confirm:
  - `matchedOrderId` is stored
  - a real `Payment` record is created
  - order `paidAmount` and `paymentStatus` are recalculated
- Resolve one unmatched payment as `REFUNDED` or `WRITTEN_OFF` and confirm terminal status is persisted.

## Reporting

- Soft-delete one order, export orders report, and confirm the deleted order is absent.
- Export revenue report and confirm totals exclude deleted orders.

## Warranty

- Activate warranty for a completed order and confirm backend returns `warrantyEnd`.
- In Dealer App, confirm displayed expiration follows backend `warrantyEnd`, not a local-only recompute.
- Verify generated `warrantyCode` follows the `WAR-{suffix}-{id}` format when serial id exists.

## Blog And Content

- Create a blog with `status = SCHEDULED` and a future `scheduledAt`; confirm validation rejects missing or past `scheduledAt`.
- Wait for or simulate the publish job and confirm the blog becomes `PUBLISHED` and public blog cache is refreshed.
- In `main-fe`, verify homepage "new" and "featured" product rails still render from `showOnHomepage` / `isFeatured`.
- On product detail pages, confirm `image`, `descriptions`, `videos`, and `specifications` still render correctly.

## Push And Notification

- Register a device token from Dealer App and confirm backend marks it active.
- Trigger one `Notify` event and confirm:
  - record exists in notifications list
  - websocket update arrives while app is foregrounded
  - push payload wakes the app when backgrounded, if FCM is configured
- Logout and confirm token unregister path is executed.

## Notes

- Targeted backend tests for changed areas passed locally.
- Admin FE tests and production build passed locally.
- Dealer Flutter tests were updated but could not be executed successfully in the current environment, so the Dealer flows above need manual QA.
