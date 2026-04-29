package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminAuditLogResponse;
import com.devwonder.backend.entity.AuditLog;
import com.devwonder.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void save(AuditLog auditLog) {
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> getLogs(Pageable pageable) {
        return getLogs(pageable, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> getLogs(
            Pageable pageable,
            java.time.Instant from,
            java.time.Instant to,
            String actor,
            String action,
            String entityType,
            String entityId
    ) {
        Pageable effectivePageable = pageable == null || pageable.isUnpaged()
                ? PageRequest.of(0, 50)
                : pageable;
        String normalizedActor = (actor != null && !actor.isBlank()) ? actor.trim() : null;
        String normalizedAction = (action != null && !action.isBlank()) ? action.trim() : null;
        String normalizedEntityType = (entityType != null && !entityType.isBlank()) ? entityType.trim() : null;
        String normalizedEntityId = (entityId != null && !entityId.isBlank()) ? entityId.trim() : null;
        boolean hasFilters = from != null || to != null
                || normalizedActor != null || normalizedAction != null
                || normalizedEntityType != null || normalizedEntityId != null;
        if (hasFilters) {
            return auditLogRepository.findByFilters(
                    from, to,
                    normalizedActor,
                    normalizedAction,
                    normalizedEntityType,
                    normalizedEntityId,
                    effectivePageable
            ).map(AuditLogService::toResponse);
        }
        return auditLogRepository.findAllByOrderByCreatedAtDesc(effectivePageable)
                .map(AuditLogService::toResponse);
    }

    private static AdminAuditLogResponse toResponse(AuditLog log) {
        return new AdminAuditLogResponse(
                log.getId(),
                log.getCreatedAt(),
                log.getActor(),
                log.getActorRole(),
                log.getAction(),
                log.getRequestMethod(),
                log.getRequestPath(),
                log.getEntityType(),
                log.getEntityId(),
                log.getIpAddress()
        );
    }
}
