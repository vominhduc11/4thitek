package com.devwonder.backend.dto.publicapi;

public record PublicProductDetailResponse(
        Long id,
        String name,
        String sku,
        String shortDescription,
        String description,
        String image,
        long price,
        Object specifications,
        Object videos,
        Object descriptions,
        int stock,
        int warrantyMonths
) implements java.io.Serializable {
}
