-- Order state machine expansion: add PROCESSING + a dealer-request -> admin-review cancel flow.
-- order.status is varchar(64) with no CHECK constraint, so new enum values need no column change.
-- These columns track a dealer cancel request so a rejected request can resume the order.

alter table orders
    add column if not exists cancel_requested_from varchar(64);

alter table orders
    add column if not exists cancel_request_reason text;
