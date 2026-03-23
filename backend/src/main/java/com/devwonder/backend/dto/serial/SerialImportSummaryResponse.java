package com.devwonder.backend.dto.serial;

import java.util.List;

public record SerialImportSummaryResponse<T>(
        List<T> importedItems,
        List<SerialImportSkippedItem> skippedItems,
        int importedCount,
        int skippedCount
) {
    public static <T> SerialImportSummaryResponse<T> of(
            List<T> importedItems,
            List<SerialImportSkippedItem> skippedItems
    ) {
        List<T> safeImportedItems = importedItems == null ? List.of() : List.copyOf(importedItems);
        List<SerialImportSkippedItem> safeSkippedItems = skippedItems == null ? List.of() : List.copyOf(skippedItems);
        return new SerialImportSummaryResponse<>(
                safeImportedItems,
                safeSkippedItems,
                safeImportedItems.size(),
                safeSkippedItems.size()
        );
    }
}
