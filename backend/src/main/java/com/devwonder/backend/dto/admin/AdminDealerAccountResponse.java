package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DealerTier;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminDealerAccountResponse(
        Long id,
        String name,
        DealerTier tier,
        CustomerStatus status,
        Integer orders,
        Instant lastOrderAt,
        BigDecimal revenue,
        BigDecimal creditLimit,
        String email,
        String phone
) {
}
