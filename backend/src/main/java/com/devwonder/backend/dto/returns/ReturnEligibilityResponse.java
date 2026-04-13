package com.devwonder.backend.dto.returns;

public record ReturnEligibilityResponse(
        Long serialId,
        String serial,
        Long orderId,
        String orderCode,
        Long productId,
        String productName,
        String productSku,
        boolean eligible,
        String reasonCode,
        String reasonMessage,
        Long activeRequestId,
        String activeRequestCode
) {
}
