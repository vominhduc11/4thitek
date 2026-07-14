-- Optional fulfillment details for the existing B2B order workflow.
-- Existing orders are retained unchanged, so every new column is nullable.

alter table orders
    add column if not exists carrier varchar(120),
    add column if not exists tracking_code varchar(200),
    add column if not exists shipped_at timestamp with time zone,
    add column if not exists delivered_at timestamp with time zone;
