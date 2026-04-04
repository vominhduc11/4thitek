package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.DealerPaymentResponse;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.service.AdminSettingsService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerPaymentSupport {

    private static final BigDecimal ONE_VND = BigDecimal.ONE;

    /** Dealer payments on orders with outstandingAmount >= this threshold MUST include proofFileName. */
    @Value("${app.payment.large-amount-proof-threshold:10000000}")
    private long largeAmountProofThreshold;

    /** Dealer debt payments below this amount are rejected unless they fully settle the order. */
    @Value("${app.payment.minimum-debt-payment-amount:100000}")
    private long minimumDebtPaymentAmount;

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final DealerOrderNotificationSupport dealerOrderNotificationSupport;
    private final AdminSettingsService adminSettingsService;

    public List<DealerPaymentResponse> getPayments(Long orderId) {
        return paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(orderId).stream()
                .map(DealerPortalResponseMapper::toPaymentResponse)
                .toList();
    }

    public DealerPaymentResponse recordPayment(
            Dealer dealer,
            Order order,
            RecordPaymentRequest request,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        return recordPaymentInternal(dealer, order, request, false, activeDiscountRules);
    }

    public DealerPaymentResponse recordAdminPayment(
            Order order,
            RecordPaymentRequest request,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        return recordPaymentInternal(order.getDealer(), order, request, true, activeDiscountRules);
    }

    private DealerPaymentResponse recordPaymentInternal(
            Dealer dealer,
            Order order,
            RecordPaymentRequest request,
            boolean allowManualBankTransfer,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        if (order.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            if (!allowManualBankTransfer && isSepayEnabled()) {
                throw new BadRequestException("Bank transfer payments are confirmed by SePay webhook");
            }
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot record payment for cancelled order");
        }

        BigDecimal amount = request.amount().setScale(0, RoundingMode.HALF_UP);
        if (amount.compareTo(ONE_VND) < 0) {
            throw new BadRequestException("Payment amount must round to at least 1 VND");
        }
        BigDecimal outstandingAmount = computeOutstandingAmount(order, activeDiscountRules);
        if (outstandingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Order is already fully paid");
        }
        if (amount.compareTo(outstandingAmount) > 0) {
            throw new BadRequestException("Payment amount exceeds outstanding balance");
        }
        if (!allowManualBankTransfer && order.getPaymentMethod() == PaymentMethod.DEBT) {
            assertMinimumDebtPayment(amount, outstandingAmount);
        }
        // TODO(backlog/F20): automated daily debt reconciliation and anomaly scoring are
        // not implemented yet; current release controls are proof threshold, duplicate
        // detection, transaction-code uniqueness, and manual settlement review.
        // BUSINESS_LOGIC.md Section 3.13 [Policy]: dealer payments on large-outstanding orders
        // (outstandingAmount >= 10,000,000 VNĐ) MUST include proofFileName.
        if (!allowManualBankTransfer) {
            BigDecimal proofThreshold = BigDecimal.valueOf(largeAmountProofThreshold);
            if (outstandingAmount.compareTo(proofThreshold) >= 0) {
                String proof = DealerRequestSupport.normalize(request.proofFileName());
                if (proof == null) {
                    throw new BadRequestException(
                            "proofFileName is required for payments on orders with outstanding amount >= "
                            + proofThreshold.toPlainString() + " VNĐ"
                    );
                }
            }
        }
        Instant duplicateWindow = Instant.now().minusSeconds(30);
        if (paymentRepository.existsByOrderIdAndAmountAndCreatedAtAfter(order.getId(), amount, duplicateWindow)) {
            throw new ConflictException("Duplicate payment detected");
        }
        String transactionCode = DealerRequestSupport.normalize(request.transactionCode());
        if (transactionCode != null && paymentRepository.existsByTransactionCodeIgnoreCase(transactionCode)) {
            throw new ConflictException("Transaction code already exists");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount);
        payment.setMethod(request.method() == null ? DealerOrderSupport.defaultPaymentMethod(order) : request.method());
        payment.setStatus(PaymentStatus.PAID);
        payment.setChannel(DealerRequestSupport.defaultIfBlank(request.channel(), payment.getMethod().name()));
        payment.setTransactionCode(transactionCode);
        payment.setNote(DealerRequestSupport.normalize(request.note()));
        payment.setProofFileName(DealerRequestSupport.normalize(request.proofFileName()));
        payment.setPaidAt(request.paidAt() == null ? Instant.now() : request.paidAt());

        Payment savedPayment = paymentRepository.save(payment);
        order.setPaidAmount(DealerOrderSupport.zeroIfNull(order.getPaidAmount()).add(amount));
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules, adminSettingsService.getVatPercent()));
        orderRepository.save(order);
        if (dealer != null) {
            dealerOrderNotificationSupport.notifyPaymentRecorded(dealer, order, amount);
        }
        return DealerPortalResponseMapper.toPaymentResponse(savedPayment);
    }

    private void assertMinimumDebtPayment(BigDecimal amount, BigDecimal outstandingAmount) {
        BigDecimal minimumAmount = BigDecimal.valueOf(minimumDebtPaymentAmount);
        if (minimumAmount.compareTo(ONE_VND) <= 0) {
            return;
        }
        if (amount.compareTo(outstandingAmount) == 0) {
            return;
        }
        if (amount.compareTo(minimumAmount) < 0) {
            throw new BadRequestException(
                    "Payment amount must be at least "
                            + minimumAmount.toPlainString()
                            + " VND unless it fully settles the outstanding balance"
            );
        }
    }

    private BigDecimal computeOutstandingAmount(
            Order order,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        return OrderFinancialSupport.paymentDueAmount(order, activeDiscountRules, adminSettingsService.getVatPercent());
    }

    private boolean isSepayEnabled() {
        return adminSettingsService.getSepaySettings().enabled();
    }
}
