package com.devwonder.backend.dto.blog;

import java.time.Instant;

public record PublicBlogDetailResponse(
        Long id,
        String title,
        String description,
        String image,
        String category,
        Instant createdAt,
        Instant updatedAt,
        String introduction,
        boolean showOnHomepage
) implements java.io.Serializable {
}
