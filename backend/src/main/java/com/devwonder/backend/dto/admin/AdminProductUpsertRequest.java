package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.PublishStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminProductUpsertRequest(
        String sku,
        String name,
        String shortDescription,
        Map<String, Object> image,
        List<Map<String, Object>> descriptions,
        List<Map<String, Object>> videos,
        List<Map<String, Object>> specifications,
        BigDecimal retailPrice,
        Integer warrantyPeriod,
        Boolean showOnHomepage,
        Boolean isFeatured,
        Boolean isDeleted,
        PublishStatus publishStatus
) {
}
