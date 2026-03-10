package com.devwonder.backend.dto.blog;

import java.time.Instant;

public record PublicBlogSummaryResponse(
        Long id,
        String title,
        String description,
        String image,
        String category,
        Instant createdAt
) implements java.io.Serializable {
}
