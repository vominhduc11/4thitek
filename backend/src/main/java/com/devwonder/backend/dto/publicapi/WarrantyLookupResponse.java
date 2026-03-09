package com.devwonder.backend.dto.publicapi;

import java.time.Instant;

public record WarrantyLookupResponse(
        Long id,
        Long idProductSerial,
        Long idCustomer,
        String warrantyCode,
        String status,
        Instant purchaseDate,
        Instant warrantyStart,
        Instant warrantyEnd,
        long remainingDays,
        Instant createdAt,
        WarrantyLookupCustomerResponse customer,
        WarrantyLookupProductSerialResponse productSerial
) {
}
