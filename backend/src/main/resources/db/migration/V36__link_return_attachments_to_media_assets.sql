alter table return_request_attachments
    add column if not exists media_asset_id bigint;

alter table return_request_attachments
    add constraint if not exists fk_return_request_attachments_media_asset
        foreign key (media_asset_id) references media_assets(id);

create index if not exists idx_return_request_attachments_media_asset_id
    on return_request_attachments (media_asset_id);
