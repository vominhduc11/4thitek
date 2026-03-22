package com.devwonder.backend.dto.warranty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateWarrantyRegistrationRequest(
        @NotNull(message = "productSerialId is required")
        Long productSerialId,
        String customerName,
        @jakarta.validation.constraints.NotBlank(message = "customerEmail is required")
        @Email(message = "customerEmail must be a valid email")
        String customerEmail,
        String customerPhone,
        String customerAddress,
        @NotNull(message = "purchaseDate is required")
        LocalDate purchaseDate
) {
}
