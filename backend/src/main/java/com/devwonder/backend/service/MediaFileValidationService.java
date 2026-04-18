package com.devwonder.backend.service;

import com.devwonder.backend.config.MediaProperties;
import com.devwonder.backend.entity.enums.MediaType;
import com.devwonder.backend.exception.BadRequestException;
import java.util.Set;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MediaFileValidationService {

    private static final int MAGIC_BYTE_READ_LIMIT = 64;

    private final MediaProperties mediaProperties;

    public MediaFileValidationService(MediaProperties mediaProperties) {
        this.mediaProperties = mediaProperties;
    }

    public ValidatedMediaFile validateMetadata(String fileName, String contentType, long sizeBytes) {
        String normalizedFileName = normalizeFileName(fileName);
        String extension = extractExtension(normalizedFileName);
        MediaType mediaType = resolveMediaType(extension);
        long maxSize = maxSizeBytes(mediaType);
        if (sizeBytes <= 0) {
            throw new BadRequestException("Uploaded file is empty");
        }
        if (sizeBytes > maxSize) {
            throw new BadRequestException("Uploaded file exceeds size limit for " + mediaType.toJson());
        }

        String normalizedContentType = normalizeContentType(contentType);
        validateContentType(extension, normalizedContentType);
        return new ValidatedMediaFile(normalizedFileName, extension, normalizedContentType, mediaType, sizeBytes);
    }

    public void validateMagicBytes(ValidatedMediaFile mediaFile, byte[] contentHead) {
        if (mediaFile == null) {
            throw new BadRequestException("Invalid media file metadata");
        }
        if (contentHead == null || contentHead.length == 0) {
            throw new BadRequestException("Uploaded file content is empty");
        }
        String extension = mediaFile.extension();
        boolean matches = switch (extension) {
            case "jpg", "jpeg" -> matchesJpeg(contentHead);
            case "png" -> matchesPng(contentHead);
            case "webp" -> matchesWebp(contentHead);
            case "pdf" -> matchesPdf(contentHead);
            case "mp4" -> matchesMp4(contentHead);
            case "webm" -> matchesWebm(contentHead);
            default -> false;
        };
        if (!matches) {
            throw new BadRequestException("Uploaded file header does not match file extension");
        }
    }

    public MediaType inferMediaType(String fileNameOrUrl) {
        if (!StringUtils.hasText(fileNameOrUrl)) {
            return MediaType.OTHER;
        }
        String candidate = fileNameOrUrl.trim().toLowerCase(Locale.ROOT);
        int queryIndex = candidate.indexOf('?');
        if (queryIndex >= 0) {
            candidate = candidate.substring(0, queryIndex);
        }
        int fragmentIndex = candidate.indexOf('#');
        if (fragmentIndex >= 0) {
            candidate = candidate.substring(0, fragmentIndex);
        }
        int slashIndex = Math.max(candidate.lastIndexOf('/'), candidate.lastIndexOf('\\'));
        String fileName = slashIndex >= 0 ? candidate.substring(slashIndex + 1) : candidate;
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return MediaType.OTHER;
        }
        try {
            return resolveMediaType(fileName.substring(dot + 1));
        } catch (BadRequestException ex) {
            return MediaType.OTHER;
        }
    }

    public long maxSizeBytes(MediaType mediaType) {
        return switch (mediaType) {
            case IMAGE -> mediaProperties.getMaxImageBytes();
            case VIDEO -> mediaProperties.getMaxVideoBytes();
            case DOCUMENT -> mediaProperties.getMaxDocumentBytes();
            case OTHER -> mediaProperties.getMaxDocumentBytes();
        };
    }

    public int magicByteReadLimit() {
        return MAGIC_BYTE_READ_LIMIT;
    }

    public String normalizeFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            throw new BadRequestException("fileName is required");
        }
        String cleaned = fileName.trim().replace('\\', '/');
        int slashIndex = cleaned.lastIndexOf('/');
        String leaf = slashIndex >= 0 ? cleaned.substring(slashIndex + 1) : cleaned;
        if (!StringUtils.hasText(leaf) || leaf.contains("..")) {
            throw new BadRequestException("Invalid fileName");
        }
        return leaf;
    }

    public String extractExtension(String fileName) {
        String extension = StringUtils.getFilenameExtension(fileName);
        if (!StringUtils.hasText(extension)) {
            throw new BadRequestException("Uploaded file must have an extension");
        }
        return extension.trim().toLowerCase(Locale.ROOT);
    }

    public MediaType resolveMediaType(String extension) {
        String normalized = extension == null ? "" : extension.trim().toLowerCase(Locale.ROOT);
        if (mediaProperties.getImageExtensions().stream().anyMatch(value -> value.equalsIgnoreCase(normalized))) {
            return MediaType.IMAGE;
        }
        if (mediaProperties.getVideoExtensions().stream().anyMatch(value -> value.equalsIgnoreCase(normalized))) {
            return MediaType.VIDEO;
        }
        if (mediaProperties.getDocumentExtensions().stream().anyMatch(value -> value.equalsIgnoreCase(normalized))) {
            return MediaType.DOCUMENT;
        }
        throw new BadRequestException("Unsupported file extension: " + normalized);
    }

    public String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            throw new BadRequestException("contentType is required");
        }
        return contentType.trim().toLowerCase(Locale.ROOT);
    }

    private void validateContentType(String extension, String contentType) {
        Set<String> allowed = switch (extension) {
            case "jpg", "jpeg" -> Set.of("image/jpeg", "image/jpg");
            case "png" -> Set.of("image/png");
            case "webp" -> Set.of("image/webp");
            case "pdf" -> Set.of("application/pdf");
            case "mp4" -> Set.of("video/mp4");
            case "webm" -> Set.of("video/webm");
            default -> Set.of();
        };
        if (allowed.isEmpty() || !allowed.contains(contentType)) {
            throw new BadRequestException("Unsupported contentType for file extension");
        }
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

    private boolean matchesMp4(byte[] content) {
        return content.length >= 12
                && content[4] == 'f'
                && content[5] == 't'
                && content[6] == 'y'
                && content[7] == 'p';
    }

    private boolean matchesWebm(byte[] content) {
        return content.length >= 4
                && unsigned(content[0]) == 0x1A
                && unsigned(content[1]) == 0x45
                && unsigned(content[2]) == 0xDF
                && unsigned(content[3]) == 0xA3;
    }

    private int unsigned(byte value) {
        return value & 0xFF;
    }

    public record ValidatedMediaFile(
            String fileName,
            String extension,
            String contentType,
            MediaType mediaType,
            long sizeBytes
    ) {
    }
}
