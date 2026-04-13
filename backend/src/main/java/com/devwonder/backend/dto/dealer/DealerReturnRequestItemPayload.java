package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.ReturnRequestItemCondition;
import jakarta.validation.constraints.NotNull;

public record DealerReturnRequestItemPayload(
        @NotNull(message = "productSerialId is required")
        Long productSerialId,

        @NotNull(message = "conditionOnRequest is required")
        ReturnRequestItemCondition conditionOnRequest
) {
}
