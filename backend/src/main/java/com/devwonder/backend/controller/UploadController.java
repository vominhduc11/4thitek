package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.service.DealerAccountLifecycleService;
import com.devwonder.backend.service.FileStorageService;
import java.time.Duration;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");

    private final FileStorageService fileStorageService;
    private final DealerAccountLifecycleService dealerAccountLifecycleService;

    @Value("${app.upload.base-url:/uploads}")
    private String uploadBaseUrl;

    @Value("${app.storage.provider:local}")
    private String storageProvider;

    @PostMapping(value = "/{category}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @PathVariable("category") String category,
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        UploadTarget uploadTarget = resolveUploadTarget(category, authentication);
        String fileName = fileStorageService.store(file, uploadTarget.subfolder(), uploadTarget.allowedExtensions());
        String url = buildPublicUrl(fileName);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "url", url,
                "fileName", fileName
        )));
    }

    @GetMapping("/{*path}")
    public ResponseEntity<InputStreamResource> openInternal(
            @PathVariable("path") String path,
            Authentication authentication
    ) {
        String normalizedPath = path != null && path.startsWith("/") ? path.substring(1) : path;
        if (isPublicAssetPath(normalizedPath)) {
            return buildFileResponse(fileStorageService.open(normalizedPath), true);
        }
        assertReadAccess(authentication, normalizedPath);
        return buildFileResponse(fileStorageService.open(normalizedPath), false);
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> delete(
            Authentication authentication,
            @RequestParam("url") String url
    ) {
        String relativePath = resolveRelativePath(url);
        assertDeleteAccess(authentication, relativePath);
        boolean deleted = fileStorageService.delete(relativePath);
        if (!deleted) {
            throw new ResourceNotFoundException("Uploaded file not found");
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "deleted",
                "path", relativePath
        )));
    }

    private UploadTarget resolveUploadTarget(String category, Authentication authentication) {
        String normalized = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        Account account = requireAccount(authentication);
        return switch (normalized) {
            case "products" -> {
                requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
                yield new UploadTarget("products", IMAGE_EXTENSIONS);
            }
            case "blogs" -> {
                requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
                yield new UploadTarget("blogs", IMAGE_EXTENSIONS);
            }
            case "avatars" -> {
                requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
                yield new UploadTarget(adminScopedFolder("avatars", account), null);
            }
            case "dealer-avatars" -> {
                if (isAdmin(account)) {
                    yield new UploadTarget(adminScopedFolder("avatars/dealers", account), null);
                }
                requireDealerPortalAccess(account);
                yield new UploadTarget(actorScopedFolder("avatars/dealers", account), null);
            }
            case "payment-proofs" -> {
                if (isAdmin(account)) {
                    yield new UploadTarget(adminScopedFolder("payments/proofs", account), null);
                }
                requireDealerPortalAccess(account);
                yield new UploadTarget(actorScopedFolder("payments/proofs/dealers", account), null);
            }
            default -> throw new BadRequestException("Unsupported upload category: " + category);
        };
    }

    private String buildPublicUrl(String storedPath) {
        String normalizedPath = fileStorageService.normalizeStoredPath(storedPath);
        if (normalizedPath == null) {
            throw new BadRequestException("Invalid upload path");
        }

        String baseUrl;
        if ("s3".equalsIgnoreCase(storageProvider == null ? "" : storageProvider.trim())) {
            baseUrl = uploadBaseUrl == null ? "/uploads" : uploadBaseUrl.trim();
            if (baseUrl.isEmpty()) {
                baseUrl = "/uploads";
            }
        } else {
            baseUrl = "/api/v1/upload";
        }
        if (!baseUrl.startsWith("/")) {
            baseUrl = "/" + baseUrl;
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "/" + normalizedPath;
    }

    private String resolveRelativePath(String value) {
        String normalizedPath = fileStorageService.normalizeStoredPath(value);
        if (normalizedPath == null) {
            throw new BadRequestException("url is required");
        }
        return normalizedPath;
    }

    private void assertDeleteAccess(Authentication authentication, String relativePath) {
        String normalized = relativePath.replace('\\', '/');
        Account account = requireAccount(authentication);

        if (isPublicAssetPath(normalized)) {
            requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
            return;
        }

        assertPrivateReadAccess(account, normalized);
    }

    private void assertReadAccess(Authentication authentication, String relativePath) {
        String normalized = relativePath == null ? null : relativePath.replace('\\', '/');
        Account account = requireAccount(authentication);
        assertPrivateReadAccess(account, normalized);
    }

    private void assertPrivateReadAccess(Account account, String normalized) {
        if (normalized.startsWith("products/") || normalized.startsWith("blogs/")) {
            requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
            return;
        }

        if (normalized.startsWith("avatars/dealers/")) {
            if (isAdmin(account)) {
                return;
            }
            requireDealerPortalAccess(account);
            requireOwnedPath(normalized, actorScopedFolder("avatars/dealers", account));
            return;
        }

        if (normalized.startsWith("payments/proofs/")) {
            if (isAdmin(account)) {
                return;
            }
            requireDealerPortalAccess(account);
            requireOwnedPath(normalized, actorScopedFolder("payments/proofs/dealers", account));
            return;
        }

        if (normalized.startsWith("avatars/")) {
            requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
            return;
        }

        throw new BadRequestException("Unsupported upload path");
    }

    private boolean isPublicAssetPath(String relativePath) {
        if (relativePath == null) {
            return false;
        }
        String normalized = relativePath.replace('\\', '/');
        return normalized.startsWith("products/") || normalized.startsWith("blogs/");
    }

    private Account requireAccount(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Account account)) {
            throw new AccessDeniedException("Access denied");
        }
        return account;
    }

    private boolean isAdmin(Account account) {
        return hasAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
    }

    private boolean hasAnyAuthority(Account account, String... authorities) {
        Set<String> grantedAuthorities = account.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .collect(java.util.stream.Collectors.toSet());

        for (String authority : authorities) {
            if (grantedAuthorities.contains(authority)) {
                return true;
            }
        }
        return false;
    }

    private void requireAnyAuthority(Account account, String... authorities) {
        if (!hasAnyAuthority(account, authorities)) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private void requireDealerPortalAccess(Account account) {
        requireAnyAuthority(account, "DEALER");
        dealerAccountLifecycleService.assertDealerPortalAccess(account);
    }

    private String actorScopedFolder(String baseFolder, Account account) {
        Long accountId = account.getId();
        if (accountId == null) {
            throw new AccessDeniedException("Access denied");
        }
        return baseFolder + "/" + accountId;
    }

    private String adminScopedFolder(String baseFolder, Account account) {
        return actorScopedFolder(baseFolder, account);
    }

    private void requireOwnedPath(String normalizedPath, String ownedFolder) {
        String expectedPrefix = ownedFolder + "/";
        if (!normalizedPath.startsWith(expectedPrefix)) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private ResponseEntity<InputStreamResource> buildFileResponse(
            FileStorageService.StoredFile storedFile,
            boolean cachePublic
    ) {
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (storedFile.contentType() != null && !storedFile.contentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(storedFile.contentType());
            } catch (IllegalArgumentException ignored) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        ResponseEntity.BodyBuilder response = ResponseEntity.ok().contentType(mediaType);
        if (cachePublic) {
            response.cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
        }
        if (storedFile.contentLength() >= 0) {
            response.contentLength(storedFile.contentLength());
        }
        return response.body(new InputStreamResource(storedFile.inputStream()));
    }

    private record UploadTarget(String subfolder, Set<String> allowedExtensions) {
    }
}
