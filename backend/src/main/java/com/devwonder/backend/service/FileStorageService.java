package com.devwonder.backend.service;

import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import java.io.ByteArrayInputStream;
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
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Service
public class FileStorageService implements DisposableBean {

    private static final String LOCAL_PROVIDER = "local";
    private static final String S3_PROVIDER = "s3";
    private static final String UPLOADS_PREFIX = "/uploads/";
    private static final String INTERNAL_UPLOAD_PREFIX = "/api/v1/upload/";

    private final Path uploadDir;
    private final Set<String> allowedExtensions;
    private final String provider;
    private final String bucket;
    private final String publicBaseUrl;
    private final S3Client s3Client;
    private final long maxFileSizeBytes;

    public record StoredFile(InputStream inputStream, String contentType, long contentLength) {
    }

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
            @Value("${app.storage.s3.public-base-url:}") String publicBaseUrl,
            @Value("${app.upload.max-file-size:${spring.servlet.multipart.max-file-size:10MB}}") DataSize maxFileSize
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
        this.maxFileSizeBytes = maxFileSize == null ? DataSize.ofMegabytes(10).toBytes() : maxFileSize.toBytes();

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
        if (file.getSize() > maxFileSizeBytes) {
            throw new BadRequestException("Uploaded file exceeds the configured size limit");
        }

        String extension = extractExtension(file.getOriginalFilename());
        byte[] content = readContent(file);
        String contentType = resolveTrustedContentType(extension, content);
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

