package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.media.CreateMediaUploadSessionRequest;
import com.devwonder.backend.dto.media.FinalizeMediaUploadRequest;
import com.devwonder.backend.dto.media.MediaAccessUrlResponse;
import com.devwonder.backend.dto.media.MediaAssetResponse;
import com.devwonder.backend.dto.media.MediaUploadSessionResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.FileStorageService;
import com.devwonder.backend.service.MediaAssetService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaAssetService mediaAssetService;

    @PostMapping("/upload-session")
    public ResponseEntity<ApiResponse<MediaUploadSessionResponse>> createUploadSession(
            @Valid @RequestBody CreateMediaUploadSessionRequest request,
            Authentication authentication
    ) {
        Account actor = requireAccount(authentication);
        MediaUploadSessionResponse response = mediaAssetService.createUploadSession(actor, request, appBaseUrl());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/upload-session/{id}/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaAssetResponse>> uploadSessionContent(
            @PathVariable("id") Long mediaAssetId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        Account actor = requireAccount(authentication);
        MediaAssetResponse response = mediaAssetService.uploadLocalSessionContent(mediaAssetId, actor, file, appBaseUrl());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/finalize")
    public ResponseEntity<ApiResponse<MediaAssetResponse>> finalizeUpload(
            @Valid @RequestBody FinalizeMediaUploadRequest request,
            Authentication authentication
    ) {
        Account actor = requireAccount(authentication);
        MediaAssetResponse response = mediaAssetService.finalizeUpload(actor, request, appBaseUrl());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(
            @PathVariable("id") Long mediaAssetId,
            @RequestParam(name = "token", required = false) String token,
            Authentication authentication
    ) {
        FileStorageService.StoredFile storedFile;
        if (token != null && !token.isBlank()) {
            storedFile = mediaAssetService.openForDownloadByToken(mediaAssetId, token);
        } else {
            Account actor = requireAccount(authentication);
            storedFile = mediaAssetService.openForDownloadAsActor(mediaAssetId, actor);
        }

        String fileName = mediaAssetService.resolveDownloadFileName(mediaAssetId);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (storedFile.contentType() != null && !storedFile.contentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(storedFile.contentType());
            } catch (IllegalArgumentException ignored) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        ResponseEntity.BodyBuilder bodyBuilder = ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(fileName, StandardCharsets.UTF_8).build().toString()
                );
        if (storedFile.contentLength() >= 0) {
            bodyBuilder.contentLength(storedFile.contentLength());
        }
        return bodyBuilder.body(new InputStreamResource(storedFile.inputStream()));
    }

    @GetMapping("/{id}/access-url")
    public ResponseEntity<ApiResponse<MediaAccessUrlResponse>> accessUrl(
            @PathVariable("id") Long mediaAssetId,
            Authentication authentication
    ) {
        Account actor = requireAccount(authentication);
        MediaAccessUrlResponse response = mediaAssetService.createSignedAccessUrl(mediaAssetId, actor, appBaseUrl());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Account requireAccount(Authentication authentication) {
        Authentication auth = authentication != null ? authentication : SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Account account)) {
            throw new BadRequestException("Unauthenticated request");
        }
        return account;
    }

    private String appBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }
}
