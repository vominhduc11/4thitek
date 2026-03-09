package com.devwonder.backend.dto.notify;

import com.devwonder.backend.entity.enums.NotifyType;
import java.time.Instant;

public record NotifyResponse(
        Long id,
        Long accountId,
        String title,
        String content,
        Boolean isRead,
        NotifyType type,
        String link,
        Instant readAt,
        Instant createdAt
) {
}
