alter table admins add column require_password_change boolean;

update admins
set require_password_change = coalesce(require_login_email_confirmation, false)
where require_password_change is null;

update admins
set require_password_change = false
where require_password_change is null;

alter table admins alter column require_password_change set default false;
alter table admins alter column require_password_change set not null;
alter table admins drop column require_login_email_confirmation;
