package com.devwonder.backend.dto.publicapi;

public record PublicProductSummaryResponse(
        Long id,
        String name,
        String sku,
        String shortDescription,
        String image,
        double price,
        int stock,
        int warrantyMonths
) {
}
