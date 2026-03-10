package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.NotifyType;
import java.time.Instant;

public record AdminNotificationResponse(
        Long id,
        Long accountId,
        String accountName,
        String accountType,
        String title,
        String content,
        Boolean isRead,
        NotifyType type,
        String link,
        Instant createdAt
) {
}
