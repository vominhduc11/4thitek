package com.devwonder.backend.dto.admin;

import java.math.BigDecimal;

public record AdminDealerAccountUpdateRequest(
        BigDecimal creditLimit
) {
}
