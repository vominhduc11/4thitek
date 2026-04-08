package com.devwonder.backend.dto.dealer;

import java.util.List;

public record DealerInventorySummaryResponse(
        int totalProducts,
        int totalSerials,
        int readySerials,
        int warrantySerials,
        int issueSerials,
        List<DealerInventorySummaryItemResponse> items
) {
}
