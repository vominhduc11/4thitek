package com.devwonder.backend.dto.publicapi;

public record PublicDealerResponse(
        Long id,
        String businessName,
        String contactName,
        String address,
        String city,
        String district,
        String phone,
        String email
) implements java.io.Serializable {
}
