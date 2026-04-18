package com.devwonder.backend.dto.media;

public record AdminMediaSummaryResponse(
        long totalFiles,
        long totalBytes,
        long imageBytes,
        long videoBytes,
        long documentBytes,
        long pendingBytes,
        long orphanedBytes
) {
}
