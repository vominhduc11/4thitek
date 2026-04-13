alter table return_request_items
    add column if not exists order_adjustment_id bigint;

alter table return_request_items
    add constraint fk_return_request_items_order_adjustment
        foreign key (order_adjustment_id) references order_adjustments(id);

create index if not exists idx_return_request_items_order_adjustment_id
    on return_request_items (order_adjustment_id);
