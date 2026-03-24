package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.OrderAdjustmentType;
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
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Append-only financial adjustment record for an order.
 * Used by admin to record corrections, write-offs, credit notes, and refund records.
 * See BUSINESS_LOGIC.md Section 3.25.
 */
@Entity
@Table(name = "order_adjustments")
@Getter
@Setter
@NoArgsConstructor
public class OrderAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private OrderAdjustmentType type;

    /**
     * Can be negative (refund/correction) or positive (late payment match).
     */
    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason", nullable = false, columnDefinition = "text")
    private String reason;

    @Column(name = "reference_code")
    private String referenceCode;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_by_role")
    private String createdByRole;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
