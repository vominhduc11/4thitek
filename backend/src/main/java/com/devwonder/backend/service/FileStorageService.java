package com.devwonder.backend.service;

import com.devwonder.backend.exception.BadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private final Path uploadDir;
    private final Set<String> allowedExtensions;

    public FileStorageService(
            @Value("${app.upload.dir:./uploads}") String dir,
            @Value("${app.upload.allowed-extensions:jpg,jpeg,png,gif,webp,pdf}") String extensions
    ) {
        this.uploadDir = Paths.get(dir).toAbsolutePath().normalize();
        this.allowedExtensions = Arrays.stream(extensions.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot create upload directory", ex);
        }
    }

    public String store(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("file is required");
        }

        String extension = extractExtension(file.getOriginalFilename());
        Path targetDirectory = resolveSubfolder(subfolder);

        try {
            Files.createDirectories(targetDirectory);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot create upload subdirectory", ex);
        }

        Path targetPath = targetDirectory.resolve(UUID.randomUUID() + "." + extension).normalize();
        ensureInsideUploadDir(targetPath);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot store uploaded file", ex);
        }

        return toRelativePath(targetPath);
    }

    public void delete(String relativePath) {
        String normalizedPath = normalizeRelativePath(relativePath);
        if (normalizedPath == null) {
            return;
        }

        Path targetPath = uploadDir.resolve(normalizedPath).normalize();
        ensureInsideUploadDir(targetPath);

        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot delete uploaded file", ex);
        }
    }

    private String extractExtension(String originalFilename) {
        String safeFilename = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename);
        String extension = StringUtils.getFilenameExtension(safeFilename);
        if (!StringUtils.hasText(extension)) {
            throw new BadRequestException("Uploaded file must have an extension");
        }

        String normalizedExtension = extension.toLowerCase(Locale.ROOT);
        if (!allowedExtensions.contains(normalizedExtension)) {
            throw new BadRequestException("Unsupported file extension: " + normalizedExtension);
        }
        return normalizedExtension;
    }

    private Path resolveSubfolder(String subfolder) {
        String normalizedSubfolder = normalizeRelativePath(subfolder);
        if (normalizedSubfolder == null) {
            return uploadDir;
        }

        Path targetDirectory = uploadDir.resolve(normalizedSubfolder).normalize();
        ensureInsideUploadDir(targetDirectory);
        return targetDirectory;
    }

    private String normalizeRelativePath(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value.replace('\\', '/').trim();
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.contains("..")) {
            throw new BadRequestException("Invalid upload path");
        }
        return normalized;
    }

    private void ensureInsideUploadDir(Path path) {
        if (!path.startsWith(uploadDir)) {
            throw new BadRequestException("Invalid upload path");
        }
    }

    private String toRelativePath(Path targetPath) {
        return uploadDir.relativize(targetPath).toString().replace('\\', '/');
    }
}
