alter table return_request_attachments
    add column if not exists media_asset_id bigint;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'fk_return_request_attachments_media_asset'
    ) then
        alter table return_request_attachments
            add constraint fk_return_request_attachments_media_asset
                foreign key (media_asset_id) references media_assets(id);
    end if;
end $$;

create index if not exists idx_return_request_attachments_media_asset_id
    on return_request_attachments (media_asset_id);
