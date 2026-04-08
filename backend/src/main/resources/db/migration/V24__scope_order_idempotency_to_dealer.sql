-- Align order idempotency with the dealer-scoped runtime contract.
-- The same X-Idempotency-Key may be reused by different dealers without cross-tenant collisions.

alter table orders drop constraint if exists orders_idempotency_key_key;
drop index if exists orders_idempotency_key_key;
drop index if exists uk_orders_idempotency_key;

create unique index if not exists uk_orders_dealer_idempotency_key
    on orders (id_dealer, idempotency_key);
