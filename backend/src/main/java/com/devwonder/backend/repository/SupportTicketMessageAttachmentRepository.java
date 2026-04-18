package com.devwonder.backend.repository;

import com.devwonder.backend.entity.SupportTicketMessageAttachment;
import com.devwonder.backend.entity.SupportTicketMessageAttachmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportTicketMessageAttachmentRepository
        extends JpaRepository<SupportTicketMessageAttachment, SupportTicketMessageAttachmentId> {
}
