package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
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

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
