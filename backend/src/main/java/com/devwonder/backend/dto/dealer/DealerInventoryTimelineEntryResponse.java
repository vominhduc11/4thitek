package com.devwonder.backend.dto.dealer;

import java.time.Instant;

public record DealerInventoryTimelineEntryResponse(
        String type,
        String title,
        String description,
        Instant occurredAt
) {
}
