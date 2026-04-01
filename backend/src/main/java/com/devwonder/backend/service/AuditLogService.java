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
        return getLogs(pageable, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> getLogs(
            Pageable pageable,
            java.time.Instant from,
            java.time.Instant to,
            String actor,
            String action
    ) {
        Pageable effectivePageable = pageable == null || pageable.isUnpaged()
                ? PageRequest.of(0, 50)
                : pageable;
        boolean hasFilters = from != null || to != null
                || (actor != null && !actor.isBlank())
                || (action != null && !action.isBlank());
        if (hasFilters) {
            return auditLogRepository.findByFilters(
                    from, to,
                    (actor != null && !actor.isBlank()) ? actor.trim() : null,
                    (action != null && !action.isBlank()) ? action.trim() : null,
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
