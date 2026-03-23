UPDATE dealers
SET customer_status = 'ACTIVE'
WHERE customer_status IS NULL;

ALTER TABLE dealers
ALTER COLUMN customer_status SET NOT NULL;
