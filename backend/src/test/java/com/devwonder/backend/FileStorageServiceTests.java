package com.devwonder.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.devwonder.backend.service.FileStorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.util.unit.DataSize;

class FileStorageServiceTests {

    private FileStorageService storageService;

    @AfterEach
    void tearDown() {
        if (storageService != null) {
            storageService.destroy();
        }
    }

    @Test
    void normalizesLegacyStorageAndUploadUrlsToObjectKeys() {
        storageService = new FileStorageService(
                "target/test-uploads/file-storage",
                "jpg,jpeg,png,gif,webp,pdf",
                "s3",
                "4thitek-uploads",
                "",
                "ap-southeast-1",
                "test-access-key",
                "test-secret-key",
                true,
                "https://storage.4thitek.vn/4thitek-uploads",
                DataSize.ofMegabytes(10)
        );

        assertEquals(
                "products/example.png",
                storageService.normalizeStoredPath("https://storage.4thitek.vn/4thitek-uploads/products/example.png")
        );
        assertEquals(
                "products/example.png",
                storageService.normalizeStoredPath("https://api.4thitek.vn/uploads/products/example.png")
        );
        assertEquals("products/example.png", storageService.normalizeStoredPath("/uploads/products/example.png"));
        assertEquals("products/example.png", storageService.normalizeStoredPath("products/example.png"));
    }
}
