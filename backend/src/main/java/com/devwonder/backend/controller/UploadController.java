package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.FileStorageService;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
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
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        String fileName = fileStorageService.store(file, resolveSubfolder(category, authentication));
        String url = buildPublicUrl(fileName);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "url", url,
                "fileName", fileName
        )));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> delete(
            Authentication authentication,
            @RequestParam("url") String url
    ) {
        String relativePath = resolveRelativePath(url);
        assertDeleteAccess(authentication, relativePath);
        fileStorageService.delete(relativePath);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "deleted",
                "path", relativePath
        )));
    }

    private String resolveSubfolder(String category, Authentication authentication) {
        String normalized = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        Account account = requireAccount(authentication);
        return switch (normalized) {
            case "products" -> {
                requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
                yield "products";
            }
            case "blogs" -> {
                requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
                yield "blogs";
            }
            case "avatars" -> {
                requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
                yield adminScopedFolder("avatars", account);
            }
            case "dealer-avatars" -> {
                if (isAdmin(account)) {
                    yield adminScopedFolder("avatars/dealers", account);
                }
                requireAnyAuthority(account, "USER");
                yield actorScopedFolder("avatars/dealers", account);
            }
            case "customer-avatars" -> {
                if (isAdmin(account)) {
                    yield adminScopedFolder("avatars/customers", account);
                }
                requireAnyAuthority(account, "CUSTOMER");
                yield actorScopedFolder("avatars/customers", account);
            }
            case "payment-proofs" -> {
                if (isAdmin(account)) {
                    yield adminScopedFolder("payments/proofs", account);
                }
                requireAnyAuthority(account, "USER");
                yield actorScopedFolder("payments/proofs/dealers", account);
            }
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

    private void assertDeleteAccess(Authentication authentication, String relativePath) {
        String normalized = relativePath.replace('\\', '/');
        Account account = requireAccount(authentication);

        if (normalized.startsWith("products/") || normalized.startsWith("blogs/")) {
            requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
            return;
        }

        if (normalized.startsWith("avatars/dealers/")) {
            if (isAdmin(account)) {
                return;
            }
            requireAnyAuthority(account, "USER");
            requireOwnedPath(normalized, actorScopedFolder("avatars/dealers", account));
            return;
        }

        if (normalized.startsWith("avatars/customers/")) {
            if (isAdmin(account)) {
                return;
            }
            requireAnyAuthority(account, "CUSTOMER");
            requireOwnedPath(normalized, actorScopedFolder("avatars/customers", account));
            return;
        }

        if (normalized.startsWith("payments/proofs/")) {
            if (isAdmin(account)) {
                return;
            }
            requireAnyAuthority(account, "USER");
            requireOwnedPath(normalized, actorScopedFolder("payments/proofs/dealers", account));
            return;
        }

        if (normalized.startsWith("avatars/")) {
            requireAnyAuthority(account, "ADMIN", "SUPER_ADMIN");
            return;
        }

        throw new BadRequestException("Unsupported upload path");
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

    private String actorScopedFolder(String baseFolder, Account account) {
        Long accountId = account.getId();
        if (accountId == null) {
            throw new AccessDeniedException("Access denied");
        }
        return baseFolder + "/account-" + accountId;
    }

    private String adminScopedFolder(String baseFolder, Account account) {
        return baseFolder + "/admin/" + actorScopedFolder("", account).replaceFirst("^/", "");
    }

    private void requireOwnedPath(String normalizedPath, String ownedFolder) {
        String expectedPrefix = ownedFolder + "/";
        if (!normalizedPath.startsWith(expectedPrefix)) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
