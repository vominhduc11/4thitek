package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.UnmatchedPaymentReason;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "unmatched_payments")
@Getter
@Setter
@NoArgsConstructor
public class UnmatchedPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_code")
    private String transactionCode;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "sender_info", columnDefinition = "text")
    private String senderInfo;

    @Column(name = "content", columnDefinition = "text")
    private String content;

    @Column(name = "order_code_hint")
    private String orderCodeHint;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    private UnmatchedPaymentReason reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UnmatchedPaymentStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "resolution", columnDefinition = "text")
    private String resolution;

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    // If admin manually matched to an order
    @Column(name = "matched_order_id")
    private Long matchedOrderId;
}
