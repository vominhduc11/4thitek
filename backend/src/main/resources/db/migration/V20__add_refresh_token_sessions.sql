CREATE TABLE IF NOT EXISTS refresh_token_sessions (
    id                   BIGSERIAL PRIMARY KEY,
    account_id           BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_id             VARCHAR(64) NOT NULL UNIQUE,
    expires_at           TIMESTAMP   NOT NULL,
    revoked_at           TIMESTAMP,
    replaced_by_token_id VARCHAR(64),
    created_at           TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_sessions_account_id
    ON refresh_token_sessions(account_id);

CREATE INDEX IF NOT EXISTS idx_refresh_token_sessions_expires_at
    ON refresh_token_sessions(expires_at);
