package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Notify;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotifyRepository extends JpaRepository<Notify, UUID> {
    List<Notify> findByAccountIdOrderByCreatedAtDesc(UUID accountId);
    Page<Notify> findByAccountId(UUID accountId, Pageable pageable);
    Optional<Notify> findByIdAndAccountId(UUID id, UUID accountId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Notify n
            set n.isRead = true, n.readAt = :readAt
            where n.account.id = :accountId and (n.isRead = false or n.isRead is null)
            """)
    int markAllReadByAccountId(@Param("accountId") UUID accountId, @Param("readAt") Instant readAt);
}
