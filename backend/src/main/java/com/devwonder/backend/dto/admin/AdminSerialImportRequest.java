package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.ProductSerialStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AdminSerialImportRequest(
        @NotNull(message = "productId is required")
        Long productId,
        Long dealerId,
        Long orderId,
        ProductSerialStatus status,
        String warehouseId,
        String warehouseName,
        @NotEmpty(message = "serials must not be empty")
        List<String> serials
) {
}
