package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.ProductSerialStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateDealerSerialBatchRequest(
        @NotNull(message = "productId is required")
        Long productId,
        Long orderId,
        ProductSerialStatus status,
        String warehouseId,
        String warehouseName,
        @NotEmpty(message = "serials must not be empty")
        List<String> serials
) {
}
