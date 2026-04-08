package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.SupportTicketMessageAuthorRole;
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
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "support_ticket_messages")
@Getter
@Setter
@NoArgsConstructor
public class SupportTicketMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private DealerSupportTicket ticket;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_role", nullable = false)
    private SupportTicketMessageAuthorRole authorRole;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "internal_note", nullable = false)
    private Boolean internalNote = Boolean.FALSE;

    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
