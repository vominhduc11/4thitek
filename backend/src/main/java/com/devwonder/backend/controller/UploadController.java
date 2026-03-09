package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.FileStorageService;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @Value("${app.upload.base-url:/uploads}")
    private String uploadBaseUrl;

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
}
