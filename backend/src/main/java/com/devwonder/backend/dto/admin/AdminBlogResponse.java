package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.BlogStatus;
import java.time.Instant;

public record AdminBlogResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String title,
        String description,
        String image,
        String introduction,
        BlogStatus status,
        Instant scheduledAt,
        Boolean showOnHomepage,
        Boolean isDeleted,
        Instant createdAt,
        Instant updatedAt
) {
}
