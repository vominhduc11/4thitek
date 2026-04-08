package com.devwonder.backend.dto.dealer;

import java.util.List;

public record DealerInventorySerialDetailResponse(
        DealerInventorySerialResponse serial,
        List<DealerInventoryTimelineEntryResponse> timeline
) {
}
