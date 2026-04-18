package com.devwonder.backend.service;

import com.devwonder.backend.config.MediaProperties;
import com.devwonder.backend.dto.media.AdminMediaListItemResponse;
import com.devwonder.backend.dto.media.AdminMediaSummaryResponse;
import com.devwonder.backend.dto.media.CreateMediaUploadSessionRequest;
import com.devwonder.backend.dto.media.FinalizeMediaUploadRequest;
import com.devwonder.backend.dto.media.MediaAccessUrlResponse;
import com.devwonder.backend.dto.media.MediaAssetResponse;
import com.devwonder.backend.dto.media.MediaUploadMethod;
import com.devwonder.backend.dto.media.MediaUploadSessionResponse;
import com.devwonder.backend.dto.media.UpdateAdminMediaRequest;
import com.devwonder.backend.dto.support.SupportTicketAttachmentResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.DealerSupportTicket;
import com.devwonder.backend.entity.MediaAsset;
import com.devwonder.backend.entity.SupportTicketMessage;
import com.devwonder.backend.entity.SupportTicketMessageAttachment;
import com.devwonder.backend.entity.enums.MediaCategory;
import com.devwonder.backend.entity.enums.MediaLinkedEntityType;
import com.devwonder.backend.entity.enums.MediaStatus;
import com.devwonder.backend.entity.enums.MediaType;
import com.devwonder.backend.entity.enums.StorageProvider;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.MediaAssetRepository;
import com.devwonder.backend.repository.SupportTicketMessageRepository;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.SequenceInputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MediaAssetService {

    private final MediaAssetRepository mediaAssetRepository;
    private final SupportTicketMessageRepository supportTicketMessageRepository;
    private final AccountRepository accountRepository;
    private final FileStorageService fileStorageService;
    private final MediaFileValidationService mediaFileValidationService;
    private final MediaSignedUrlService mediaSignedUrlService;
    private final MediaProperties mediaProperties;

    public MediaAssetService(
            MediaAssetRepository mediaAssetRepository,
            SupportTicketMessageRepository supportTicketMessageRepository,
            AccountRepository accountRepository,
            FileStorageService fileStorageService,
            MediaFileValidationService mediaFileValidationService,
            MediaSignedUrlService mediaSignedUrlService,
            MediaProperties mediaProperties
    ) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.supportTicketMessageRepository = supportTicketMessageRepository;
        this.accountRepository = accountRepository;
        this.fileStorageService = fileStorageService;
        this.mediaFileValidationService = mediaFileValidationService;
        this.mediaSignedUrlService = mediaSignedUrlService;
        this.mediaProperties = mediaProperties;
        if ("local".equalsIgnoreCase(fileStorageService.providerName())) {
            log.warn(
                    "Support media storage is using local provider. Video uploads will use multipart fallback and are intended for development only; configure app.storage.provider=s3 or minio in production."
            );
        }
    }

    @Transactional
    public MediaUploadSessionResponse createUploadSession(
            Account actor,
            CreateMediaUploadSessionRequest request,
            String appBaseUrl
    ) {
        Account safeActor = requireActor(actor);
        MediaCategory category = resolveCategory(request.category());
        if (category != MediaCategory.SUPPORT_TICKET) {
            throw new BadRequestException("Only SUPPORT_TICKET media category is supported");
        }

        MediaFileValidationService.ValidatedMediaFile metadata = mediaFileValidationService.validateMetadata(
                request.fileName(),
                request.contentType(),
                request.sizeBytes()
        );

        String objectPrefix = buildSupportObjectPrefix(safeActor);
        String objectKey = fileStorageService.createRandomObjectKey(objectPrefix, metadata.extension());

        MediaAsset mediaAsset = new MediaAsset();
        mediaAsset.setObjectKey(objectKey);
        mediaAsset.setOriginalFileName(metadata.fileName());
        mediaAsset.setStoredFileName(metadata.fileName());
        mediaAsset.setContentType(metadata.contentType());
        mediaAsset.setMediaType(metadata.mediaType());
        mediaAsset.setCategory(category);
        mediaAsset.setSizeBytes(metadata.sizeBytes());
        mediaAsset.setStorageProvider(resolveStorageProvider());
        mediaAsset.setOwnerAccount(isDealer(actor) ? actor : null);
        mediaAsset.setUploadedByAccount(safeActor);
        mediaAsset.setStatus(MediaStatus.PENDING);

        MediaAsset saved = mediaAssetRepository.save(mediaAsset);
        Instant expiresAt = Instant.now().plus(mediaProperties.getUploadSessionTtl());

        if (fileStorageService.isS3CompatibleProvider()) {
            String uploadUrl = fileStorageService.createPresignedUploadUrl(
                    saved.getObjectKey(),
                    saved.getContentType(),
                    mediaProperties.getPresignedUploadTtl()
            );
            return new MediaUploadSessionResponse(
                    saved.getId(),
                    MediaUploadMethod.PRESIGNED_PUT,
                    uploadUrl,
                    Map.of("Content-Type", saved.getContentType()),
                    expiresAt
            );
        }

        return new MediaUploadSessionResponse(
                saved.getId(),
                MediaUploadMethod.MULTIPART,
                appBaseUrl + "/api/v1/media/upload-session/" + saved.getId() + "/content",
                Map.of(),
                expiresAt
        );
    }

    @Transactional
    public MediaAssetResponse uploadLocalSessionContent(
            Long mediaAssetId,
            Account actor,
            MultipartFile file,
            String appBaseUrl
    ) {
        if (fileStorageService.isS3CompatibleProvider()) {
            throw new BadRequestException("Local multipart upload is only available with local storage provider");
        }
        MediaAsset mediaAsset = requirePendingOwnedAsset(mediaAssetId, actor);
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("file is required");
        }
        if (file.getSize() != mediaAsset.getSizeBytes()) {
            throw new BadRequestException("Uploaded file size does not match upload session");
        }

        MediaFileValidationService.ValidatedMediaFile metadata = mediaFileValidationService.validateMetadata(
                mediaAsset.getOriginalFileName(),
                mediaAsset.getContentType(),
                file.getSize()
        );

        try (InputStream inputStream = file.getInputStream()) {
            byte[] headBytes = inputStream.readNBytes(mediaFileValidationService.magicByteReadLimit());
            mediaFileValidationService.validateMagicBytes(metadata, headBytes);
            InputStream mergedStream = new SequenceInputStream(new ByteArrayInputStream(headBytes), inputStream);
            fileStorageService.write(mediaAsset.getObjectKey(), mergedStream, file.getSize(), mediaAsset.getContentType());
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot store uploaded media", ex);
        }

        return toMediaAssetResponse(mediaAsset, appBaseUrl, null);
    }

    @Transactional
    public MediaAssetResponse finalizeUpload(
            Account actor,
            FinalizeMediaUploadRequest request,
            String appBaseUrl
    ) {
        MediaAsset mediaAsset = requireOwnedOrAdmin(request.mediaAssetId(), actor);
        if (mediaAsset.getStatus() != MediaStatus.PENDING && mediaAsset.getStatus() != MediaStatus.ACTIVE) {
            throw new BadRequestException("Media upload cannot be finalized in current state");
        }

        if (!fileStorageService.exists(mediaAsset.getObjectKey())) {
            throw new BadRequestException("Uploaded object is missing");
        }

        long contentLength = fileStorageService.contentLength(mediaAsset.getObjectKey());
        MediaFileValidationService.ValidatedMediaFile metadata = mediaFileValidationService.validateMetadata(
                mediaAsset.getOriginalFileName(),
                mediaAsset.getContentType(),
                contentLength
        );
        byte[] headBytes = fileStorageService.readHeadBytes(
                mediaAsset.getObjectKey(),
                mediaFileValidationService.magicByteReadLimit()
        );
        mediaFileValidationService.validateMagicBytes(metadata, headBytes);

        mediaAsset.setSizeBytes(contentLength);
        if (mediaAsset.getFinalizedAt() == null) {
            mediaAsset.setFinalizedAt(Instant.now());
        }

        MediaAsset saved = mediaAssetRepository.save(mediaAsset);
        return toMediaAssetResponse(saved, appBaseUrl, actor);
    }

    @Transactional(readOnly = true)
    public FileStorageService.StoredFile openForDownloadAsActor(Long mediaAssetId, Account actor) {
        MediaAsset mediaAsset = requireDownloadableAsset(mediaAssetId, actor);
        return fileStorageService.open(mediaAsset.getObjectKey());
    }

    @Transactional(readOnly = true)
    public FileStorageService.StoredFile openForDownloadByToken(Long expectedMediaAssetId, String token) {
        MediaSignedUrlService.SignedToken parsed = mediaSignedUrlService.verify(token);
        if (!Objects.equals(parsed.mediaAssetId(), expectedMediaAssetId)) {
            throw new AccessDeniedException("Access denied");
        }
        Account account = accountRepository.findById(parsed.accountId())
                .orElseThrow(() -> new AccessDeniedException("Access denied"));
        MediaAsset mediaAsset = requireDownloadableAsset(parsed.mediaAssetId(), account);
        return fileStorageService.open(mediaAsset.getObjectKey());
    }

    @Transactional(readOnly = true)
    public String resolveDownloadFileName(Long mediaAssetId) {
        MediaAsset mediaAsset = mediaAssetRepository.findById(mediaAssetId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found"));
        return mediaAsset.getOriginalFileName();
    }

    @Transactional(readOnly = true)
    public MediaAccessUrlResponse createSignedAccessUrl(Long mediaAssetId, Account actor, String appBaseUrl) {
        MediaAsset mediaAsset = requireDownloadableAsset(mediaAssetId, actor);
        Instant expiresAt = Instant.now().plus(mediaProperties.getSignedAccessTtl());
        String token = mediaSignedUrlService.sign(mediaAsset.getId(), actor.getId(), expiresAt);
        String accessUrl = appBaseUrl + "/api/v1/media/" + mediaAsset.getId() + "/download?token=" + token;
        return new MediaAccessUrlResponse(mediaAsset.getId(), accessUrl, expiresAt);
    }

    @Transactional(readOnly = true)
    public Page<AdminMediaListItemResponse> listAdminMedia(
            Pageable pageable,
            MediaType mediaType,
            MediaStatus status,
            MediaCategory category,
            String query,
            Instant createdFrom,
            Instant createdTo,
            String appBaseUrl
    ) {
        Specification<MediaAsset> specification = Specification.where(null);
        specification = specification.and((root, cq, cb) -> cb.equal(root.get("category"), MediaCategory.SUPPORT_TICKET));

        if (mediaType != null) {
            specification = specification.and((root, cq, cb) -> cb.equal(root.get("mediaType"), mediaType));
        }
        if (status != null) {
            specification = specification.and((root, cq, cb) -> cb.equal(root.get("status"), status));
        }
        if (category != null) {
            specification = specification.and((root, cq, cb) -> cb.equal(root.get("category"), category));
        }
        if (StringUtils.hasText(query)) {
            String normalized = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("originalFileName")), normalized),
                    cb.like(cb.lower(root.get("objectKey")), normalized)
            ));
        }
        if (createdFrom != null) {
            specification = specification.and((root, cq, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom));
        }
        if (createdTo != null) {
            specification = specification.and((root, cq, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), createdTo));
        }

        Page<MediaAsset> page = mediaAssetRepository.findAll(specification, pageable);

        Set<Long> linkedMessageIds = page.getContent().stream()
                .filter(asset -> asset.getLinkedEntityType() == MediaLinkedEntityType.SUPPORT_TICKET_MESSAGE)
                .map(MediaAsset::getLinkedEntityId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        Map<Long, SupportTicketMessage> messageMap = supportTicketMessageRepository.findByIdIn(linkedMessageIds)
                .stream()
                .collect(java.util.stream.Collectors.toMap(SupportTicketMessage::getId, message -> message));

        return page.map(asset -> toAdminMediaListItem(asset, messageMap.get(asset.getLinkedEntityId()), appBaseUrl));
    }

    @Transactional(readOnly = true)
    public AdminMediaSummaryResponse summarizeSupportMedia() {
        Object[] row = mediaAssetRepository.summarizeByCategory(MediaCategory.SUPPORT_TICKET);
        if (row == null || row.length < 7) {
            return new AdminMediaSummaryResponse(0, 0, 0, 0, 0, 0, 0);
        }
        return new AdminMediaSummaryResponse(
                toLong(row[0]),
                toLong(row[1]),
                toLong(row[2]),
                toLong(row[3]),
                toLong(row[4]),
                toLong(row[5]),
                toLong(row[6])
        );
    }

    @Transactional
    public AdminMediaListItemResponse softDeleteMedia(
            Long mediaAssetId,
            UpdateAdminMediaRequest request,
            String appBaseUrl
    ) {
        MediaAsset mediaAsset = mediaAssetRepository.findById(mediaAssetId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found"));

        boolean force = request != null && Boolean.TRUE.equals(request.force());

        if (mediaAsset.getStatus() == MediaStatus.ACTIVE && mediaAsset.getLinkedEntityType() == MediaLinkedEntityType.SUPPORT_TICKET_MESSAGE) {
            if (!force) {
                throw new BadRequestException("Cannot delete ACTIVE support evidence without force=true");
            }
            if (request == null || !StringUtils.hasText(request.reason())) {
                throw new BadRequestException("reason is required when force deleting active support evidence");
            }
        }

        mediaAsset.setStatus(MediaStatus.DELETED);
        mediaAsset.setDeletedAt(Instant.now());
        MediaAsset saved = mediaAssetRepository.save(mediaAsset);
        SupportTicketMessage linkedMessage = saved.getLinkedEntityType() == MediaLinkedEntityType.SUPPORT_TICKET_MESSAGE
                ? supportTicketMessageRepository.findById(saved.getLinkedEntityId()).orElse(null)
                : null;
        return toAdminMediaListItem(saved, linkedMessage, appBaseUrl);
    }

    @Transactional
    public void hardDeleteMedia(Long mediaAssetId) {
        MediaAsset mediaAsset = mediaAssetRepository.findById(mediaAssetId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found"));

        if (mediaAsset.getStatus() != MediaStatus.DELETED && mediaAsset.getStatus() != MediaStatus.ORPHANED) {
            throw new BadRequestException("Hard delete is only allowed for DELETED or ORPHANED media");
        }
        if (mediaAsset.getStatus() == MediaStatus.ACTIVE) {
            throw new BadRequestException("Cannot hard delete active media");
        }

        fileStorageService.delete(mediaAsset.getObjectKey());
        mediaAssetRepository.delete(mediaAsset);
    }

    @Transactional
    public void attachAssetsToSupportMessage(
            Account actor,
            DealerSupportTicket ticket,
            SupportTicketMessage message,
            List<Long> mediaAssetIds,
            int legacyAttachmentCount,
            int legacyVideoCount
    ) {
        if (mediaAssetIds == null || mediaAssetIds.isEmpty()) {
            if (legacyAttachmentCount > mediaProperties.getMaxAttachmentsPerMessage()) {
                throw new BadRequestException(
                        "attachments must contain at most " + mediaProperties.getMaxAttachmentsPerMessage() + " items"
                );
            }
            if (legacyVideoCount > mediaProperties.getMaxVideosPerMessage()) {
                throw new BadRequestException(
                        "videos must contain at most " + mediaProperties.getMaxVideosPerMessage() + " items"
                );
            }
            return;
        }

        if (message == null || message.getId() == null) {
            throw new BadRequestException("Support ticket message must be persisted before attaching media");
        }

        if (ticket == null || ticket.getId() == null) {
            throw new BadRequestException("Support ticket is required");
        }

        List<Long> uniqueIds = new ArrayList<>(new LinkedHashSet<>(mediaAssetIds));
        Set<Long> existingAttachmentIds = message.getMediaAttachments().stream()
                .map(SupportTicketMessageAttachment::getMediaAsset)
                .filter(Objects::nonNull)
                .map(MediaAsset::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        int existingVideoCount = (int) message.getMediaAttachments().stream()
                .map(SupportTicketMessageAttachment::getMediaAsset)
                .filter(Objects::nonNull)
                .map(MediaAsset::getMediaType)
                .filter(mediaType -> mediaType == MediaType.VIDEO)
                .count();
        int newAttachmentCount = (int) uniqueIds.stream()
                .filter(id -> !existingAttachmentIds.contains(id))
                .count();
        if (legacyAttachmentCount + existingAttachmentIds.size() + newAttachmentCount
                > mediaProperties.getMaxAttachmentsPerMessage()) {
            throw new BadRequestException(
                    "attachments must contain at most " + mediaProperties.getMaxAttachmentsPerMessage() + " items"
            );
        }

        List<MediaAsset> assets = mediaAssetRepository.findAllById(uniqueIds);
        if (assets.size() != uniqueIds.size()) {
            throw new BadRequestException("One or more media assets are invalid");
        }

        Map<Long, MediaAsset> byId = assets.stream().collect(
                java.util.stream.Collectors.toMap(MediaAsset::getId, asset -> asset)
        );

        int newMediaVideoCount = 0;
        int nextSortOrder = message.getMediaAttachments().stream()
                .map(SupportTicketMessageAttachment::getSortOrder)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(-1) + 1;
        for (Long mediaAssetId : uniqueIds) {
            MediaAsset mediaAsset = byId.get(mediaAssetId);
            if (mediaAsset == null) {
                throw new BadRequestException("One or more media assets are invalid");
            }
            if (mediaAsset.getCategory() != MediaCategory.SUPPORT_TICKET) {
                throw new BadRequestException("Unsupported media category for support ticket message");
            }
            if (mediaAsset.getStatus() != MediaStatus.PENDING && mediaAsset.getStatus() != MediaStatus.ACTIVE) {
                throw new BadRequestException("Media asset is not available for attachment");
            }
            if (!isAdmin(actor) && !Objects.equals(
                    mediaAsset.getUploadedByAccount() == null ? null : mediaAsset.getUploadedByAccount().getId(),
                    actor.getId())) {
                throw new AccessDeniedException("Access denied");
            }
            if (mediaAsset.getFinalizedAt() == null) {
                throw new BadRequestException("Media asset is not finalized");
            }
            if (!fileStorageService.exists(mediaAsset.getObjectKey())) {
                throw new BadRequestException("Media asset object is missing");
            }

            boolean linkedToCurrentMessage = mediaAsset.getLinkedEntityType() == MediaLinkedEntityType.SUPPORT_TICKET_MESSAGE
                    && Objects.equals(mediaAsset.getLinkedEntityId(), message.getId());
            if (mediaAsset.getLinkedEntityType() != null && !linkedToCurrentMessage) {
                throw new BadRequestException("Media asset is already linked to another entity");
            }
            if (mediaAsset.getStatus() == MediaStatus.ACTIVE && !linkedToCurrentMessage) {
                throw new BadRequestException("Media asset is already active on another message");
            }

            boolean alreadyInMessage = existingAttachmentIds.contains(mediaAsset.getId());
            if (!alreadyInMessage) {
                if (mediaAsset.getMediaType() == MediaType.VIDEO) {
                    newMediaVideoCount++;
                }
                SupportTicketMessageAttachment attachment = new SupportTicketMessageAttachment();
                attachment.setMediaAsset(mediaAsset);
                attachment.setSortOrder(nextSortOrder++);
                message.addMediaAttachment(attachment);
                existingAttachmentIds.add(mediaAsset.getId());
            }

            mediaAsset.setStatus(MediaStatus.ACTIVE);
            mediaAsset.setLinkedEntityType(MediaLinkedEntityType.SUPPORT_TICKET_MESSAGE);
            mediaAsset.setLinkedEntityId(message.getId());
            mediaAsset.setDeletedAt(null);
        }

        if (legacyVideoCount + existingVideoCount + newMediaVideoCount > mediaProperties.getMaxVideosPerMessage()) {
            throw new BadRequestException(
                    "videos must contain at most " + mediaProperties.getMaxVideosPerMessage() + " items"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<SupportTicketAttachmentResponse> buildMediaAttachmentResponses(
            SupportTicketMessage message,
            Account viewer,
            String appBaseUrl
    ) {
        if (message == null || message.getMediaAttachments() == null || message.getMediaAttachments().isEmpty()) {
            return List.of();
        }

        Long viewerId = viewer == null ? null : viewer.getId();
        return message.getMediaAttachments().stream()
                .sorted(Comparator.comparingInt(value -> value.getSortOrder() == null ? Integer.MAX_VALUE : value.getSortOrder()))
                .map(SupportTicketMessageAttachment::getMediaAsset)
                .filter(Objects::nonNull)
                .map(asset -> toSupportAttachmentResponse(asset, appBaseUrl, viewerId))
                .toList();
    }

    @Transactional
    public int cleanupPendingMedia() {
        Instant threshold = Instant.now().minus(mediaProperties.getPendingMaxAge());
        List<MediaAsset> pendingAssets = mediaAssetRepository.findByStatusAndCreatedAtBefore(MediaStatus.PENDING, threshold);
        int affected = 0;
        for (MediaAsset mediaAsset : pendingAssets) {
            boolean deleted = fileStorageService.delete(mediaAsset.getObjectKey());
            mediaAsset.setStatus(deleted ? MediaStatus.DELETED : MediaStatus.ORPHANED);
            mediaAsset.setDeletedAt(Instant.now());
            affected++;
        }
        return affected;
    }

    @Transactional
    public int cleanupDeletedMedia() {
        Instant threshold = Instant.now().minus(mediaProperties.getDeletedRetention());
        List<MediaAsset> deletedAssets = mediaAssetRepository.findByStatusAndDeletedAtBefore(MediaStatus.DELETED, threshold);
        int affected = 0;
        for (MediaAsset mediaAsset : deletedAssets) {
            fileStorageService.delete(mediaAsset.getObjectKey());
            mediaAssetRepository.delete(mediaAsset);
            affected++;
        }
        return affected;
    }

    @Transactional
    public int markBrokenSupportLinksAsOrphaned() {
        List<Long> brokenAssetIds = mediaAssetRepository.findBrokenSupportMessageLinkedAssetIds();
        if (brokenAssetIds.isEmpty()) {
            return 0;
        }
        List<MediaAsset> assets = mediaAssetRepository.findAllById(brokenAssetIds);
        for (MediaAsset mediaAsset : assets) {
            mediaAsset.setStatus(MediaStatus.ORPHANED);
            mediaAsset.setDeletedAt(Instant.now());
        }
        return assets.size();
    }

    private SupportTicketAttachmentResponse toSupportAttachmentResponse(
            MediaAsset mediaAsset,
            String appBaseUrl,
            Long viewerAccountId
    ) {
        String downloadUrl = buildDownloadUrl(mediaAsset.getId(), appBaseUrl);
        String signedAccessUrl = downloadUrl;
        if (viewerAccountId != null) {
            Instant expiresAt = Instant.now().plus(mediaProperties.getSignedAccessTtl());
            String token = mediaSignedUrlService.sign(mediaAsset.getId(), viewerAccountId, expiresAt);
            signedAccessUrl = downloadUrl + "?token=" + token;
        }

        return new SupportTicketAttachmentResponse(
                mediaAsset.getId(),
                downloadUrl,
                signedAccessUrl,
                mediaAsset.getOriginalFileName(),
                mediaAsset.getMediaType(),
                mediaAsset.getContentType(),
                mediaAsset.getSizeBytes(),
                mediaAsset.getCreatedAt()
        );
    }

    private AdminMediaListItemResponse toAdminMediaListItem(
            MediaAsset mediaAsset,
            SupportTicketMessage linkedMessage,
            String appBaseUrl
    ) {
        String ownerName = resolveAccountDisplayName(mediaAsset.getOwnerAccount());
        String uploaderName = resolveAccountDisplayName(mediaAsset.getUploadedByAccount());
        Long linkedTicketId = null;
        String linkedTicketCode = null;
        String linkedDealerName = null;
        if (linkedMessage != null && linkedMessage.getTicket() != null) {
            linkedTicketId = linkedMessage.getTicket().getId();
            linkedTicketCode = linkedMessage.getTicket().getTicketCode();
            if (linkedMessage.getTicket().getDealer() != null) {
                linkedDealerName = firstNonBlank(
                        linkedMessage.getTicket().getDealer().getBusinessName(),
                        linkedMessage.getTicket().getDealer().getContactName(),
                        linkedMessage.getTicket().getDealer().getUsername(),
                        linkedMessage.getTicket().getDealer().getEmail()
                );
            }
        }

        return new AdminMediaListItemResponse(
                mediaAsset.getId(),
                mediaAsset.getObjectKey(),
                mediaAsset.getOriginalFileName(),
                mediaAsset.getMediaType(),
                mediaAsset.getContentType(),
                mediaAsset.getSizeBytes(),
                mediaAsset.getCategory(),
                mediaAsset.getStatus(),
                mediaAsset.getOwnerAccount() == null ? null : mediaAsset.getOwnerAccount().getId(),
                ownerName,
                mediaAsset.getUploadedByAccount() == null ? null : mediaAsset.getUploadedByAccount().getId(),
                uploaderName,
                linkedTicketId,
                linkedTicketCode,
                linkedDealerName,
                buildDownloadUrl(mediaAsset.getId(), appBaseUrl),
                mediaAsset.getCreatedAt(),
                mediaAsset.getFinalizedAt(),
                mediaAsset.getDeletedAt()
        );
    }

    private MediaAssetResponse toMediaAssetResponse(MediaAsset mediaAsset, String appBaseUrl, Account actor) {
        String downloadUrl = buildDownloadUrl(mediaAsset.getId(), appBaseUrl);
        String accessUrl = downloadUrl;
        if (actor != null && actor.getId() != null) {
            Instant expiresAt = Instant.now().plus(mediaProperties.getSignedAccessTtl());
            String token = mediaSignedUrlService.sign(mediaAsset.getId(), actor.getId(), expiresAt);
            accessUrl = downloadUrl + "?token=" + token;
        }
        return new MediaAssetResponse(
                mediaAsset.getId(),
                mediaAsset.getObjectKey(),
                mediaAsset.getOriginalFileName(),
                mediaAsset.getContentType(),
                mediaAsset.getMediaType(),
                mediaAsset.getCategory(),
                mediaAsset.getSizeBytes(),
                mediaAsset.getStorageProvider(),
                mediaAsset.getOwnerAccount() == null ? null : mediaAsset.getOwnerAccount().getId(),
                mediaAsset.getUploadedByAccount() == null ? null : mediaAsset.getUploadedByAccount().getId(),
                mediaAsset.getStatus(),
                mediaAsset.getLinkedEntityType(),
                mediaAsset.getLinkedEntityId(),
                downloadUrl,
                accessUrl,
                mediaAsset.getCreatedAt(),
                mediaAsset.getFinalizedAt(),
                mediaAsset.getDeletedAt()
        );
    }

    private MediaAsset requirePendingOwnedAsset(Long mediaAssetId, Account actor) {
        MediaAsset mediaAsset = mediaAssetRepository.findById(mediaAssetId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found"));
        if (mediaAsset.getStatus() != MediaStatus.PENDING) {
            throw new BadRequestException("Media upload session is not pending");
        }
        if (!isAdmin(actor)
                && !Objects.equals(
                mediaAsset.getUploadedByAccount() == null ? null : mediaAsset.getUploadedByAccount().getId(),
                actor == null ? null : actor.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        return mediaAsset;
    }

    private MediaAsset requireOwnedOrAdmin(Long mediaAssetId, Account actor) {
        MediaAsset mediaAsset = mediaAssetRepository.findById(mediaAssetId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found"));
        if (isAdmin(actor)) {
            return mediaAsset;
        }
        if (!Objects.equals(
                mediaAsset.getUploadedByAccount() == null ? null : mediaAsset.getUploadedByAccount().getId(),
                actor == null ? null : actor.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        return mediaAsset;
    }

    private MediaAsset requireAccessibleAsset(Long mediaAssetId, Account actor) {
        MediaAsset mediaAsset = mediaAssetRepository.findById(mediaAssetId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found"));
        if (!canAccessMedia(mediaAsset, actor)) {
            throw new AccessDeniedException("Access denied");
        }
        return mediaAsset;
    }

    private MediaAsset requireDownloadableAsset(Long mediaAssetId, Account actor) {
        MediaAsset mediaAsset = requireAccessibleAsset(mediaAssetId, actor);
        if (mediaAsset.getFinalizedAt() == null) {
            throw new BadRequestException("Media asset is not finalized");
        }
        if (!fileStorageService.exists(mediaAsset.getObjectKey())) {
            throw new ResourceNotFoundException("Uploaded file not found");
        }
        return mediaAsset;
    }

    private boolean canAccessMedia(MediaAsset mediaAsset, Account actor) {
        if (actor == null || actor.getId() == null) {
            return false;
        }
        if (isAdmin(actor)) {
            return true;
        }
        if (!isDealer(actor)) {
            return false;
        }

        Long actorId = actor.getId();
        if (mediaAsset.getStatus() == MediaStatus.PENDING) {
            return Objects.equals(
                    mediaAsset.getUploadedByAccount() == null ? null : mediaAsset.getUploadedByAccount().getId(),
                    actorId
            );
        }

        if (mediaAsset.getLinkedEntityType() != MediaLinkedEntityType.SUPPORT_TICKET_MESSAGE
                || mediaAsset.getLinkedEntityId() == null) {
            return false;
        }

        return supportTicketMessageRepository.findWithTicketById(mediaAsset.getLinkedEntityId())
                .filter(message -> !Boolean.TRUE.equals(message.getInternalNote()))
                .filter(message -> message.getTicket() != null && message.getTicket().getDealer() != null)
                .map(message -> Objects.equals(message.getTicket().getDealer().getId(), actorId))
                .orElse(false);
    }

    private StorageProvider resolveStorageProvider() {
        return switch (fileStorageService.providerName().toLowerCase(Locale.ROOT)) {
            case "s3" -> StorageProvider.S3;
            case "minio" -> StorageProvider.MINIO;
            default -> StorageProvider.LOCAL;
        };
    }

    private String buildSupportObjectPrefix(Account actor) {
        Long actorId = actor.getId();
        if (actorId == null) {
            throw new AccessDeniedException("Access denied");
        }
        if (isDealer(actor)) {
            return "support/evidence/dealers/" + actorId;
        }
        return "support/evidence/admin/" + actorId;
    }

    private String buildDownloadUrl(Long mediaAssetId, String appBaseUrl) {
        return appBaseUrl + "/api/v1/media/" + mediaAssetId + "/download";
    }

    private MediaCategory resolveCategory(MediaCategory category) {
        return category == null ? MediaCategory.SUPPORT_TICKET : category;
    }

    private Account requireActor(Account actor) {
        if (actor == null || actor.getId() == null) {
            throw new AccessDeniedException("Access denied");
        }
        return actor;
    }

    private boolean isAdmin(Account account) {
        if (account == null) {
            return false;
        }
        return account.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .anyMatch(role -> "ADMIN".equals(role) || "SUPER_ADMIN".equals(role));
    }

    private boolean isDealer(Account account) {
        if (account == null) {
            return false;
        }
        return account.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .anyMatch("DEALER"::equals);
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private String resolveAccountDisplayName(Account account) {
        if (account == null) {
            return null;
        }
        return firstNonBlank(account.getUsername(), account.getEmail());
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (!StringUtils.hasText(value)) {
                continue;
            }
            String trimmed = value.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
            }
        }
        return null;
    }
}
