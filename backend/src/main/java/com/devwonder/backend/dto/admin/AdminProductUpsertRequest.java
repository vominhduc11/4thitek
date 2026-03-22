package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.PublishStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminProductUpsertRequest(
        @Size(max = 100, message = "sku must be 100 characters or fewer")
        String sku,
        @Size(max = 255, message = "name must be 255 characters or fewer")
        String name,
        @Size(max = 2000, message = "shortDescription must be 2000 characters or fewer")
        String shortDescription,
        Map<String, Object> image,
        List<Map<String, Object>> descriptions,
        List<Map<String, Object>> videos,
        List<Map<String, Object>> specifications,
        @DecimalMin(value = "0.0", inclusive = true, message = "retailPrice must not be negative")
        BigDecimal retailPrice,
        @PositiveOrZero(message = "stock must not be negative")
        Integer stock,
        @PositiveOrZero(message = "warrantyPeriod must not be negative")
        @Max(value = 120, message = "warrantyPeriod must be 120 months or fewer")
        Integer warrantyPeriod,
        Boolean showOnHomepage,
        Boolean isFeatured,
        Boolean isDeleted,
        PublishStatus publishStatus
) {
}
