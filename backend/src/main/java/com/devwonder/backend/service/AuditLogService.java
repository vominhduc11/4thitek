package com.devwonder.backend.service;

import com.devwonder.backend.entity.AuditLog;
import com.devwonder.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
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
}
