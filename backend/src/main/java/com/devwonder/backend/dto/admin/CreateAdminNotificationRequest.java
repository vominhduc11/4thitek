package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.NotifyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateAdminNotificationRequest(
        @NotBlank(message = "audience is required")
        String audience,
        List<Long> accountIds,
        @NotBlank(message = "title is required")
        String title,
        @NotBlank(message = "content is required")
        String content,
        @NotNull(message = "type is required")
        NotifyType type,
        String link
) {
}
