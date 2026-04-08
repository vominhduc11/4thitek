package com.devwonder.backend.dto.publicapi;

import com.devwonder.backend.dto.blog.PublicBlogSummaryResponse;
import java.util.List;

public record PublicSearchResponse(
        List<PublicProductSummaryResponse> products,
        List<PublicBlogSummaryResponse> blogs
) {
}
