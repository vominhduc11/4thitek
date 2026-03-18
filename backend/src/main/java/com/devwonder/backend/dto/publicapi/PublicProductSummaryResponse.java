package com.devwonder.backend.dto.publicapi;

public record PublicProductSummaryResponse(
        Long id,
        String name,
        String sku,
        String shortDescription,
        String image,
        long price,
        int stock,
        int warrantyMonths
) implements java.io.Serializable {
}
