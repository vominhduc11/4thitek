package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminFinancialSettlementResponse;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentRequest;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentResponse;
import com.devwonder.backend.dto.admin.AdminUnmatchedPaymentResponse;
import com.devwonder.backend.dto.admin.AdminUpdateFinancialSettlementRequest;
import com.devwonder.backend.dto.admin.AdminUpdateUnmatchedPaymentRequest;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderAdjustment;
import com.devwonder.backend.entity.UnmatchedPayment;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.OrderAdjustmentRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.UnmatchedPaymentRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin service for financial operations introduced by BUSINESS_LOGIC.md:
 * - FinancialSettlement resolution (Section 3.4)
 * - OrderAdjustment append (Section 3.25)
 * - UnmatchedPayment review (Section 3.21)
 */
@Service
@RequiredArgsConstructor
public class AdminFinancialService {

    private final FinancialSettlementRepository financialSettlementRepository;
    private final OrderAdjustmentRepository orderAdjustmentRepository;
    private final UnmatchedPaymentRepository unmatchedPaymentRepository;
    private final OrderRepository orderRepository;

    // ---- FinancialSettlement ----

    @Transactional(readOnly = true)
    public List<AdminFinancialSettlementResponse> getFinancialSettlements() {
        return financialSettlementRepository.findAll().stream()
                .map(this::toSettlementResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminFinancialSettlementResponse> getFinancialSettlementsByStatus(FinancialSettlementStatus status) {
        return financialSettlementRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toSettlementResponse)
                .toList();
    }

    @Transactional
    public AdminFinancialSettlementResponse resolveFinancialSettlement(
            Long id,
            AdminUpdateFinancialSettlementRequest request,
            String resolvedBy
    ) {
        FinancialSettlement settlement = financialSettlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Financial settlement not found: " + id));

        if (settlement.getStatus() != FinancialSettlementStatus.PENDING) {
            throw new BadRequestException("Financial settlement is already resolved with status: " + settlement.getStatus());
        }
        FinancialSettlementStatus newStatus = request.status();
        if (newStatus == FinancialSettlementStatus.PENDING) {
            throw new BadRequestException("Cannot transition financial settlement back to PENDING");
        }

        settlement.setStatus(newStatus);
        settlement.setResolution(request.resolution().trim());
        settlement.setResolvedBy(resolvedBy);
        settlement.setResolvedAt(Instant.now());
        return toSettlementResponse(financialSettlementRepository.save(settlement));
    }

    private AdminFinancialSettlementResponse toSettlementResponse(FinancialSettlement s) {
        Order order = s.getOrder();
        return new AdminFinancialSettlementResponse(
                s.getId(),
                order != null ? order.getId() : null,
                order != null ? order.getOrderCode() : null,
                s.getType(),
                s.getAmount(),
                s.getStatus(),
                s.getCreatedBy(),
                s.getCreatedAt(),
                s.getResolution(),
                s.getResolvedBy(),
                s.getResolvedAt()
        );
    }

    // ---- OrderAdjustment ----

    @Transactional(readOnly = true)
    public List<AdminOrderAdjustmentResponse> getOrderAdjustments(Long orderId) {
        orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return orderAdjustmentRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(this::toAdjustmentResponse)
                .toList();
    }

    @Transactional
    public AdminOrderAdjustmentResponse createOrderAdjustment(
            Long orderId,
            AdminOrderAdjustmentRequest request,
            String createdBy,
            String createdByRole
    ) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (request.amount() == null) {
            throw new BadRequestException("amount is required");
        }
        String reason = request.reason() == null ? null : request.reason().trim();
        if (reason == null || reason.length() < 10) {
            throw new BadRequestException("reason must be at least 10 characters");
        }

        OrderAdjustment adjustment = new OrderAdjustment();
        adjustment.setOrder(order);
        adjustment.setType(request.type());
        adjustment.setAmount(request.amount());
        adjustment.setReason(reason);
        adjustment.setReferenceCode(request.referenceCode() != null ? request.referenceCode().trim() : null);
        adjustment.setCreatedBy(createdBy);
        adjustment.setCreatedByRole(createdByRole);

        return toAdjustmentResponse(orderAdjustmentRepository.save(adjustment));
    }

