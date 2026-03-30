alter table if exists admin_settings add column if not exists vat_percent integer;
update admin_settings set vat_percent = 10 where vat_percent is null;
alter table if exists admin_settings alter column vat_percent set default 10;
alter table if exists admin_settings alter column vat_percent set not null;
