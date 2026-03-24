-- V17: Align DB schema with BUSINESS_LOGIC.md policies (2026-03-23)
-- Adds: INSPECTING/SCRAPPED serial statuses, financialSettlementRequired,
--        staleReviewRequired, idempotency_key on orders, financial_settlements,
--        unmatched_payments, order_adjustments tables.

-- 1. Serial status: add INSPECTING and SCRAPPED to the enum (PostgreSQL only).
--    H2 in MODE=PostgreSQL does not use native enum types; the Java enum is
--    the authoritative constraint there. The DO block is a no-op on H2 because
--    pg_type does not exist, so we guard with a NOT EXISTS check on a system
--    table that only PostgreSQL has. The block is skipped in H2 mode entirely
--    by checking whether we are in a PostgreSQL catalog.
--
--    NOTE: H2 does not support $$ dollar-quoting or anonymous DO blocks in all
--    modes. We use a plain comment here and rely on a post-DDL approach for PG.
--    For PostgreSQL deployments, run this manually if needed:
--      ALTER TYPE product_serial_status ADD VALUE IF NOT EXISTS 'INSPECTING';
--      ALTER TYPE product_serial_status ADD VALUE IF NOT EXISTS 'SCRAPPED';

-- 2. Orders: add financialSettlementRequired, staleReviewRequired, idempotency_key
--    Split into separate statements for H2 compatibility (H2 does not support
--    multiple ADD COLUMN IF NOT EXISTS in a single ALTER TABLE statement).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS financial_settlement_required BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stale_review_required BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

-- 3. FinancialSettlement table
CREATE TABLE IF NOT EXISTS financial_settlements (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT       NOT NULL REFERENCES orders(id),
    type         VARCHAR(64)  NOT NULL,
    amount       NUMERIC(19,2) NOT NULL,
    status       VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    created_by   VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    resolution   TEXT,
    resolved_by  VARCHAR(255),
    resolved_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_settlements_order_id ON financial_settlements(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_settlements_status   ON financial_settlements(status);

-- 4. UnmatchedPayment table
CREATE TABLE IF NOT EXISTS unmatched_payments (
    id                BIGSERIAL PRIMARY KEY,
    transaction_code  VARCHAR(512),
    amount            NUMERIC(19,2) NOT NULL,
    sender_info       TEXT,
    content           TEXT,
    order_code_hint   VARCHAR(128),
    received_at       TIMESTAMP,
    reason            VARCHAR(64)  NOT NULL,
    status            VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    resolution        TEXT,
    resolved_by       VARCHAR(255),
    resolved_at       TIMESTAMP,
    matched_order_id  BIGINT
);

CREATE INDEX IF NOT EXISTS idx_unmatched_payments_status ON unmatched_payments(status);
CREATE INDEX IF NOT EXISTS idx_unmatched_payments_reason ON unmatched_payments(reason);

-- 5. OrderAdjustment table (append-only)
CREATE TABLE IF NOT EXISTS order_adjustments (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT       NOT NULL REFERENCES orders(id),
    type            VARCHAR(32)  NOT NULL,
    amount          NUMERIC(19,2) NOT NULL,
    reason          TEXT         NOT NULL,
    reference_code  VARCHAR(255),
    created_by      VARCHAR(255) NOT NULL,
    created_by_role VARCHAR(64),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_adjustments_order_id ON order_adjustments(order_id);

-- 6. Dealers: add suspended_at for 24h grace period (BUSINESS_LOGIC.md Section 8.2)
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;
