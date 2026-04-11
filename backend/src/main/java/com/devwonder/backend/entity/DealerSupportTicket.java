package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "dealer_support_tickets")
@Getter
@Setter
@NoArgsConstructor
public class DealerSupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dealer_id", nullable = false)
    private Dealer dealer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private Admin assignee;

    @Column(name = "ticket_code", nullable = false, unique = true)
    private String ticketCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private DealerSupportCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private DealerSupportPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DealerSupportTicketStatus status;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "context_data", columnDefinition = "text")
    private String contextData;

    // Legacy compatibility mirror for historical tickets and outbound email fallbacks.
    // Active runtime clients must consume the thread in `messages` instead.
    @Column(name = "admin_reply", columnDefinition = "text")
    private String adminReply;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<SupportTicketMessage> messages = new ArrayList<>();

    public void addMessage(SupportTicketMessage supportTicketMessage) {
        if (supportTicketMessage == null) {
            return;
        }
        supportTicketMessage.setTicket(this);
        messages.add(supportTicketMessage);
    }
}
