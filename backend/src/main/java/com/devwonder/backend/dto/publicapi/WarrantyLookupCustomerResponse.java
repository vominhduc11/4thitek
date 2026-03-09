package com.devwonder.backend.dto.publicapi;

public record WarrantyLookupCustomerResponse(
        String name,
        String phone,
        String email,
        String address
) {
}
