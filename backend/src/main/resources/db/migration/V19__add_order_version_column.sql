-- Add optimistic-locking version column to orders table.
-- Existing rows get version = 0 so Hibernate treats them as un-modified.
alter table orders add column if not exists version bigint not null default 0;
