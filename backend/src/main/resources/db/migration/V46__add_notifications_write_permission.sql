-- Thêm permission code notifications.write: soạn/gửi notification tới dealer/account.
-- Policy giữ nguyên hành vi trước đây (chỉ SUPER_ADMIN/ADMIN được POST /admin/notifications),
-- nhưng chuyển từ role-hardcode trong @PreAuthorize sang permission code (xem PERMISSION_MATRIX §3/§7).

insert into permissions (code, description)
    select 'notifications.write', 'Compose / dispatch admin notifications'
    where not exists (select 1 from permissions where code = 'notifications.write');

insert into role_permissions (role_id, permission_id)
    select r.id, p.id
    from roles r
    join permissions p on p.code = 'notifications.write'
    where r.name in ('SUPER_ADMIN', 'ADMIN')
      and not exists (
          select 1 from role_permissions rp
          where rp.role_id = r.id and rp.permission_id = p.id
      );
