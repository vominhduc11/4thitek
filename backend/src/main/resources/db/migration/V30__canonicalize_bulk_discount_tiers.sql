alter table if exists bulk_discounts add column if not exists from_quantity integer;
alter table if exists bulk_discounts add column if not exists to_quantity integer;

update bulk_discounts
set from_quantity = min_quantity
where from_quantity is null
  and min_quantity is not null;

update bulk_discounts
set to_quantity = max_quantity
where to_quantity is null
  and max_quantity is not null;

update bulk_discounts
set from_quantity = cast(regexp_replace(range_label, '.*?(\\d+).*', '$1') as integer)
where from_quantity is null
  and range_label is not null
  and regexp_like(range_label, '.*\\d+.*');

update bulk_discounts
set to_quantity = cast(regexp_replace(range_label, '.*?(\\d+)\\D+(\\d+).*', '$2') as integer)
where to_quantity is null
  and range_label is not null
  and regexp_like(range_label, '.*\\d+\\D+\\d+.*')
  and range_label not like '%+%';

update bulk_discounts
set status = 'DRAFT'
where status is null
   or upper(status) = 'PENDING';

update bulk_discounts
set from_quantity = 1
where from_quantity is null;

alter table if exists bulk_discounts drop constraint if exists FKbwa6b8gnuqfhlw07pa0a6uhr4;
alter table if exists bulk_discounts drop column if exists id_product;
alter table if exists bulk_discounts drop column if exists label;
alter table if exists bulk_discounts drop column if exists range_label;
alter table if exists bulk_discounts drop column if exists min_quantity;
alter table if exists bulk_discounts drop column if exists max_quantity;
