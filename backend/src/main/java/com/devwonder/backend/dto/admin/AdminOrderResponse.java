package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminOrderResponse(
        Long id,
        String orderCode,
        Long dealerId,
        String dealerName,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        BigDecimal paidAmount,
        Instant createdAt,
        Instant updatedAt,
        BigDecimal totalAmount,
        BigDecimal outstandingAmount,
        Integer itemCount,
        String address,
        String note,
        List<AdminOrderItemResponse> orderItems,
        Boolean staleReviewRequired,
        List<OrderStatus> allowedTransitions
) {
}
