package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.UnmatchedPaymentReason;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminUnmatchedPaymentResponse(
        Long id,
        String transactionCode,
        BigDecimal amount,
        String senderInfo,
        String content,
        String orderCodeHint,
        Instant receivedAt,
        UnmatchedPaymentReason reason,
        UnmatchedPaymentStatus status,
        Instant createdAt,
        String resolution,
        String resolvedBy,
        Instant resolvedAt,
        Long matchedOrderId
) {
}