            try (InputStream inputStream = new ByteArrayInputStream(content)) {
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
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromBytes(content)
            );
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Cannot store uploaded file", ex);
        }
        return key;
    }

    public boolean delete(String relativePath) {
        String normalizedPath = normalizeStoredPath(relativePath);
        if (normalizedPath == null) {
            return false;
        }

        if (LOCAL_PROVIDER.equals(provider)) {
            Path targetPath = uploadDir.resolve(normalizedPath).normalize();
            ensureInsideUploadDir(targetPath);

            try {
                return Files.deleteIfExists(targetPath);
            } catch (IOException ex) {
                throw new IllegalStateException("Cannot delete uploaded file", ex);
            }
        }

        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(normalizedPath).build());
        return true;
    }

    public StoredFile open(String storedPath) {
        String normalizedPath = normalizeStoredPath(storedPath);
        if (normalizedPath == null) {
            throw new ResourceNotFoundException("Uploaded file not found");
        }

        if (LOCAL_PROVIDER.equals(provider)) {
            Path targetPath = uploadDir.resolve(normalizedPath).normalize();
            ensureInsideUploadDir(targetPath);
            if (!Files.isRegularFile(targetPath)) {
                throw new ResourceNotFoundException("Uploaded file not found");
            }

            try {
                String contentType = Files.probeContentType(targetPath);
                long contentLength = Files.size(targetPath);
                return new StoredFile(Files.newInputStream(targetPath), contentType, contentLength);
            } catch (IOException ex) {
                throw new IllegalStateException("Cannot read uploaded file", ex);
            }
        }

        try {
            ResponseInputStream<GetObjectResponse> inputStream = s3Client.getObject(
                    GetObjectRequest.builder().bucket(bucket).key(normalizedPath).build()
            );
            GetObjectResponse response = inputStream.response();
            long contentLength = response.contentLength() == null ? -1L : response.contentLength();
            return new StoredFile(inputStream, response.contentType(), contentLength);
        } catch (NoSuchKeyException ex) {
            throw new ResourceNotFoundException("Uploaded file not found");
        } catch (S3Exception ex) {
            if (ex.statusCode() == 404) {
                throw new ResourceNotFoundException("Uploaded file not found");
            }
            throw new IllegalStateException("Cannot read uploaded file", ex);
        }
    }

    public String normalizeStoredPath(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalizedValue = value.trim();
        String fromConfiguredBase = stripConfiguredPublicBase(normalizedValue);
        if (fromConfiguredBase != null) {
            return fromConfiguredBase;
        }

        String fromUploadsPrefix = stripUploadsPrefix(normalizedValue);
        if (fromUploadsPrefix != null) {
            return fromUploadsPrefix;
        }

        String fromInternalPrefix = stripInternalUploadPrefix(normalizedValue);
        if (fromInternalPrefix != null) {
            return fromInternalPrefix;
        }

        if (normalizedValue.startsWith("http://") || normalizedValue.startsWith("https://")) {
            try {
                URI uri = URI.create(normalizedValue);
                String path = uri.getPath();
                String fromBucketPrefix = stripBucketPrefix(path);
                if (fromBucketPrefix != null) {
                    return fromBucketPrefix;
                }
                fromUploadsPrefix = stripUploadsPrefix(path);
                if (fromUploadsPrefix != null) {
                    return fromUploadsPrefix;
                }
                fromInternalPrefix = stripInternalUploadPrefix(path);
                if (fromInternalPrefix != null) {
                    return fromInternalPrefix;
                }
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid upload path");
            }
            throw new BadRequestException("Unsupported upload URL");
        }

        return normalizeRelativePath(normalizedValue);
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

    private byte[] readContent(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot read uploaded file", ex);
        }
    }

    private String resolveTrustedContentType(String extension, byte[] content) {
        if (content == null || content.length == 0) {
            throw new BadRequestException("Uploaded file is empty");
        }
        return switch (extension) {
            case "jpg", "jpeg" -> {
                if (!matchesJpeg(content)) {
                    throw new BadRequestException("Uploaded file content does not match .jpeg");
                }
                yield "image/jpeg";
            }
            case "png" -> {
                if (!matchesPng(content)) {
                    throw new BadRequestException("Uploaded file content does not match .png");
                }
                yield "image/png";
            }
            case "gif" -> {
                if (!matchesGif(content)) {
                    throw new BadRequestException("Uploaded file content does not match .gif");
                }
                yield "image/gif";
            }
            case "webp" -> {
                if (!matchesWebp(content)) {
                    throw new BadRequestException("Uploaded file content does not match .webp");
                }
                yield "image/webp";
            }
            case "pdf" -> {
                if (!matchesPdf(content)) {
                    throw new BadRequestException("Uploaded file content does not match .pdf");
                }
                yield "application/pdf";
            }
            default -> throw new BadRequestException("Unsupported file extension: " + extension);
        };
    }

    private boolean matchesJpeg(byte[] content) {
        return content.length >= 3
                && unsigned(content[0]) == 0xFF
                && unsigned(content[1]) == 0xD8
                && unsigned(content[2]) == 0xFF;
    }

    private boolean matchesPng(byte[] content) {
        return content.length >= 8
                && unsigned(content[0]) == 0x89
                && unsigned(content[1]) == 0x50
                && unsigned(content[2]) == 0x4E
                && unsigned(content[3]) == 0x47
                && unsigned(content[4]) == 0x0D
                && unsigned(content[5]) == 0x0A
                && unsigned(content[6]) == 0x1A
                && unsigned(content[7]) == 0x0A;
    }

    private boolean matchesGif(byte[] content) {
        return content.length >= 6
                && content[0] == 'G'
                && content[1] == 'I'
                && content[2] == 'F'
                && content[3] == '8'
                && (content[4] == '7' || content[4] == '9')
                && content[5] == 'a';
    }

    private boolean matchesWebp(byte[] content) {
        return content.length >= 12
                && content[0] == 'R'
                && content[1] == 'I'
                && content[2] == 'F'
                && content[3] == 'F'
                && content[8] == 'W'
                && content[9] == 'E'
                && content[10] == 'B'
                && content[11] == 'P';
    }

    private boolean matchesPdf(byte[] content) {
        return content.length >= 5
                && content[0] == '%'
                && content[1] == 'P'
                && content[2] == 'D'
                && content[3] == 'F'
                && content[4] == '-';
    }

    private int unsigned(byte value) {
        return value & 0xFF;
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

    private String stripConfiguredPublicBase(String value) {
        if (!StringUtils.hasText(publicBaseUrl)) {
            return null;
        }

        String base = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
        if (value.startsWith(base + "/")) {
            return normalizeRelativePath(value.substring(base.length() + 1));
        }

        try {
            String basePath = URI.create(base).getPath();
            String requestPath = URI.create(value).getPath();
            if (StringUtils.hasText(basePath) && StringUtils.hasText(requestPath) && requestPath.startsWith(basePath + "/")) {
                return normalizeRelativePath(requestPath.substring(basePath.length() + 1));
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }

        return null;
    }

    private String stripBucketPrefix(String value) {
        if (!StringUtils.hasText(bucket) || !StringUtils.hasText(value)) {
            return null;
        }

        String normalizedValue = value.replace('\\', '/').trim();
        String bucketPrefix = "/" + bucket + "/";
        if (normalizedValue.startsWith(bucketPrefix)) {
            return normalizeRelativePath(normalizedValue.substring(bucketPrefix.length()));
        }
        return null;
    }

    private String stripUploadsPrefix(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalizedValue = value.replace('\\', '/').trim();
        if (normalizedValue.startsWith(UPLOADS_PREFIX)) {
            return normalizeRelativePath(normalizedValue.substring(UPLOADS_PREFIX.length()));
        }
        return null;
    }

    private String stripInternalUploadPrefix(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalizedValue = value.replace('\\', '/').trim();
        if (normalizedValue.startsWith(INTERNAL_UPLOAD_PREFIX)) {
            return normalizeRelativePath(normalizedValue.substring(INTERNAL_UPLOAD_PREFIX.length()));
        }
        return null;
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