    private AdminOrderAdjustmentResponse toAdjustmentResponse(OrderAdjustment a) {
        return new AdminOrderAdjustmentResponse(
                a.getId(),
                a.getOrder() != null ? a.getOrder().getId() : null,
                a.getType(),
                a.getAmount(),
                a.getReason(),
                a.getReferenceCode(),
                a.getCreatedBy(),
                a.getCreatedByRole(),
                a.getCreatedAt()
        );
    }

    // ---- UnmatchedPayment ----

    @Transactional(readOnly = true)
    public Page<AdminUnmatchedPaymentResponse> getUnmatchedPayments(
            String status,
            String reason,
            Pageable pageable
    ) {
        if (status != null && reason != null) {
            UnmatchedPaymentStatus s = UnmatchedPaymentStatus.valueOf(status.toUpperCase());
            com.devwonder.backend.entity.enums.UnmatchedPaymentReason r =
                    com.devwonder.backend.entity.enums.UnmatchedPaymentReason.valueOf(reason.toUpperCase());
            return unmatchedPaymentRepository.findByStatusAndReason(s, r, pageable)
                    .map(this::toUnmatchedResponse);
        } else if (status != null) {
            UnmatchedPaymentStatus s = UnmatchedPaymentStatus.valueOf(status.toUpperCase());
            return unmatchedPaymentRepository.findByStatus(s, pageable).map(this::toUnmatchedResponse);
        } else if (reason != null) {
            com.devwonder.backend.entity.enums.UnmatchedPaymentReason r =
                    com.devwonder.backend.entity.enums.UnmatchedPaymentReason.valueOf(reason.toUpperCase());
            return unmatchedPaymentRepository.findByReason(r, pageable).map(this::toUnmatchedResponse);
        }
        return unmatchedPaymentRepository.findAll(pageable).map(this::toUnmatchedResponse);
    }

    @Transactional
    public AdminUnmatchedPaymentResponse resolveUnmatchedPayment(
            Long id,
            AdminUpdateUnmatchedPaymentRequest request,
            String resolvedBy
    ) {
        UnmatchedPayment payment = unmatchedPaymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unmatched payment not found: " + id));

        if (payment.getStatus() != UnmatchedPaymentStatus.PENDING) {
            throw new BadRequestException("Unmatched payment is already resolved with status: " + payment.getStatus());
        }

        UnmatchedPaymentStatus newStatus = request.status();
        if (newStatus == UnmatchedPaymentStatus.PENDING) {
            throw new BadRequestException("Cannot transition unmatched payment back to PENDING");
        }
        if (newStatus == UnmatchedPaymentStatus.MATCHED && request.matchedOrderId() == null) {
            throw new BadRequestException("matchedOrderId is required when status = MATCHED");
        }
        if (newStatus == UnmatchedPaymentStatus.MATCHED || newStatus == UnmatchedPaymentStatus.REFUNDED
                || newStatus == UnmatchedPaymentStatus.WRITTEN_OFF) {
            if (request.resolution() == null || request.resolution().isBlank()) {
                throw new BadRequestException("resolution is required");
            }
        }

        payment.setStatus(newStatus);
        payment.setResolution(request.resolution() != null ? request.resolution().trim() : null);
        payment.setResolvedBy(resolvedBy);
        payment.setResolvedAt(Instant.now());
        if (request.matchedOrderId() != null) {
            payment.setMatchedOrderId(request.matchedOrderId());
        }
        return toUnmatchedResponse(unmatchedPaymentRepository.save(payment));
    }

    private AdminUnmatchedPaymentResponse toUnmatchedResponse(UnmatchedPayment p) {
        return new AdminUnmatchedPaymentResponse(
                p.getId(),
                p.getTransactionCode(),
                p.getAmount(),
                p.getSenderInfo(),
                p.getContent(),
                p.getOrderCodeHint(),
                p.getReceivedAt(),
                p.getReason(),
                p.getStatus(),
                p.getCreatedAt(),
                p.getResolution(),
                p.getResolvedBy(),
                p.getResolvedAt(),
                p.getMatchedOrderId()
        );
    }
}
