package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.NotifyType;
import java.time.Instant;
import java.util.List;

public record AdminNotificationDispatchResponse(
        String audience,
        NotifyType type,
        int recipientCount,
        List<Long> recipientAccountIds,
        Instant dispatchedAt
) {
}
