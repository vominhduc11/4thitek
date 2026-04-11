package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminFinancialSettlementResponse;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentRequest;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentResponse;
import com.devwonder.backend.dto.admin.AdminOrderPaymentResponse;
import com.devwonder.backend.dto.admin.AdminRecentPaymentResponse;
import com.devwonder.backend.dto.admin.AdminUnmatchedPaymentResponse;
import com.devwonder.backend.dto.admin.AdminUpdateFinancialSettlementRequest;
import com.devwonder.backend.dto.admin.AdminUpdateUnmatchedPaymentRequest;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderAdjustment;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.UnmatchedPayment;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.OrderAdjustmentRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.UnmatchedPaymentRepository;
import com.devwonder.backend.service.support.OrderPricingSupport;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
    private final PaymentRepository paymentRepository;
    private final BulkDiscountRepository bulkDiscountRepository;
    private final AdminSettingsService adminSettingsService;

    // ---- Recent payments ----

    @Transactional(readOnly = true)
    public Page<AdminRecentPaymentResponse> getRecentPayments(
            Long dealerId,
            Instant fromInclusive,
            Instant toInclusive,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            Boolean hasProof,
            Pageable pageable
    ) {
        Specification<Payment> specification = (root, query, criteriaBuilder) -> {
            boolean countQuery = Long.class.equals(query.getResultType()) || long.class.equals(query.getResultType());
            if (!countQuery) {
                query.orderBy(
                        criteriaBuilder.desc(criteriaBuilder.coalesce(root.get("paidAt"), root.get("createdAt"))),
                        criteriaBuilder.desc(root.get("id"))
                );
            }

            List<Predicate> predicates = new ArrayList<>();
            if (dealerId != null) {
                predicates.add(criteriaBuilder.equal(root.get("order").get("dealer").get("id"), dealerId));
            }

            Expression<Instant> recordedAt = criteriaBuilder.coalesce(root.get("paidAt"), root.get("createdAt"));
            if (fromInclusive != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(recordedAt, fromInclusive));
            }
            if (toInclusive != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(recordedAt, toInclusive));
            }
            if (minAmount != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }
            if (hasProof != null) {
                Expression<String> proofFileName = criteriaBuilder.trim(
                        criteriaBuilder.coalesce(root.get("proofFileName"), "")
                );
                predicates.add(hasProof
                        ? criteriaBuilder.notEqual(proofFileName, "")
                        : criteriaBuilder.equal(proofFileName, ""));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        return paymentRepository.findAll(specification, pageable).map(this::toRecentPaymentResponse);
    }

    @Transactional(readOnly = true)
    public List<AdminRecentPaymentResponse> getPaymentsRecordedBetween(
            Instant fromInclusive,
            Instant toExclusive
    ) {
        return paymentRepository.findPaymentsRecordedBetween(fromInclusive, toExclusive).stream()
                .map(this::toRecentPaymentResponse)
                .toList();
    }

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
        FinancialSettlement savedSettlement = financialSettlementRepository.save(settlement);

        Order relatedOrder = savedSettlement.getOrder();
        if (relatedOrder != null) {
            if (savedSettlement.getTypeEnum() == com.devwonder.backend.entity.enums.FinancialSettlementType.STALE_ORDER_REVIEW) {
                relatedOrder.setStaleReviewRequired(Boolean.FALSE);
            }
            boolean hasPendingSettlements = financialSettlementRepository.existsByOrderIdAndStatus(
                    relatedOrder.getId(),
                    FinancialSettlementStatus.PENDING
            );
            if (!hasPendingSettlements) {
                relatedOrder.setFinancialSettlementRequired(Boolean.FALSE);
            }
            orderRepository.save(relatedOrder);
        }

        return toSettlementResponse(savedSettlement);
    }

    private AdminFinancialSettlementResponse toSettlementResponse(FinancialSettlement s) {
        Order order = s.getOrder();
        return new AdminFinancialSettlementResponse(
                s.getId(),
                order != null ? order.getId() : null,
                order != null ? order.getOrderCode() : null,
                s.getTypeEnum(),
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

        // BUSINESS_LOGIC.md §3.25: COMPLETED orders require explicit confirmOverride=true
        if (order.getStatus() == OrderStatus.COMPLETED && !Boolean.TRUE.equals(request.confirmOverride())) {
            throw new BadRequestException(
                    "Order is COMPLETED. Set confirmOverride=true to apply an adjustment.");
        }

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
        orderAdjustmentRepository.save(adjustment);

        // BUSINESS_LOGIC.md §3.25: paidAmount = Σ payments.amount + Σ adjustments.amount
        // Both sums are computed via DB queries within the same transaction (JPA flushes before query).
        BigDecimal paidFromPayments = paymentRepository.sumAmountByOrderId(orderId);
        BigDecimal paidFromAdjustments = orderAdjustmentRepository.sumAmountByOrderId(orderId);
        BigDecimal newPaidAmount = paidFromPayments.add(paidFromAdjustments);

        if (newPaidAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(
                    "Adjustment would result in a negative paidAmount (" + newPaidAmount + "). Rejected.");
        }

        List<BulkDiscount> activeDiscountRules = bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
        int vatPercent = adminSettingsService.getEffectiveSettings().vatPercent();
        order.setPaidAmount(newPaidAmount);
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules, vatPercent));
        orderRepository.save(order);

        return toAdjustmentResponse(adjustment);
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

    @Transactional(readOnly = true)
    public List<AdminOrderPaymentResponse> getOrderPayments(Long orderId) {
        orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(orderId).stream()
                .map(this::toOrderPaymentResponse)
                .toList();
    }

    private AdminOrderPaymentResponse toOrderPaymentResponse(Payment payment) {
        Order order = payment.getOrder();
        return new AdminOrderPaymentResponse(
                payment.getId(),
                order != null ? order.getId() : null,
                payment.getAmount(),
                payment.getMethod(),
                payment.getChannel(),
                payment.getTransactionCode(),
                payment.getNote(),
                null,
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }

    private AdminRecentPaymentResponse toRecentPaymentResponse(Payment payment) {
        Order order = payment.getOrder();
        Dealer dealer = order == null ? null : order.getDealer();
        return new AdminRecentPaymentResponse(
                payment.getId(),
                order != null ? order.getId() : null,
                order != null ? order.getOrderCode() : null,
                dealer != null ? dealer.getId() : null,
                dealer == null ? null : firstNonBlank(
                        dealer.getBusinessName(),
                        dealer.getContactName(),
                        dealer.getUsername()
                ),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getChannel(),
                payment.getTransactionCode(),
                payment.getNote(),
                payment.getProofFileName(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
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
        UnmatchedPayment unmatchedPayment = unmatchedPaymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unmatched payment not found: " + id));

        if (unmatchedPayment.getStatus() != UnmatchedPaymentStatus.PENDING) {
            throw new BadRequestException("Unmatched payment is already resolved with status: " + unmatchedPayment.getStatus());
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

        // BUSINESS_LOGIC.md §3 (Unmatched transaction handling):
        // MATCHED = gán thủ công vào order phù hợp (tạo payment record cho order đó)
        // Must create a real Payment and recalculate Order financial state — not just update this row.
        if (newStatus == UnmatchedPaymentStatus.MATCHED) {
            applyMatchedPaymentToOrder(id, unmatchedPayment, request.matchedOrderId());
        }

        unmatchedPayment.setStatus(newStatus);
        unmatchedPayment.setResolution(request.resolution() != null ? request.resolution().trim() : null);
        unmatchedPayment.setResolvedBy(resolvedBy);
        unmatchedPayment.setResolvedAt(Instant.now());
        if (request.matchedOrderId() != null) {
            unmatchedPayment.setMatchedOrderId(request.matchedOrderId());
        }
        return toUnmatchedResponse(unmatchedPaymentRepository.save(unmatchedPayment));
    }

    /**
     * Creates a Payment record on the target order and recalculates its financial state.
     * Uses a stable, unique transactionCode derived from the unmatched payment's own ID so that
     * concurrent duplicate calls are rejected by the DB unique constraint — the same pattern
     * SepayService uses for webhook deduplication.
     */
    private void applyMatchedPaymentToOrder(Long unmatchedPaymentId, UnmatchedPayment unmatchedPayment, Long matchedOrderId) {
        // Pessimistic lock to prevent concurrent payment races on the same order
        Order order = orderRepository.findByIdForUpdate(matchedOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + matchedOrderId));

        if (Boolean.TRUE.equals(order.getIsDeleted())) {
            throw new BadRequestException("Cannot match payment to a deleted order");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot match payment to a cancelled order");
        }

        // Stable, unique transaction code: idempotency guard at the DB level
        String derivedTxCode = "UNMATCHED_MATCH:" + unmatchedPaymentId;
        if (paymentRepository.existsByTransactionCodeIgnoreCase(derivedTxCode)) {
            // Already applied (shouldn't normally happen — the PENDING check is the primary gate,
            // but this prevents a duplicate payment if the DB is somehow inconsistent)
            return;
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(unmatchedPayment.getAmount());
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PAID);
        payment.setChannel("admin-manual-match");
        payment.setTransactionCode(derivedTxCode);
        payment.setNote("Manually matched from unmatched payment #" + unmatchedPaymentId
                + (unmatchedPayment.getTransactionCode() != null
                        ? " | srcTxCode=" + unmatchedPayment.getTransactionCode()
                        : ""));
        payment.setPaidAt(unmatchedPayment.getReceivedAt() != null ? unmatchedPayment.getReceivedAt() : Instant.now());
        paymentRepository.save(payment);

        // Recalculate paidAmount = Σ payments.amount + Σ adjustments.amount
        // (same aggregate logic introduced in Q1 fix — BUSINESS_LOGIC.md §3.25)
        BigDecimal paidFromPayments = paymentRepository.sumAmountByOrderId(order.getId());
        BigDecimal paidFromAdjustments = orderAdjustmentRepository.sumAmountByOrderId(order.getId());
        BigDecimal newPaidAmount = paidFromPayments.add(paidFromAdjustments);

        List<BulkDiscount> activeDiscountRules = bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
        int vatPercent = adminSettingsService.getEffectiveSettings().vatPercent();
        order.setPaidAmount(newPaidAmount);
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules, vatPercent));
        orderRepository.save(order);
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
