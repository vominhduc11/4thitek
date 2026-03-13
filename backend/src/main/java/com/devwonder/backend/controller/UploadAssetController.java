package com.devwonder.backend.controller;

import com.devwonder.backend.service.FileStorageService;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "s3")
public class UploadAssetController {

    private final FileStorageService fileStorageService;

    @GetMapping("/uploads/{*path}")
    public ResponseEntity<InputStreamResource> getUploadedAsset(@PathVariable("path") String path) {
        String normalizedPath = path != null && path.startsWith("/") ? path.substring(1) : path;
        FileStorageService.StoredFile storedFile = fileStorageService.open(normalizedPath);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (StringUtils.hasText(storedFile.contentType())) {
            try {
                mediaType = MediaType.parseMediaType(storedFile.contentType());
            } catch (IllegalArgumentException ignored) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .contentType(mediaType);
        if (storedFile.contentLength() >= 0) {
            response.contentLength(storedFile.contentLength());
        }

        return response.body(new InputStreamResource(storedFile.inputStream()));
    }
}
