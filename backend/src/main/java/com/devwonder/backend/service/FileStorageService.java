package com.devwonder.backend.service;

import com.devwonder.backend.exception.BadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Service
public class FileStorageService implements DisposableBean {

    private static final String LOCAL_PROVIDER = "local";
    private static final String S3_PROVIDER = "s3";

    private final Path uploadDir;
    private final Set<String> allowedExtensions;
    private final String provider;
    private final String bucket;
    private final String publicBaseUrl;
    private final S3Client s3Client;

    public FileStorageService(
            @Value("${app.upload.dir:./uploads}") String dir,
            @Value("${app.upload.allowed-extensions:jpg,jpeg,png,gif,webp,pdf}") String extensions,
            @Value("${app.storage.provider:local}") String provider,
            @Value("${app.storage.s3.bucket:}") String bucket,
            @Value("${app.storage.s3.endpoint:}") String endpoint,
            @Value("${app.storage.s3.region:ap-southeast-1}") String region,
            @Value("${app.storage.s3.access-key:}") String accessKey,
            @Value("${app.storage.s3.secret-key:}") String secretKey,
            @Value("${app.storage.s3.path-style-access:true}") boolean pathStyleAccess,
            @Value("${app.storage.s3.public-base-url:}") String publicBaseUrl
    ) {
        this.uploadDir = Paths.get(dir).toAbsolutePath().normalize();
        this.allowedExtensions = Arrays.stream(extensions.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
        this.provider = normalizeProvider(provider);
        this.bucket = normalize(bucket);
        this.publicBaseUrl = normalize(publicBaseUrl);

        if (LOCAL_PROVIDER.equals(this.provider)) {
            try {
                Files.createDirectories(this.uploadDir);
            } catch (IOException ex) {
                throw new IllegalStateException("Cannot create upload directory", ex);
            }
            this.s3Client = null;
            return;
        }

        if (this.bucket == null) {
            throw new IllegalStateException("app.storage.s3.bucket is required when provider is s3");
        }

        if (normalize(accessKey) == null || normalize(secretKey) == null) {
            throw new IllegalStateException("S3 access key and secret key are required when provider is s3");
        }

        S3ClientBuilder builder = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey.trim(), secretKey.trim())
                ))
                .region(Region.of(region));
        if (normalize(endpoint) != null) {
            builder.endpointOverride(URI.create(endpoint.trim()));
        }
        builder.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(pathStyleAccess).build());
        this.s3Client = builder.build();
    }

    public String store(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("file is required");
        }

        String extension = extractExtension(file.getOriginalFilename());
        String generatedName = UUID.randomUUID() + "." + extension;

        if (LOCAL_PROVIDER.equals(provider)) {
            Path targetDirectory = resolveSubfolder(subfolder);

            try {
                Files.createDirectories(targetDirectory);
            } catch (IOException ex) {
                throw new IllegalStateException("Cannot create upload subdirectory", ex);
            }

            Path targetPath = targetDirectory.resolve(generatedName).normalize();
            ensureInsideUploadDir(targetPath);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException ex) {
                throw new IllegalStateException("Cannot store uploaded file", ex);
            }

            return toRelativePath(targetPath);
        }

        String key = toObjectKey(subfolder, generatedName);
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot read uploaded file", ex);
        }
        return buildPublicObjectUrl(key);
    }

    public void delete(String relativePath) {
        String normalizedPath = normalizeRelativePath(relativePath);
        if (normalizedPath == null) {
            return;
        }

        if (LOCAL_PROVIDER.equals(provider)) {
            Path targetPath = uploadDir.resolve(normalizedPath).normalize();
            ensureInsideUploadDir(targetPath);

            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException ex) {
                throw new IllegalStateException("Cannot delete uploaded file", ex);
            }
            return;
        }

        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(normalizedPath).build());
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

    private String toObjectKey(String subfolder, String generatedName) {
        String normalizedSubfolder = normalizeRelativePath(subfolder);
        if (normalizedSubfolder == null) {
            return generatedName;
        }
        return normalizedSubfolder + "/" + generatedName;
    }

    private String buildPublicObjectUrl(String key) {
        if (publicBaseUrl == null) {
            return key;
        }
        String base = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
        return base + "/" + key;
    }

    private void ensureInsideUploadDir(Path path) {
        if (!path.startsWith(uploadDir)) {
            throw new BadRequestException("Invalid upload path");
        }
    }

    private String toRelativePath(Path targetPath) {
        return uploadDir.relativize(targetPath).toString().replace('\\', '/');
    }

    private String normalizeProvider(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return LOCAL_PROVIDER;
        }
        if (!LOCAL_PROVIDER.equals(normalized) && !S3_PROVIDER.equals(normalized)) {
            throw new IllegalStateException("Unsupported storage provider: " + normalized);
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Override
    public void destroy() {
        if (s3Client != null) {
            s3Client.close();
        }
    }
}
