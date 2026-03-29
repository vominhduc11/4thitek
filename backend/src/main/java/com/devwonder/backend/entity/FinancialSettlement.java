package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementType;
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

@Entity
@Table(name = "financial_settlements")
@Getter
@Setter
@NoArgsConstructor
public class FinancialSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FinancialSettlementStatus status;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "resolution", columnDefinition = "text")
    private String resolution;

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public void setType(String type) {
        this.type = FinancialSettlementType.requireValidDatabaseValue(type);
    }

    public FinancialSettlementType getTypeEnum() {
        return FinancialSettlementType.fromDatabaseValue(type);
    }
}
