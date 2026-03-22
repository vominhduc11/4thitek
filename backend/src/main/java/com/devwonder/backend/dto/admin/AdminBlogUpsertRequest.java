package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.BlogStatus;
import jakarta.validation.constraints.Size;

public record AdminBlogUpsertRequest(
        Long categoryId,
        @Size(max = 120, message = "categoryName must be 120 characters or fewer")
        String categoryName,
        @Size(max = 255, message = "title must be 255 characters or fewer")
        String title,
        @Size(max = 2000, message = "description must be 2000 characters or fewer")
        String description,
        @Size(max = 1024, message = "image must be 1024 characters or fewer")
        String image,
        @Size(max = 10000, message = "introduction must be 10000 characters or fewer")
        String introduction,
        BlogStatus status,
        Boolean showOnHomepage,
        Boolean isDeleted
) {
}
