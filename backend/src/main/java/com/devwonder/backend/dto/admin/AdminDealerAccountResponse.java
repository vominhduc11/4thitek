package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.CustomerTier;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminDealerAccountResponse(
        Long id,
        String name,
        CustomerTier tier,
        CustomerStatus status,
        Integer orders,
        Instant lastOrderAt,
        BigDecimal revenue,
        String email,
        String phone
) {
}
