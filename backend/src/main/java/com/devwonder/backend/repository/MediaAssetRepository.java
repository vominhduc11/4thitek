package com.devwonder.backend.repository;

import com.devwonder.backend.entity.MediaAsset;
import com.devwonder.backend.entity.enums.MediaCategory;
import com.devwonder.backend.entity.enums.MediaStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long>, JpaSpecificationExecutor<MediaAsset> {

    Optional<MediaAsset> findByObjectKey(String objectKey);

    List<MediaAsset> findByStatusAndCreatedAtBefore(MediaStatus status, Instant createdAt);

    List<MediaAsset> findByStatusAndDeletedAtBefore(MediaStatus status, Instant deletedAt);

    @Query("""
            select
              count(m),
              coalesce(sum(m.sizeBytes), 0),
              coalesce(sum(case when m.mediaType = com.devwonder.backend.entity.enums.MediaType.IMAGE then m.sizeBytes else 0 end), 0),
              coalesce(sum(case when m.mediaType = com.devwonder.backend.entity.enums.MediaType.VIDEO then m.sizeBytes else 0 end), 0),
              coalesce(sum(case when m.mediaType = com.devwonder.backend.entity.enums.MediaType.DOCUMENT then m.sizeBytes else 0 end), 0),
              coalesce(sum(case when m.status = com.devwonder.backend.entity.enums.MediaStatus.PENDING then m.sizeBytes else 0 end), 0),
              coalesce(sum(case when m.status = com.devwonder.backend.entity.enums.MediaStatus.ORPHANED then m.sizeBytes else 0 end), 0)
            from MediaAsset m
            where (:category is null or m.category = :category)
            """)
    Object[] summarizeByCategory(@Param("category") MediaCategory category);

    @Query("""
            select m.id
            from MediaAsset m
            where m.status = com.devwonder.backend.entity.enums.MediaStatus.ACTIVE
              and m.linkedEntityType = com.devwonder.backend.entity.enums.MediaLinkedEntityType.SUPPORT_TICKET_MESSAGE
              and m.linkedEntityId is not null
              and not exists (
                  select sm.id
                  from SupportTicketMessage sm
                  where sm.id = m.linkedEntityId
              )
            """)
    List<Long> findBrokenSupportMessageLinkedAssetIds();
}
