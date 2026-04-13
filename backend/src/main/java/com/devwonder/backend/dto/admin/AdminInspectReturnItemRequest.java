package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.ReturnRequestItemFinalResolution;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record AdminInspectReturnItemRequest(
        AdminRmaRequest.RmaAction rmaAction,

        @Size(max = 1000, message = "reason must be at most 1000 characters")
        String reason,

        List<String> proofUrls,

        ReturnRequestItemFinalResolution finalResolution,

        Long replacementOrderId,

        BigDecimal refundAmount,

        BigDecimal creditAmount
) {
}
