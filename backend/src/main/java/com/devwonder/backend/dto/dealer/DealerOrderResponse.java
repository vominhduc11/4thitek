package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record DealerOrderResponse(
        Long id,
        String orderCode,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        BigDecimal paidAmount,
        BigDecimal subtotal,
        Integer discountPercent,
        BigDecimal discountAmount,
        Integer vatPercent,
        BigDecimal vatAmount,
        Integer shippingFee,
        BigDecimal totalAmount,
        BigDecimal outstandingAmount,
        String receiverName,
        String receiverAddress,
        String receiverPhone,
        String note,
        Instant createdAt,
        Instant updatedAt,
        List<DealerOrderItemResponse> items
) {
}
