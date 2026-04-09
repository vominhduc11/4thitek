package com.devwonder.backend.dto.admin;

public record AdminOrderSummaryResponse(
        long total,
        long pending,
        long shipping
) {
}
