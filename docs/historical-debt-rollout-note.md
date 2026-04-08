# Historical DEBT Rollout Note

This note documents the manual cleanup required before fully rolling out the bank-transfer-only contract.

## Invalid values after rollout

The live system must no longer contain new runtime writes that use:

- `PaymentMethod = DEBT`
- `PaymentStatus = DEBT_RECORDED`
- dealer/account credit fields used only for debt handling
- debt-tracking UI routes or debt-specific report columns

## Historical data to clean up

Before full rollout, production data should be reviewed for records that still carry historical debt values, including:

- orders with `payment_method = DEBT`
- orders with `payment_status = DEBT_RECORDED`
- payments, reports, or admin views that still assume debt-only semantics

## Required migration approach

- Do not auto-convert historical `DEBT` or `DEBT_RECORDED` records inside application business logic.
- Clean historical enum values with an explicit migration or manual database/admin cleanup process before enabling the rollout everywhere.
- Verify downstream BI/reporting/export consumers no longer expect debt columns or debt statuses.

## Manual admin cleanup that may be required

- review stale historical debt orders and decide whether they should be cancelled, reconciled as paid bank transfers, or archived for offline finance handling
- resolve any unmatched or manually recorded transfers that were previously linked to debt workflows
- confirm no admin UI workflow still depends on dealer credit-limit configuration

## Post-cleanup validation

- create a new dealer order with `BANK_TRANSFER` and confirm it starts as `PENDING` + unpaid
- confirm unpaid `PENDING` orders cannot be confirmed by admin
- confirm paid `PENDING` orders can be confirmed
- confirm stale unpaid `PENDING` orders auto-cancel and release reservations
- confirm stale orders with recorded money remain in manual review instead of auto-cancel
