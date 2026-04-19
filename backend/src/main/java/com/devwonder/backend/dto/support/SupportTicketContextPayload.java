package com.devwonder.backend.dto.support;

import java.math.BigDecimal;

public record SupportTicketContextPayload(
        Long returnRequestId,
        String returnRequestCode,
        String returnStatus,
        Long orderId,
        String orderCode,
        String transactionCode,
        BigDecimal paidAmount,
        String paymentReference,
        String serial,
        String returnReason
) {
}
