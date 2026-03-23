create table push_device_tokens (
    id bigserial primary key,
    account_id bigint not null references accounts(id) on delete cascade,
    token varchar(512) not null unique,
    platform varchar(32) not null,
    device_name varchar(120),
    app_version varchar(40),
    language_code varchar(12),
    is_active boolean not null default true,
    last_seen_at timestamp with time zone not null default current_timestamp,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);

create index idx_push_device_tokens_account_active
    on push_device_tokens(account_id, is_active);
