package com.devwonder.backend.service;

import com.devwonder.backend.config.MediaProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MediaAssetCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(MediaAssetCleanupJob.class);

    private final MediaProperties mediaProperties;
    private final MediaAssetService mediaAssetService;

    public MediaAssetCleanupJob(MediaProperties mediaProperties, MediaAssetService mediaAssetService) {
        this.mediaProperties = mediaProperties;
        this.mediaAssetService = mediaAssetService;
    }

    @Scheduled(fixedDelayString = "${app.media.cleanup-interval:PT1H}")
    public void cleanup() {
        if (!mediaProperties.isCleanupEnabled()) {
            return;
        }

        int pending = mediaAssetService.cleanupPendingMedia();
        int orphaned = mediaAssetService.markBrokenSupportLinksAsOrphaned();
        int deleted = mediaAssetService.cleanupDeletedMedia();

        if (pending > 0 || orphaned > 0 || deleted > 0) {
            log.info(
                    "Media cleanup completed: pendingProcessed={}, orphanedMarked={}, hardDeleted={}",
                    pending,
                    orphaned,
                    deleted
            );
        }
    }
}
