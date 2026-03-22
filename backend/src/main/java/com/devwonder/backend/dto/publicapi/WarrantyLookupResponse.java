package com.devwonder.backend.dto.publicapi;

import java.time.LocalDate;

public record WarrantyLookupResponse(
        String status,
        String productName,
        String serialNumber,
        LocalDate purchaseDate,
        LocalDate warrantyEndDate,
        long remainingDays,
        String warrantyCode
) implements java.io.Serializable {
}
