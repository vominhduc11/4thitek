CREATE TABLE IF NOT EXISTS media_assets (
    id BIGSERIAL PRIMARY KEY,
    object_key VARCHAR(1024) NOT NULL UNIQUE,
    original_file_name VARCHAR(512) NOT NULL,
    stored_file_name VARCHAR(512),
    content_type VARCHAR(255) NOT NULL,
    media_type VARCHAR(32) NOT NULL,
    category VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_provider VARCHAR(32) NOT NULL,
    owner_account_id BIGINT,
    uploaded_by_account_id BIGINT,
    status VARCHAR(32) NOT NULL,
    linked_entity_type VARCHAR(128),
    linked_entity_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_media_assets_owner_account FOREIGN KEY (owner_account_id) REFERENCES accounts(id),
    CONSTRAINT fk_media_assets_uploaded_by_account FOREIGN KEY (uploaded_by_account_id) REFERENCES accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_status_created_at ON media_assets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_status_deleted_at ON media_assets(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_category_status ON media_assets(category, status);
CREATE INDEX IF NOT EXISTS idx_media_assets_media_type ON media_assets(media_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by ON media_assets(uploaded_by_account_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_account_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_linked_entity ON media_assets(linked_entity_type, linked_entity_id);

CREATE TABLE IF NOT EXISTS support_ticket_message_attachments (
    message_id BIGINT NOT NULL,
    media_asset_id BIGINT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (message_id, media_asset_id),
    CONSTRAINT fk_support_message_attachments_message FOREIGN KEY (message_id)
        REFERENCES support_ticket_messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_message_attachments_media_asset FOREIGN KEY (media_asset_id)
        REFERENCES media_assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_support_message_attachments_message_sort
    ON support_ticket_message_attachments(message_id, sort_order);
