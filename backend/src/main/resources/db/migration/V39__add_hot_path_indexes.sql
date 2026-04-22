CREATE INDEX IF NOT EXISTS idx_orders_dealer_created_at
    ON orders (id_dealer, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
    ON orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_order_paid_at
    ON payments (id_order, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments (status);

CREATE INDEX IF NOT EXISTS idx_warranties_dealer_id
    ON warranties (id_dealer);

CREATE INDEX IF NOT EXISTS idx_warranties_status
    ON warranties (status);

CREATE INDEX IF NOT EXISTS idx_notifies_account_created_at
    ON notifies (id_account, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dealer_support_tickets_dealer_status_created
    ON dealer_support_tickets (dealer_id, status, created_at DESC);
