package com.devwonder.backend.dto.dealer;

import java.time.Instant;
import java.util.List;

public record DealerInventorySummaryItemResponse(
        Long productId,
        String productName,
        String productSku,
        String image,
        int totalSerials,
        int readySerials,
        int warrantySerials,
        int issueSerials,
        Instant latestImportedAt,
        List<String> orderCodes
) {
}
