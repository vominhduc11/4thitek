alter table dealer_support_tickets
    add column context_data text;

alter table support_ticket_messages
    add column attachments text;
