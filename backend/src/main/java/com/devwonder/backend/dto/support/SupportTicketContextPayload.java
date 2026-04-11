package com.devwonder.backend.dto.support;

import java.math.BigDecimal;

public record SupportTicketContextPayload(
        String orderCode,
        String transactionCode,
        BigDecimal paidAmount,
        String paymentReference,
        String serial,
        String returnReason
) {
}
