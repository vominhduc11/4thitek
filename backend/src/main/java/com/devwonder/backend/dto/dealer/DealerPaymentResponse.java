package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record DealerPaymentResponse(
        Long id,
        Long orderId,
        BigDecimal amount,
        PaymentMethod method,
        PaymentStatus status,
        String channel,
        String transactionCode,
        String note,
        String proofFileName,
        Instant paidAt,
        Instant createdAt
) {
}
