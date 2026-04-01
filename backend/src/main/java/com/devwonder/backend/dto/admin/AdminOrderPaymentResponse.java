package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminOrderPaymentResponse(
        Long id,
        Long orderId,
        BigDecimal amount,
        PaymentMethod method,
        String channel,
        String transactionCode,
        String note,
        String recordedBy,
        Instant paidAt,
        Instant createdAt
) {
}
