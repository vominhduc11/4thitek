ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(38,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(38,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_discount_rule_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_discount_rule_label VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat_percent INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(38,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(38,2);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku_snapshot VARCHAR(255);

UPDATE order_items oi
SET
    product_name_snapshot = COALESCE(oi.product_name_snapshot, p.name),
    product_sku_snapshot = COALESCE(oi.product_sku_snapshot, p.sku)
FROM products p
WHERE oi.id_product = p.id
  AND (oi.product_name_snapshot IS NULL OR oi.product_sku_snapshot IS NULL);
