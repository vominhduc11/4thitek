package com.devwonder.backend.dto.notify;

import com.devwonder.backend.entity.enums.NotifyType;

public record CreateNotifyRequest(
        Long accountId,
        String title,
        String body,
        NotifyType type,
        String link,
        String deepLink
) {
}
