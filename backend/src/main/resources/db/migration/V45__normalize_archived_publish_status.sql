-- PublishStatus.ARCHIVED đã bị gỡ khỏi enum (không nơi nào trong code đọc/ghi giá trị này).
-- Trash canonical của Product là cột is_deleted. Chuẩn hóa mọi bản ghi cũ còn ARCHIVED về DRAFT
-- để cột publish_status chỉ còn hai giá trị hợp lệ: DRAFT, PUBLISHED.
update products set publish_status = 'DRAFT' where publish_status = 'ARCHIVED';
