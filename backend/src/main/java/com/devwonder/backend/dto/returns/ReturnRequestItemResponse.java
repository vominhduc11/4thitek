package com.devwonder.backend.dto.returns;

import com.devwonder.backend.entity.enums.ReturnRequestItemCondition;
import com.devwonder.backend.entity.enums.ReturnRequestItemFinalResolution;
import com.devwonder.backend.entity.enums.ReturnRequestItemStatus;
import java.math.BigDecimal;

public record ReturnRequestItemResponse(
        Long id,
        Long orderItemId,
        Long productId,
        String productName,
        String productSku,
        Long productSerialId,
        String serialSnapshot,
        ReturnRequestItemStatus itemStatus,
        ReturnRequestItemCondition conditionOnRequest,
        String adminDecisionNote,
        String inspectionNote,
        ReturnRequestItemFinalResolution finalResolution,
        Long replacementOrderId,
        Long replacementSerialId,
        BigDecimal refundAmount,
        BigDecimal creditAmount,
        Long orderAdjustmentId
) {
}
