package com.devwonder.backend.repository;

import com.devwonder.backend.entity.AuditLog;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:from IS NULL OR a.createdAt >= :from) AND " +
            "(:to IS NULL OR a.createdAt <= :to) AND " +
            "(:actor IS NULL OR LOWER(a.actor) LIKE LOWER(CONCAT('%', :actor, '%'))) AND " +
            "(:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%'))) AND " +
            "(:entityType IS NULL OR LOWER(a.entityType) LIKE LOWER(CONCAT('%', :entityType, '%'))) AND " +
            "(:entityId IS NULL OR LOWER(a.entityId) LIKE LOWER(CONCAT('%', :entityId, '%'))) " +
            "ORDER BY a.createdAt DESC")
    Page<AuditLog> findByFilters(
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("actor") String actor,
            @Param("action") String action,
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            Pageable pageable);
}
