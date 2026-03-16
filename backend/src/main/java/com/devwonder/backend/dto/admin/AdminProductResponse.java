package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.PublishStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record AdminProductResponse(
        Long id,
        String sku,
        String name,
        String shortDescription,
        Map<String, Object> image,
        List<Map<String, Object>> descriptions,
        List<Map<String, Object>> videos,
        List<Map<String, Object>> specifications,
        BigDecimal retailPrice,
        Integer availableStock,
        Integer warrantyPeriod,
        Boolean showOnHomepage,
        Boolean isFeatured,
        Boolean isDeleted,
        PublishStatus publishStatus,
        Instant createdAt,
        Instant updatedAt
) {
}
