update orders
set payment_method = 'BANK_TRANSFER'
where payment_method = 'DEBT';

update payments
set method = 'BANK_TRANSFER'
where method = 'DEBT';
