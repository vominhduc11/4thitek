package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.DealerBankTransferInstructionResponse;
import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.dto.webhook.SepayWebhookRequest;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.service.support.OrderPricingSupport;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SepayService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("\\bSCS-\\d+-\\d+(?:-\\d+)?\\b", Pattern.CASE_INSENSITIVE);
    private static final DateTimeFormatter SEPAY_DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Value("${sepay.enabled:false}")
    private boolean sepayEnabled;

    @Value("${sepay.webhook-token:}")
    private String webhookToken;

    @Value("${sepay.bank-name:}")
    private String bankName;

    @Value("${sepay.account-number:}")
    private String accountNumber;

    @Value("${sepay.account-holder:}")
    private String accountHolder;

    @Transactional(readOnly = true)
    public DealerBankTransferInstructionResponse getBankTransferInstructions() {
        validateInstructionConfig();
        return new DealerBankTransferInstructionResponse(
                "SePay",
                bankName.trim(),
                accountNumber.trim(),
                accountHolder.trim()
        );
    }

    @Transactional
    public WebhookResult processWebhook(SepayWebhookRequest request, String providedToken) {
        if (!sepayEnabled) {
            throw new BadRequestException("SePay webhook is not enabled");
        }
        validateWebhookToken(providedToken);

        BigDecimal amount = request.transferAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return WebhookResult.ignored("invalid_amount", null, null, "Transfer amount is missing or invalid");
        }
        if (!isIncomingTransfer(request.transferType())) {
            return WebhookResult.ignored("ignored_transfer_type", null, null, "Transfer type is not incoming");
        }

        String orderCode = extractOrderCode(request);
        if (orderCode == null) {
            return WebhookResult.ignored("order_not_found", null, null, "No order code found in transfer content");
        }

        Order order = orderRepository.findFirstByOrderCodeIgnoreCase(orderCode)
                .orElse(null);
        if (order == null) {
            return WebhookResult.ignored("order_not_found", orderCode, null, "Order does not exist");
        }
        if (Boolean.TRUE.equals(order.getIsDeleted())) {
            return WebhookResult.ignored("order_deleted", orderCode, null, "Order is deleted");
        }
        if (order.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            return WebhookResult.ignored("unsupported_payment_method", orderCode, null, "Order is not using bank transfer");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return WebhookResult.ignored("order_cancelled", orderCode, null, "Cancelled order cannot receive payment");
        }
        if (zeroIfNull(order.getPaidAmount()).compareTo(OrderPricingSupport.computeTotalAmount(order)) >= 0) {
            return WebhookResult.duplicate("already_paid", orderCode, null, "Order is already fully paid");
        }

        String transactionCode = buildTransactionCode(request);
        if (transactionCode != null && paymentRepository.existsByTransactionCodeIgnoreCase(transactionCode)) {
            return WebhookResult.duplicate("duplicate_transaction", orderCode, transactionCode, "Webhook transaction already processed");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount.setScale(0, RoundingMode.HALF_UP));
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PAID);
        payment.setChannel(buildChannel(request.gateway()));
        payment.setTransactionCode(transactionCode);
        payment.setNote(buildWebhookNote(request, orderCode));
        payment.setPaidAt(parsePaidAt(request.transactionDate()));
        Payment savedPayment = paymentRepository.save(payment);

        order.setPaidAmount(zeroIfNull(order.getPaidAmount()).add(payment.getAmount()));
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order));
        orderRepository.save(order);

        if (order.getDealer() != null) {
            notificationService.create(new CreateNotifyRequest(
                    order.getDealer().getId(),
                    "Thanh toan chuyen khoan da duoc xac nhan",
                    "SePay da ghi nhan " + payment.getAmount().toPlainString() + " cho don " + order.getOrderCode() + ".",
                    NotifyType.ORDER,
                    "/orders/" + order.getOrderCode()
            ));
        }

        return WebhookResult.processed(
                orderCode,
                savedPayment.getTransactionCode(),
                "Payment recorded successfully"
        );
    }

    private void validateInstructionConfig() {
        if (!sepayEnabled) {
            throw new BadRequestException("SePay is not enabled");
        }
        if (isBlank(bankName) || isBlank(accountNumber) || isBlank(accountHolder)) {
            throw new BadRequestException("SePay bank transfer instructions are not configured");
        }
    }

    private void validateWebhookToken(String providedToken) {
        String normalizedConfigured = normalize(webhookToken);
        if (normalizedConfigured == null) {
            return;
        }
        String normalizedProvided = normalize(providedToken);
        if (!normalizedConfigured.equals(normalizedProvided)) {
            throw new UnauthorizedException("Invalid SePay webhook token");
        }
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

    private String buildTransactionCode(SepayWebhookRequest request) {
        String uniqueToken = firstNonBlank(request.id(), request.referenceCode(), request.code());
        if (uniqueToken == null) {
            return null;
        }
        return "SEPAY:" + uniqueToken;
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

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
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
