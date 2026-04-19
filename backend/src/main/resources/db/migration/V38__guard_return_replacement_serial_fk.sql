DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_return_request_items_replacement_serial'
          AND conrelid = 'return_request_items'::regclass
    ) THEN
        ALTER TABLE return_request_items
            ADD CONSTRAINT fk_return_request_items_replacement_serial
                FOREIGN KEY (replacement_serial_id) REFERENCES product_serials (id);
    END IF;
END $$;
