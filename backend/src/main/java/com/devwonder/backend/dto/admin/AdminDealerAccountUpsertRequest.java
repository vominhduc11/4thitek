package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.CustomerTier;
import java.math.BigDecimal;

public record AdminDealerAccountUpsertRequest(
        String name,
        CustomerTier tier,
        CustomerStatus status,
        BigDecimal revenue,
        String email,
        String phone
) {
}
