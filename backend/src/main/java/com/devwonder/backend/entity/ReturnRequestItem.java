package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.ReturnRequestItemCondition;
import com.devwonder.backend.entity.enums.ReturnRequestItemFinalResolution;
import com.devwonder.backend.entity.enums.ReturnRequestItemStatus;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "return_request_items")
@Getter
@Setter
@NoArgsConstructor
public class ReturnRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private ReturnRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_serial_id", nullable = false)
    private ProductSerial productSerial;

    @Column(name = "serial_snapshot", nullable = false)
    private String serialSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_status", nullable = false)
    private ReturnRequestItemStatus itemStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_on_request")
    private ReturnRequestItemCondition conditionOnRequest;

    @Column(name = "admin_decision_note", columnDefinition = "text")
    private String adminDecisionNote;

    @Column(name = "inspection_note", columnDefinition = "text")
    private String inspectionNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_resolution")
    private ReturnRequestItemFinalResolution finalResolution;

    @Column(name = "replacement_order_id")
    private Long replacementOrderId;

    @Column(name = "replacement_serial_id")
    private Long replacementSerialId;

    @Column(name = "refund_amount", precision = 19, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "credit_amount", precision = 19, scale = 2)
    private BigDecimal creditAmount;

    @Column(name = "order_adjustment_id")
    private Long orderAdjustmentId;
}
