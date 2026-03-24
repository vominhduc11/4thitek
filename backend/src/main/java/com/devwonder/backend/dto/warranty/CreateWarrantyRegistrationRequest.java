package com.devwonder.backend.dto.warranty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateWarrantyRegistrationRequest(
        @NotNull(message = "productSerialId is required")
        Long productSerialId,
        @NotBlank(message = "customerName is required")
        String customerName,
        @NotBlank(message = "customerEmail is required")
        @Email(message = "customerEmail must be a valid email")
        String customerEmail,
        @NotBlank(message = "customerPhone is required")
        String customerPhone,
        @NotBlank(message = "customerAddress is required")
        String customerAddress,
        @NotNull(message = "purchaseDate is required")
        LocalDate purchaseDate
) {
}
