-- Backfill completed_at for historical completed orders before tightening column semantics.
update orders
set completed_at = coalesce(updated_at, created_at)
where status = 'COMPLETED'
  and completed_at is null;

-- Align completed_at with the entity model (Instant / timestamp with time zone).
alter table orders
    alter column completed_at type timestamp with time zone
    using case
        when completed_at is null then null
        else completed_at at time zone 'UTC'
    end;

-- Distributor-owned serials must not keep a dealer reference while AVAILABLE or RESERVED.
update product_serials
set id_dealer = null
where id_dealer is not null
  and status in ('AVAILABLE', 'RESERVED');

-- Historical migrations cleared dealer ownership too aggressively for sold inventory.
-- Restore dealer ownership from completed orders for statuses that represent dealer-owned inventory.
update product_serials ps
set id_dealer = (
    select o.id_dealer
    from orders o
    where o.id = ps.id_order
)
where ps.id_order is not null
  and ps.id_dealer is null
  and ps.status in ('ASSIGNED', 'WARRANTY', 'DEFECTIVE', 'RETURNED')
  and exists (
      select 1
      from orders o
      where o.id = ps.id_order
        and o.status = 'COMPLETED'
        and o.id_dealer is not null
  );

-- Product.stock is a derived value from distributor-available serials.
update products p
set stock = coalesce((
    select cast(count(*) as integer)
    from product_serials ps
    where ps.id_product = p.id
      and ps.id_dealer is null
      and ps.status = 'AVAILABLE'
), 0);
