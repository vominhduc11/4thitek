package com.devwonder.backend.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.media")
public class MediaProperties {

    private List<String> imageExtensions = List.of("jpg", "jpeg", "png", "webp");
    private List<String> videoExtensions = List.of("mp4", "webm");
    private List<String> documentExtensions = List.of("pdf");

    private long maxImageBytes = 10L * 1024 * 1024;
    private long maxDocumentBytes = 10L * 1024 * 1024;
    private long maxVideoBytes = 50L * 1024 * 1024;

    private int maxAttachmentsPerMessage = 6;
    private int maxVideosPerMessage = 2;

    private Duration uploadSessionTtl = Duration.ofMinutes(15);
    private Duration presignedUploadTtl = Duration.ofMinutes(15);
    private Duration signedAccessTtl = Duration.ofMinutes(10);

    private boolean cleanupEnabled = true;
    private Duration pendingMaxAge = Duration.ofHours(24);
    private Duration deletedRetention = Duration.ofDays(30);
    private Duration cleanupInterval = Duration.ofHours(1);

    private String signedUrlSecret = "";

    public List<String> getImageExtensions() {
        return imageExtensions;
    }

    public void setImageExtensions(List<String> imageExtensions) {
        this.imageExtensions = imageExtensions;
    }

    public List<String> getVideoExtensions() {
        return videoExtensions;
    }

    public void setVideoExtensions(List<String> videoExtensions) {
        this.videoExtensions = videoExtensions;
    }

    public List<String> getDocumentExtensions() {
        return documentExtensions;
    }

    public void setDocumentExtensions(List<String> documentExtensions) {
        this.documentExtensions = documentExtensions;
    }

    public long getMaxImageBytes() {
        return maxImageBytes;
    }

    public void setMaxImageBytes(long maxImageBytes) {
        this.maxImageBytes = maxImageBytes;
    }

    public long getMaxDocumentBytes() {
        return maxDocumentBytes;
    }

    public void setMaxDocumentBytes(long maxDocumentBytes) {
        this.maxDocumentBytes = maxDocumentBytes;
    }

    public long getMaxVideoBytes() {
        return maxVideoBytes;
    }

    public void setMaxVideoBytes(long maxVideoBytes) {
        this.maxVideoBytes = maxVideoBytes;
    }

    public int getMaxAttachmentsPerMessage() {
        return maxAttachmentsPerMessage;
    }

    public void setMaxAttachmentsPerMessage(int maxAttachmentsPerMessage) {
        this.maxAttachmentsPerMessage = maxAttachmentsPerMessage;
    }

    public int getMaxVideosPerMessage() {
        return maxVideosPerMessage;
    }

    public void setMaxVideosPerMessage(int maxVideosPerMessage) {
        this.maxVideosPerMessage = maxVideosPerMessage;
    }

    public Duration getUploadSessionTtl() {
        return uploadSessionTtl;
    }

    public void setUploadSessionTtl(Duration uploadSessionTtl) {
        this.uploadSessionTtl = uploadSessionTtl;
    }

    public Duration getPresignedUploadTtl() {
        return presignedUploadTtl;
    }

    public void setPresignedUploadTtl(Duration presignedUploadTtl) {
        this.presignedUploadTtl = presignedUploadTtl;
    }

    public Duration getSignedAccessTtl() {
        return signedAccessTtl;
    }

    public void setSignedAccessTtl(Duration signedAccessTtl) {
        this.signedAccessTtl = signedAccessTtl;
    }

    public boolean isCleanupEnabled() {
        return cleanupEnabled;
    }

    public void setCleanupEnabled(boolean cleanupEnabled) {
        this.cleanupEnabled = cleanupEnabled;
    }

    public Duration getPendingMaxAge() {
        return pendingMaxAge;
    }

    public void setPendingMaxAge(Duration pendingMaxAge) {
        this.pendingMaxAge = pendingMaxAge;
    }

    public Duration getDeletedRetention() {
        return deletedRetention;
    }

    public void setDeletedRetention(Duration deletedRetention) {
        this.deletedRetention = deletedRetention;
    }

    public Duration getCleanupInterval() {
        return cleanupInterval;
    }

    public void setCleanupInterval(Duration cleanupInterval) {
        this.cleanupInterval = cleanupInterval;
    }

    public String getSignedUrlSecret() {
        return signedUrlSecret;
    }

    public void setSignedUrlSecret(String signedUrlSecret) {
        this.signedUrlSecret = signedUrlSecret;
    }
}
