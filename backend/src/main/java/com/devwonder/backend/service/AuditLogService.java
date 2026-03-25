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
        Pageable effectivePageable = pageable == null || pageable.isUnpaged()
                ? PageRequest.of(0, 50)
                : pageable;
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
