package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.FileStorageService;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping({"/api/upload", "/api/v1/upload"})
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @Value("${app.upload.base-url:/uploads}")
    private String uploadBaseUrl;

    @Value("${app.storage.s3.public-base-url:}")
    private String storagePublicBaseUrl;

    @PostMapping(value = "/{category}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @PathVariable("category") String category,
            @RequestParam("file") MultipartFile file
    ) {
        String fileName = fileStorageService.store(file, resolveSubfolder(category));
        String url = buildPublicUrl(fileName);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "url", url,
                "fileName", fileName
        )));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> delete(
            @RequestParam("url") String url
    ) {
        String relativePath = resolveRelativePath(url);
        fileStorageService.delete(relativePath);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "deleted",
                "path", relativePath
        )));
    }

    private String resolveSubfolder(String category) {
        String normalized = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "products" -> "products";
            case "blogs" -> "blogs";
            case "avatars" -> "avatars";
            case "dealer-avatars" -> "avatars/dealers";
            case "customer-avatars" -> "avatars/customers";
            case "payment-proofs" -> "payments/proofs";
            default -> throw new BadRequestException("Unsupported upload category: " + category);
        };
    }

    private String buildPublicUrl(String relativePath) {
        if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
            return relativePath;
        }
        String baseUrl = uploadBaseUrl == null ? "/uploads" : uploadBaseUrl.trim();
        if (baseUrl.isEmpty()) {
            baseUrl = "/uploads";
        }
        if (!baseUrl.startsWith("/")) {
            baseUrl = "/" + baseUrl;
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "/" + relativePath.replace('\\', '/');
    }

    private String resolveRelativePath(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new BadRequestException("url is required");
        }

        String fromStorageBase = stripConfiguredBase(normalized, storagePublicBaseUrl);
        if (fromStorageBase != null) {
            return fromStorageBase;
        }

        String fromUploadBase = stripConfiguredBase(normalized, uploadBaseUrl);
        if (fromUploadBase != null) {
            return fromUploadBase;
        }

        if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
            throw new BadRequestException("Unsupported upload URL");
        }

        return normalized.startsWith("/") ? normalized.substring(1) : normalized;
    }

    private String stripConfiguredBase(String value, String configuredBase) {
        if (!StringUtils.hasText(configuredBase)) {
            return null;
        }

        String normalizedBase = configuredBase.trim();
        while (normalizedBase.endsWith("/")) {
            normalizedBase = normalizedBase.substring(0, normalizedBase.length() - 1);
        }
        if (normalizedBase.isEmpty()) {
            return null;
        }

        if (value.startsWith(normalizedBase + "/")) {
            return value.substring(normalizedBase.length() + 1);
        }
        if (value.equals(normalizedBase)) {
            return null;
        }

        if (!normalizedBase.startsWith("/")) {
            return null;
        }

        try {
            String path = URI.create(value).getPath();
            if (!StringUtils.hasText(path)) {
                return null;
            }
            if (path.startsWith(normalizedBase + "/")) {
                return path.substring(normalizedBase.length() + 1);
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }

        return null;
    }
}
