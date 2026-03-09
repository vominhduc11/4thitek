package com.devwonder.backend.dto.publicapi;

public record PublicProductDetailResponse(
        Long id,
        String name,
        String sku,
        String shortDescription,
        String description,
        String image,
        double price,
        String specifications,
        String videos,
        String descriptions,
        int stock,
        int warrantyMonths
) {
}
