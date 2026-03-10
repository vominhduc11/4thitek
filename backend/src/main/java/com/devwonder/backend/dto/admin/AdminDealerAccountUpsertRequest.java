package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DealerTier;
import java.math.BigDecimal;

public record AdminDealerAccountUpsertRequest(
        String name,
        DealerTier tier,
        CustomerStatus status,
        BigDecimal revenue,
        BigDecimal creditLimit,
        String email,
        String phone
) {
}
