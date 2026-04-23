-- credit_limit was never mapped to the Dealer entity, never read in any
-- service or repository, and never exposed in any API response. Dead column.
ALTER TABLE dealers DROP COLUMN IF EXISTS credit_limit;
