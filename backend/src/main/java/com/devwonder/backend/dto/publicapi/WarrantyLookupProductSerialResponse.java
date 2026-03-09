package com.devwonder.backend.dto.publicapi;

public record WarrantyLookupProductSerialResponse(
        Long id,
        String serialNumber,
        String productName,
        String productSku,
        String status,
        String image
) {
}
