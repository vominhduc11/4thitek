package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminRecentPaymentResponse(
        Long id,
        Long orderId,
        String orderCode,
        Long dealerId,
        String dealerName,
        BigDecimal amount,
        PaymentMethod method,
        PaymentStatus status,
        String channel,
        String transactionCode,
        String note,
        String proofFileName,
        Instant paidAt,
        Instant createdAt,
        Boolean reviewSuggested
) {
}
