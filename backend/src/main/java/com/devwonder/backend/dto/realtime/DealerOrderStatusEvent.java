package com.devwonder.backend.dto.realtime;

import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record DealerOrderStatusEvent(
        Long orderId,
        String orderCode,
        OrderStatus previousStatus,
        OrderStatus status,
        PaymentStatus paymentStatus,
        BigDecimal paidAmount,
        Instant updatedAt
) {
}
