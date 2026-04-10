ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

UPDATE orders
SET confirmed_at = COALESCE(updated_at, created_at)
WHERE confirmed_at IS NULL
  AND status = 'CONFIRMED';

CREATE INDEX IF NOT EXISTS idx_orders_status_confirmed_at ON orders (status, confirmed_at);
