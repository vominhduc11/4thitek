create table if not exists customer_account_cleanup (
    id bigint primary key
);

insert into customer_account_cleanup (id)
select c.id_account
from customers c
where not exists (
    select 1
    from customer_account_cleanup cleanup
    where cleanup.id = c.id_account
);

update warranties
set customer_name = coalesce(
        nullif(customer_name, ''),
        (select c.full_name from customers c where c.id_account = warranties.id_customer),
        (select a.username from accounts a where a.id = warranties.id_customer)
    ),
    customer_email = coalesce(
        nullif(customer_email, ''),
        (select a.email from accounts a where a.id = warranties.id_customer)
    ),
    customer_phone = coalesce(
        nullif(customer_phone, ''),
        (select c.phone from customers c where c.id_account = warranties.id_customer)
    )
where id_customer in (select id from customer_account_cleanup);

alter table warranties add column purchase_date_v2 date;

update warranties
set purchase_date_v2 = cast(coalesce(purchase_date, warranty_start) as date)
where purchase_date_v2 is null;

delete from notifies
where id_account in (select id from customer_account_cleanup);

delete from password_reset_tokens
where account_id in (select id from customer_account_cleanup);

delete from account_roles
where account_id in (select id from customer_account_cleanup);

alter table if exists product_serials drop constraint if exists FKs76i0d1r918xkyc7jkd1915ij;
alter table if exists warranties drop constraint if exists FKbe8q4ul5111iqv12nrm89nctu;

alter table if exists product_serials drop column if exists id_customer;
alter table if exists warranties drop column if exists purchase_date;
alter table if exists warranties drop column if exists id_customer;
alter table if exists warranties rename column purchase_date_v2 to purchase_date;

delete from customers
where id_account in (select id from customer_account_cleanup);

delete from accounts
where id in (select id from customer_account_cleanup);

delete from roles
where name = 'CUSTOMER'
  and not exists (
      select 1
      from account_roles
      where role_id = roles.id
  );

drop table if exists customer_account_cleanup;
