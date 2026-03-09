package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.BlogStatus;

public record AdminBlogUpsertRequest(
        Long categoryId,
        String categoryName,
        String title,
        String description,
        String image,
        String introduction,
        BlogStatus status,
        Boolean showOnHomepage,
        Boolean isDeleted
) {
}
