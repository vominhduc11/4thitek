package com.devwonder.backend.dto.admin;

public record AdminReportExportResponse(
        String fileName,
        String contentType,
        byte[] content
) {
}
