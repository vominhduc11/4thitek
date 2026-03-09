package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public record RecordPaymentRequest(
        @NotNull(message = "amount is required")
        @DecimalMin(value = "0.01", message = "amount must be greater than zero")
        BigDecimal amount,
        PaymentMethod method,
        String channel,
        String transactionCode,
        String note,
        String proofFileName,
        Instant paidAt
) {
}
