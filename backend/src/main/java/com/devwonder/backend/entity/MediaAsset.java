package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.MediaCategory;
import com.devwonder.backend.entity.enums.MediaLinkedEntityType;
import com.devwonder.backend.entity.enums.MediaStatus;
import com.devwonder.backend.entity.enums.MediaType;
import com.devwonder.backend.entity.enums.StorageProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "media_assets")
@Getter
@Setter
@NoArgsConstructor
public class MediaAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "object_key", nullable = false, unique = true, length = 1024)
    private String objectKey;

    @Column(name = "original_file_name", nullable = false, length = 512)
    private String originalFileName;

    @Column(name = "stored_file_name", length = 512)
    private String storedFileName;

    @Column(name = "content_type", nullable = false, length = 255)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 32)
    private MediaType mediaType;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 64)
    private MediaCategory category;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_provider", nullable = false, length = 32)
    private StorageProvider storageProvider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_account_id")
    private Account ownerAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_account_id")
    private Account uploadedByAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private MediaStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "linked_entity_type", length = 128)
    private MediaLinkedEntityType linkedEntityType;

    @Column(name = "linked_entity_id")
    private Long linkedEntityId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "finalized_at")
    private Instant finalizedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "mediaAsset")
    private List<SupportTicketMessageAttachment> supportMessageAttachments = new ArrayList<>();
}
