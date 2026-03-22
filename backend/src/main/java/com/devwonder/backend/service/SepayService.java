package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.DealerBankTransferInstructionResponse;
import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.dto.realtime.DealerOrderStatusEvent;
import com.devwonder.backend.dto.webhook.SepayWebhookRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.service.support.AppMessageSupport;
import com.devwonder.backend.service.support.OrderPricingSupport;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
public class SepayService {

    private static final Logger log = LoggerFactory.getLogger(SepayService.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("\\bSCS-\\d+-\\d+(?:-\\d+)?\\b", Pattern.CASE_INSENSITIVE);
    private static final DateTimeFormatter SEPAY_DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final BulkDiscountRepository bulkDiscountRepository;
    private final NotificationService notificationService;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final AppMessageSupport appMessageSupport;
    private final AdminSettingsService adminSettingsService;

    @Transactional(readOnly = true)
    public DealerBankTransferInstructionResponse getBankTransferInstructions() {
        AdminSettingsService.SepayRuntimeSettings settings = adminSettingsService.getSepaySettings();
        validateInstructionConfig(settings);
        return new DealerBankTransferInstructionResponse(
                "SePay",
                settings.bankName().trim(),
                settings.accountNumber().trim(),
                settings.accountHolder().trim()
        );
    }

    @Transactional
    public WebhookResult processWebhook(SepayWebhookRequest request, String providedToken) {
        AdminSettingsService.SepayRuntimeSettings settings = adminSettingsService.getSepaySettings();
        log.info("SePay webhook received: id={}, gateway={}, transferType={}, amount={}, transferContent='{}', referenceCode={}, transactionDate={}",
                request.id(), request.gateway(), request.transferType(), request.transferAmount(),
                request.transferContent(), request.referenceCode(), request.transactionDate());

        if (!settings.enabled()) {
            log.warn("SePay webhook ignored: disabled");
            return WebhookResult.ignored("disabled", null, null, "SePay webhook is disabled");
        }
        validateWebhookToken(providedToken, settings.webhookToken());

        BigDecimal amount = request.transferAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("SePay webhook ignored: invalid_amount, amount={}", amount);
            return WebhookResult.ignored("invalid_amount", null, null, "Transfer amount is missing or invalid");
        }
        if (!isIncomingTransfer(request.transferType())) {
            log.info("SePay webhook ignored: transfer_type={} is not incoming", request.transferType());
            return WebhookResult.ignored("ignored_transfer_type", null, null, "Transfer type is not incoming");
        }

        String orderCode = extractOrderCode(request);
        if (orderCode == null) {
            log.warn("SePay webhook ignored: no order code found in content='{}', transferContent='{}'",
                    request.content(), request.transferContent());
            return WebhookResult.ignored("order_not_found", null, null, "No order code found in transfer content");
        }

        Order order = orderRepository.findByOrderCodeIgnoreCaseForUpdate(orderCode)
                .orElse(null);
        if (order == null) {
            log.warn("SePay webhook ignored: order_not_found, orderCode={}", orderCode);
            return WebhookResult.ignored("order_not_found", orderCode, null, "Order does not exist");
        }
        if (Boolean.TRUE.equals(order.getIsDeleted())) {
            log.warn("SePay webhook ignored: order_deleted, orderCode={}", orderCode);
            return WebhookResult.ignored("order_deleted", orderCode, null, "Order is deleted");
        }
        if (order.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            log.warn("SePay webhook ignored: unsupported_payment_method={}, orderCode={}", order.getPaymentMethod(), orderCode);
            return WebhookResult.ignored("unsupported_payment_method", orderCode, null, "Order is not using bank transfer");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            log.warn("SePay webhook ignored: order_cancelled, orderCode={}", orderCode);
            return WebhookResult.ignored("order_cancelled", orderCode, null, "Cancelled order cannot receive payment");
        }
        var activeDiscountRules = bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
        BigDecimal totalAmount = OrderPricingSupport.computeTotalAmount(order, activeDiscountRules);
        BigDecimal outstandingAmount = remainingOutstandingAmount(order, totalAmount);
        if (outstandingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            log.info("SePay webhook ignored: already_paid, orderCode={}", orderCode);
            return WebhookResult.duplicate("already_paid", orderCode, null, "Order is already fully paid");
        }

        BigDecimal normalizedAmount = amount.setScale(0, RoundingMode.HALF_UP);
        if (normalizedAmount.compareTo(outstandingAmount) != 0) {
            log.warn("SePay webhook ignored: amount_mismatch, orderCode={}, amount={}, outstanding={}",
                    orderCode, normalizedAmount, outstandingAmount);
            return WebhookResult.ignored(
                    "amount_mismatch",
                    orderCode,
                    null,
                    "Transfer amount does not match outstanding balance"
            );
        }
        String transactionCode = buildTransactionCode(request, orderCode, normalizedAmount);
        if (transactionCode != null && paymentRepository.existsByTransactionCodeIgnoreCase(transactionCode)) {
            log.info("SePay webhook ignored: duplicate_transaction, orderCode={}, transactionCode={}", orderCode, transactionCode);
            return WebhookResult.duplicate("duplicate_transaction", orderCode, transactionCode, "Webhook transaction already processed");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(normalizedAmount);
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PAID);
        payment.setChannel(buildChannel(request.gateway()));
        payment.setTransactionCode(transactionCode);
        payment.setNote(buildWebhookNote(request, orderCode));
        payment.setPaidAt(parsePaidAt(request.transactionDate()));
        Payment savedPayment;
        try {
            savedPayment = paymentRepository.save(payment);
        } catch (DataIntegrityViolationException ex) {
            log.info("SePay webhook ignored: duplicate_transaction (constraint), orderCode={}, transactionCode={}", orderCode, transactionCode);
            return WebhookResult.duplicate("duplicate_transaction", orderCode, transactionCode, "Webhook transaction already processed");
        }

        order.setPaidAmount(zeroIfNull(order.getPaidAmount()).add(payment.getAmount()));
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules));
        orderRepository.save(order);

        log.info("SePay webhook processed: orderCode={}, transactionCode={}, amount={}, paymentStatus={}",
                orderCode, savedPayment.getTransactionCode(), normalizedAmount, order.getPaymentStatus());

        if (order.getDealer() != null && order.getDealer().getId() != null) {
            queuePaymentNotificationAfterCommit(
                    order.getDealer().getId(),
                    payment.getAmount(),
                    order.getOrderCode(),
                    order
            );
        }

        return WebhookResult.processed(
                orderCode,
                savedPayment.getTransactionCode(),
                "Payment recorded successfully"
        );
    }

    private void validateInstructionConfig(AdminSettingsService.SepayRuntimeSettings settings) {
        if (settings == null
                || isBlank(settings.bankName())
                || isBlank(settings.accountNumber())
                || isBlank(settings.accountHolder())) {
            throw new BadRequestException("Bank transfer instructions are not configured");
        }
    }

    private void validateWebhookToken(String providedToken, String configuredToken) {
        String normalizedConfigured = normalize(configuredToken);
        if (normalizedConfigured == null) {
            throw new BadRequestException("SePay webhook token is not configured");
        }
        String normalizedProvided = normalize(providedToken);
        if (normalizedProvided == null) {
            throw new UnauthorizedException("Invalid SePay webhook token");
        }
        byte[] configuredBytes = normalizedConfigured.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = normalizedProvided.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(configuredBytes, providedBytes)) {
            throw new UnauthorizedException("Invalid SePay webhook token");
        }
    }

    private void queuePaymentNotificationAfterCommit(Long dealerId, BigDecimal amount, String orderCode, Order order) {
        Dealer dealer = order.getDealer();
        String dealerUsername = dealer.getUsername() != null && !dealer.getUsername().isBlank()
                ? dealer.getUsername()
                : dealer.getEmail();
        OrderStatus orderStatus = order.getStatus();
        PaymentStatus paymentStatus = order.getPaymentStatus();
        Long orderId = order.getId();
        BigDecimal paidAmount = order.getPaidAmount();
        Instant updatedAt = order.getUpdatedAt();
        Runnable notificationTask = () -> {
            try {
                notificationService.create(new CreateNotifyRequest(
                        dealerId,
                        appMessageSupport.get("notification.sepay.payment_confirmed.title"),
                        appMessageSupport.get(
                                "notification.sepay.payment_confirmed.content",
                                amount.toPlainString(),
                                orderCode
                        ),
                        NotifyType.ORDER,
                        "/orders/" + orderCode,
                        null
                ));
            } catch (RuntimeException ex) {
                log.warn("Could not create SePay payment notification for order {}", orderCode, ex);
            }
            try {
                webSocketEventPublisher.publishOrderStatusChanged(
                        dealerUsername,
                        new DealerOrderStatusEvent(orderId, orderCode, orderStatus, orderStatus, paymentStatus, paidAmount, updatedAt)
                );
            } catch (RuntimeException ex) {
                log.warn("Could not publish order status event for order {}", orderCode, ex);
            }
        };

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            notificationTask.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notificationTask.run();
            }
        });
    }

    private boolean isIncomingTransfer(String transferType) {
        String normalized = normalize(transferType);
        if (normalized == null) {
            return true;
        }
        return "in".equalsIgnoreCase(normalized) || "credit".equalsIgnoreCase(normalized);
    }

    private String extractOrderCode(SepayWebhookRequest request) {
        return firstOrderCode(
                request.transferContent(),
                request.content(),
                request.description(),
                request.referenceCode()
        );
    }

    private String firstOrderCode(String... candidates) {
        for (String candidate : candidates) {
            String normalized = normalize(candidate);
            if (normalized == null) {
                continue;
            }
            Matcher matcher = ORDER_CODE_PATTERN.matcher(normalized);
            if (matcher.find()) {
                return matcher.group().toUpperCase(Locale.ROOT);
            }
        }
        return null;
    }

    private String buildTransactionCode(SepayWebhookRequest request, String orderCode, BigDecimal amount) {
        String uniqueToken = firstNonBlank(request.id(), request.referenceCode(), request.code());
        if (uniqueToken == null) {
            return "SEPAY:FINGERPRINT:" + hashTransactionFingerprint(request, orderCode, amount);
        }
        return "SEPAY:" + uniqueToken;
    }

    private String hashTransactionFingerprint(SepayWebhookRequest request, String orderCode, BigDecimal amount) {
        String fingerprint = String.join("|",
                safeFingerprintValue(orderCode),
                safeFingerprintValue(amount == null ? null : amount.toPlainString()),
                safeFingerprintValue(normalize(request.transactionDate())),
                safeFingerprintValue(normalize(request.gateway())),
                safeFingerprintValue(normalize(request.accountNumber())),
                safeFingerprintValue(normalize(request.transferContent())),
                safeFingerprintValue(normalize(request.content())),
                safeFingerprintValue(normalize(request.description())),
                safeFingerprintValue(normalize(request.subAccount()))
        );
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(fingerprint.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available for SePay fingerprinting.", ex);
        }
    }

    private String buildChannel(String gateway) {
        String normalizedGateway = normalize(gateway);
        return normalizedGateway == null ? "SePay" : "SePay " + normalizedGateway;
    }

    private String buildWebhookNote(SepayWebhookRequest request, String orderCode) {
        StringBuilder builder = new StringBuilder("SePay webhook");
        builder.append(" | orderCode=").append(orderCode);
        String referenceCode = normalize(request.referenceCode());
        if (referenceCode != null) {
            builder.append(" | referenceCode=").append(referenceCode);
        }
        String gateway = normalize(request.gateway());
        if (gateway != null) {
            builder.append(" | gateway=").append(gateway);
        }
        String transferContent = normalize(request.transferContent());
        if (transferContent != null) {
            builder.append(" | transferContent=").append(transferContent);
        }
        return builder.toString();
    }

    private Instant parsePaidAt(String rawValue) {
        String normalized = normalize(rawValue);
        if (normalized == null) {
            return Instant.now();
        }
        try {
            return Instant.parse(normalized);
        } catch (DateTimeParseException ignored) {
            // Continue with local formats.
        }
        try {
            return LocalDateTime.parse(normalized, SEPAY_DATE_TIME).atZone(APP_ZONE).toInstant();
        } catch (DateTimeParseException ignored) {
            // Continue with fallback.
        }
        try {
            return LocalDateTime.parse(normalized).atZone(APP_ZONE).toInstant();
        } catch (DateTimeParseException ignored) {
            return Instant.now();
        }
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal remainingOutstandingAmount(Order order, BigDecimal totalAmount) {
        BigDecimal outstandingAmount = zeroIfNull(totalAmount).subtract(zeroIfNull(order == null ? null : order.getPaidAmount()));
        return outstandingAmount.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : outstandingAmount;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private String safeFingerprintValue(String value) {
        return value == null ? "" : value;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return normalize(value) == null;
    }

    public record WebhookResult(
            String status,
            String orderCode,
            String transactionCode,
            String message
    ) {
        public static WebhookResult processed(String orderCode, String transactionCode, String message) {
            return new WebhookResult("processed", orderCode, transactionCode, message);
        }

        public static WebhookResult duplicate(String status, String orderCode, String transactionCode, String message) {
            return new WebhookResult(status, orderCode, transactionCode, message);
        }

        public static WebhookResult ignored(String status, String orderCode, String transactionCode, String message) {
            return new WebhookResult(status, orderCode, transactionCode, message);
        }
    }
}
