ALTER TABLE return_request_items
    ADD COLUMN IF NOT EXISTS replacement_serial_id BIGINT NULL;

ALTER TABLE return_request_items
    ADD CONSTRAINT fk_return_request_items_replacement_serial
        FOREIGN KEY (replacement_serial_id) REFERENCES product_serials (id);

CREATE INDEX IF NOT EXISTS idx_return_request_items_replacement_serial_id
    ON return_request_items (replacement_serial_id);
