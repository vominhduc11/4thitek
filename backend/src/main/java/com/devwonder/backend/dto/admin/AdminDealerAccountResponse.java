package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.CustomerStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminDealerAccountResponse(
        Long id,
        String name,
        String businessName,
        String contactName,
        CustomerStatus status,
        Integer orders,
        Instant lastOrderAt,
        BigDecimal revenue,
        BigDecimal reservedCredit,
        BigDecimal openReceivable,
        BigDecimal totalCreditExposure,
        BigDecimal availableCredit,
        BigDecimal creditLimit,
        String email,
        String phone,
        List<CustomerStatus> allowedTransitions
) {
}
