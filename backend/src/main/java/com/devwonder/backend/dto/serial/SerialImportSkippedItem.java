package com.devwonder.backend.dto.serial;

public record SerialImportSkippedItem(
        String serial,
        String reason
) {
}
