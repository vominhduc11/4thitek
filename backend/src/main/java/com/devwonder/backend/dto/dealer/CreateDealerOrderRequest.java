package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateDealerOrderRequest(
        @NotNull(message = "paymentMethod is required")
        PaymentMethod paymentMethod,
        String receiverName,
        String receiverAddress,
        String receiverPhone,
        Integer shippingFee,
        String note,
        @Valid
        @NotEmpty(message = "items must not be empty")
        List<CreateDealerOrderItemRequest> items
) {
}
