-- Clear dealer for serials linked to non-COMPLETED orders (SHIPPING state)
UPDATE product_serials ps
SET id_dealer = NULL
WHERE ps.id_dealer IS NOT NULL
  AND ps.id_order IS NOT NULL
  AND (SELECT status FROM orders o WHERE o.id = ps.id_order) != 'COMPLETED';

-- Index for dealer inventory query (findDealerInventorySerials)
CREATE INDEX IF NOT EXISTS idx_ps_dealer_order_imported
    ON product_serials (id_dealer, id_order, imported_at DESC);

-- Index for available stock lookups (findAvailableForAssignment)
CREATE INDEX IF NOT EXISTS idx_ps_product_dealer_status
    ON product_serials (id_product, id_dealer, status);
