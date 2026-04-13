create index if not exists idx_return_requests_dealer_status_created_at
    on return_requests (dealer_id, status, created_at desc);

create index if not exists idx_return_requests_support_ticket_id
    on return_requests (support_ticket_id);

create index if not exists idx_return_request_items_serial_request
    on return_request_items (product_serial_id, request_id);

create index if not exists idx_return_request_attachments_item_id
    on return_request_attachments (request_item_id);

create index if not exists idx_return_requests_status_created_at
    on return_requests (status, created_at desc);
