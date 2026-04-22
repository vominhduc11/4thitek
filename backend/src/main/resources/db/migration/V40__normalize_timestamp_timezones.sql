-- Normalize legacy timestamp columns introduced after baseline to timestamptz.
-- Assumption: historical values were stored in UTC.

ALTER TABLE dealers
    ALTER COLUMN suspended_at TYPE TIMESTAMP WITH TIME ZONE
    USING suspended_at AT TIME ZONE 'UTC';

ALTER TABLE financial_settlements
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE financial_settlements
    ALTER COLUMN resolved_at TYPE TIMESTAMP WITH TIME ZONE
    USING resolved_at AT TIME ZONE 'UTC';

ALTER TABLE unmatched_payments
    ALTER COLUMN received_at TYPE TIMESTAMP WITH TIME ZONE
    USING received_at AT TIME ZONE 'UTC';

ALTER TABLE unmatched_payments
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE unmatched_payments
    ALTER COLUMN resolved_at TYPE TIMESTAMP WITH TIME ZONE
    USING resolved_at AT TIME ZONE 'UTC';

ALTER TABLE order_adjustments
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE refresh_token_sessions
    ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE
    USING expires_at AT TIME ZONE 'UTC';

ALTER TABLE refresh_token_sessions
    ALTER COLUMN revoked_at TYPE TIMESTAMP WITH TIME ZONE
    USING revoked_at AT TIME ZONE 'UTC';

ALTER TABLE refresh_token_sessions
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE media_assets
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE media_assets
    ALTER COLUMN finalized_at TYPE TIMESTAMP WITH TIME ZONE
    USING finalized_at AT TIME ZONE 'UTC';

ALTER TABLE media_assets
    ALTER COLUMN deleted_at TYPE TIMESTAMP WITH TIME ZONE
    USING deleted_at AT TIME ZONE 'UTC';
