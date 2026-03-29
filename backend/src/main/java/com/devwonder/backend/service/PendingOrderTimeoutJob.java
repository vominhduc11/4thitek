package com.devwonder.backend.service;

import com.devwonder.backend.config.OrderProperties;
import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementType;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.support.AppMessageSupport;
import com.devwonder.backend.service.support.DealerOrderNotificationSupport;
import com.devwonder.backend.service.support.OrderInventorySupport;
import com.devwonder.backend.service.support.ProductSerialOrderSupport;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job that processes stale PENDING orders.
 *
 * Per BUSINESS_LOGIC.md Section 3.7 [Policy]:
 * - Every 1 hour, check all PENDING orders older than 48 hours.
 * - paidAmount = 0  → auto-cancel, release serials, set paymentStatus=CANCELLED.
 * - paidAmount > 0  → set staleReviewRequired=true, notify admins (cannot auto-cancel as money is involved).
 * - 6 hours before timeout: warn dealer.
 */
@Component
@RequiredArgsConstructor
public class PendingOrderTimeoutJob {

    private static final Logger log = LoggerFactory.getLogger(PendingOrderTimeoutJob.class);

    private final OrderRepository orderRepository;
    private final FinancialSettlementRepository financialSettlementRepository;
    private final OrderInventorySupport orderInventorySupport;
    private final ProductSerialOrderSupport productSerialOrderSupport;
    private final DealerOrderNotificationSupport dealerOrderNotificationSupport;
    private final NotificationService notificationService;
    private final AppMessageSupport appMessageSupport;
    private final OrderProperties orderProperties;

    /**
     * Main stale order check — runs every hour (configurable via app.order.stale-check-interval-ms).
     */
    @Scheduled(fixedDelayString = "${app.order.stale-check-interval-ms:3600000}")
    @Transactional
    public void processStaleOrders() {
        Instant cutoff = Instant.now().minusSeconds(orderProperties.getPendingTimeoutHours() * 3600L);
        List<Order> stalePendingOrders = orderRepository.findPendingOrdersCreatedBefore(cutoff);

        int cancelled = 0;
        int flaggedForReview = 0;

        for (Order order : stalePendingOrders) {
            try {
                BigDecimal paid = zeroIfNull(order.getPaidAmount());
                if (paid.compareTo(BigDecimal.ZERO) <= 0) {
                    autoCancelOrder(order);
                    cancelled++;
                } else {
                    flagOrderForStaleReview(order, paid);
                    flaggedForReview++;
                }
            } catch (RuntimeException ex) {
                log.error("Failed to process stale PENDING order id={}", order.getId(), ex);
            }
        }

        // Also auto-cancel PENDING orders of dealers suspended > 24h ago (BUSINESS_LOGIC.md Section 8.2)
        Instant suspendedGraceCutoff = Instant.now().minusSeconds(24 * 3600L);
        List<Order> suspendedDealerOrders = orderRepository.findPendingOrdersOfSuspendedDealersBefore(suspendedGraceCutoff);
        for (Order order : suspendedDealerOrders) {
            try {
                autoCancelOrder(order);
                cancelled++;
            } catch (RuntimeException ex) {
                log.error("Failed to auto-cancel PENDING order id={} for suspended dealer", order.getId(), ex);
            }
        }

        if (cancelled > 0 || flaggedForReview > 0) {
            log.info("PendingOrderTimeoutJob: cancelled={}, flaggedForReview={}", cancelled, flaggedForReview);
        }

        // Warning: notify dealers whose orders will timeout within the next warning window
        sendStaleWarnings();
    }

    private void autoCancelOrder(Order order) {
        log.info("Auto-cancelling stale PENDING order id={}, orderCode={}", order.getId(), order.getOrderCode());
        productSerialOrderSupport.releaseNonWarrantySerials(order);
        orderInventorySupport.restoreStock(order);
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.CANCELLED);
        orderRepository.save(order);
        dealerOrderNotificationSupport.notifyAdminsOrderAutoCancelled(order);
        // Also notify dealer
        notifyDealerOrderCancelled(order);
    }

    private void flagOrderForStaleReview(Order order, BigDecimal paidAmount) {
        if (Boolean.TRUE.equals(order.getStaleReviewRequired())) {
            // Already flagged — skip to avoid duplicate notifications
            return;
        }
        log.info("Flagging stale PENDING order id={}, orderCode={}, paidAmount={} for review",
                order.getId(), order.getOrderCode(), paidAmount);
        order.setStaleReviewRequired(Boolean.TRUE);
        // Create financial settlement record if one doesn't exist yet
        if (!financialSettlementRepository.existsByOrderIdAndStatus(order.getId(), FinancialSettlementStatus.PENDING)) {
            FinancialSettlement settlement = new FinancialSettlement();
            settlement.setOrder(order);
            settlement.setType(FinancialSettlementType.STALE_ORDER_REVIEW.name());
            settlement.setAmount(paidAmount);
            settlement.setStatus(FinancialSettlementStatus.PENDING);
            settlement.setCreatedBy("system");
            financialSettlementRepository.save(settlement);
        }
        order.setFinancialSettlementRequired(Boolean.TRUE);
        orderRepository.save(order);
        dealerOrderNotificationSupport.notifyAdminsOrderStaleReview(order, paidAmount);
    }

    private void sendStaleWarnings() {
        long warningBeforeSeconds = orderProperties.getStaleWarningBeforeHours() * 3600L;
        long timeoutSeconds = orderProperties.getPendingTimeoutHours() * 3600L;
        long checkIntervalSeconds = orderProperties.getStaleCheckIntervalMs() / 1000L;
        Instant now = Instant.now();
        // Orders that will timeout in the next warningBefore...(warningBefore - checkInterval) hours
        // i.e., created between (now - timeout + warningBefore) and (now - timeout + warningBefore + checkInterval)
        Instant windowStart = now.minusSeconds(timeoutSeconds - warningBeforeSeconds);
        Instant windowEnd   = now.minusSeconds(timeoutSeconds - warningBeforeSeconds - checkIntervalSeconds);

        // Ensure correct ordering (start < end)
        if (windowStart.isAfter(windowEnd)) {
            Instant tmp = windowStart;
            windowStart = windowEnd;
            windowEnd = tmp;
        }

        List<Order> warningOrders = orderRepository.findPendingOrdersInWarningWindow(windowStart, windowEnd);
        for (Order order : warningOrders) {
            try {
                notifyDealerStaleWarning(order);
            } catch (RuntimeException ex) {
                log.warn("Failed to send stale warning for order id={}", order.getId(), ex);
            }
        }
    }

    private void notifyDealerStaleWarning(Order order) {
        Dealer dealer = order.getDealer();
        if (dealer == null || dealer.getId() == null) {
            return;
        }
        String orderCode = order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId());
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                appMessageSupport.get("notification.dealer.order.stale-warning.title"),
                appMessageSupport.get("notification.dealer.order.stale-warning.content", orderCode),
                NotifyType.ORDER,
                "/orders/" + orderCode,
                null
        ));
    }

    private void notifyDealerOrderCancelled(Order order) {
        Dealer dealer = order.getDealer();
        if (dealer == null || dealer.getId() == null) {
            return;
        }
        String orderCode = order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId());
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                appMessageSupport.get("notification.order.status.cancelled.title"),
                appMessageSupport.get("notification.order.status.cancelled.content", orderCode),
                NotifyType.ORDER,
                "/orders/" + orderCode,
                null
        ));
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
