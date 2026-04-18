package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.media.AdminMediaListItemResponse;
import com.devwonder.backend.dto.media.AdminMediaSummaryResponse;
import com.devwonder.backend.dto.media.UpdateAdminMediaRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.entity.enums.MediaCategory;
import com.devwonder.backend.entity.enums.MediaStatus;
import com.devwonder.backend.entity.enums.MediaType;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.MediaAssetService;
import com.devwonder.backend.util.PaginationUtils;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/admin/media")
@RequiredArgsConstructor
public class AdminMediaController {

    private final MediaAssetService mediaAssetService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AdminMediaListItemResponse>>> list(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir,
            @RequestParam(name = "mediaType", required = false) String mediaType,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminMediaListItemResponse> result = mediaAssetService.listAdminMedia(
                pageable,
                parseMediaType(mediaType),
                parseMediaStatus(status),
                parseMediaCategory(category),
                query,
                from,
                to,
                appBaseUrl()
        );
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminMediaSummaryResponse>> summary() {
        return ResponseEntity.ok(ApiResponse.success(mediaAssetService.summarizeSupportMedia()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminMediaListItemResponse>> softDelete(
            @PathVariable("id") Long mediaAssetId,
            @RequestBody(required = false) UpdateAdminMediaRequest request
    ) {
        UpdateAdminMediaRequest payload = request == null
                ? new UpdateAdminMediaRequest("deleted", Boolean.FALSE, null)
                : request;
        return ResponseEntity.ok(ApiResponse.success(
                mediaAssetService.softDeleteMedia(mediaAssetId, payload, appBaseUrl())
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> hardDelete(@PathVariable("id") Long mediaAssetId) {
        mediaAssetService.hardDeleteMedia(mediaAssetId);
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("status", "deleted")));
    }

    private MediaType parseMediaType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return MediaType.fromJson(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported mediaType: " + value);
        }
    }

    private MediaStatus parseMediaStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return MediaStatus.fromJson(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported status: " + value);
        }
    }

    private MediaCategory parseMediaCategory(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return MediaCategory.fromJson(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported category: " + value);
        }
    }

    private String appBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }
}
