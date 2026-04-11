package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import com.devwonder.backend.dto.webhook.SepayWebhookRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.entity.enums.UnmatchedPaymentReason;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.UnmatchedPaymentRepository;
import com.devwonder.backend.service.NotificationService;
import com.devwonder.backend.service.SepayService;
import com.devwonder.backend.service.support.OrderPricingSupport;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sepay_service;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "sepay.enabled=true",
        "sepay.webhook-token=test-token",
        "sepay.bank-name=Test Bank",
        "sepay.account-number=0000000000",
        "sepay.account-holder=Test Account Holder"
})
class SepayServiceTests {

    @Autowired
    private SepayService sepayService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private UnmatchedPaymentRepository unmatchedPaymentRepository;

    @MockBean
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        unmatchedPaymentRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    void duplicateWebhookWithoutProviderTransactionIdUsesFallbackFingerprint() {
        Product product = createProduct("SEPAY-TEST-1");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-101", product, null));
        SepayWebhookRequest request = createWebhook("SCS-2026-101", outstandingAmount(order));

        SepayService.WebhookResult first = sepayService.processWebhook(request, "test-token");
        SepayService.WebhookResult second = sepayService.processWebhook(request, "test-token");
        Order refreshedOrder = orderRepository.findFirstByOrderCodeIgnoreCase(order.getOrderCode()).orElseThrow();
        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(refreshedOrder.getId());

        assertThat(first.status()).isEqualTo("processed");
        assertThat(first.transactionCode()).startsWith("SEPAY:FINGERPRINT:");
        assertThat(second.status()).isIn("duplicate_transaction", "already_paid");
        assertThat(payments).hasSize(1);
        assertThat(refreshedOrder.getPaidAmount()).isEqualByComparingTo(outstandingAmount(order));
    }

    @Test
    void notificationFailureDoesNotRollbackRecordedPayment() {
        Product product = createProduct("SEPAY-TEST-2");
        Dealer dealer = createDealer("dealer.sepay@example.com");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-202", product, dealer));
        SepayWebhookRequest request = createWebhook("SCS-2026-202", outstandingAmount(order));
        doThrow(new ResourceNotFoundException("Account not found"))
                .when(notificationService)
                .create(any());

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");
        Order refreshedOrder = orderRepository.findFirstByOrderCodeIgnoreCase(order.getOrderCode()).orElseThrow();
        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(refreshedOrder.getId());

        assertThat(result.status()).isEqualTo("processed");
        assertThat(payments).hasSize(1);
        assertThat(refreshedOrder.getPaidAmount()).isEqualByComparingTo(outstandingAmount(order));
        verify(notificationService).create(any());
    }

    @Test
    void overpaymentWebhookIsIgnoredAndDoesNotChangeBalance() {
        Product product = createProduct("SEPAY-TEST-3");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-303", product, null));
        SepayWebhookRequest request = new SepayWebhookRequest(
                null,
                "SePay",
                "2026-03-13 11:30:00",
                "123456789",
                "in",
                BigDecimal.valueOf(999_999_999L),
                null,
                null,
                null,
                null,
                "Thanh toan SCS-2026-303",
                "Thanh toan SCS-2026-303",
                null
        );

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");
        Order refreshedOrder = orderRepository.findFirstByOrderCodeIgnoreCase(order.getOrderCode()).orElseThrow();
        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(refreshedOrder.getId());

        assertThat(result.status()).isEqualTo("amount_mismatch");
        assertThat(payments).isEmpty();
        assertThat(refreshedOrder.getPaidAmount()).isEqualByComparingTo("0");
    }

    @Test
    void partialPaymentWebhookIsIgnoredWhenAmountDoesNotMatchOutstanding() {
        Product product = createProduct("SEPAY-TEST-5");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-505", product, null));
        SepayWebhookRequest request = createWebhook("SCS-2026-505", BigDecimal.valueOf(110_000));

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");
        Order refreshedOrder = orderRepository.findFirstByOrderCodeIgnoreCase(order.getOrderCode()).orElseThrow();
        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(refreshedOrder.getId());

        assertThat(result.status()).isEqualTo("amount_mismatch");
        assertThat(payments).isEmpty();
        assertThat(refreshedOrder.getPaidAmount()).isEqualByComparingTo("0");
    }

    @Test
    void compactOrderCodeWithoutHyphensStillMatchesOrder() {
        Product product = createProduct("SEPAY-TEST-6");
        String canonicalOrderCode = "SCS-2-1775789878946-476816";
        Order order = orderRepository.save(createBankTransferOrder(canonicalOrderCode, product, null));
        SepayWebhookRequest request = new SepayWebhookRequest(
                "TX-COMPACT-ORDER-CODE",
                "SePay",
                "2026-04-10 15:57:00",
                "123456789",
                "in",
                outstandingAmount(order),
                null,
                null,
                "NHAN TU 2114012003 TRACE 500899 ND SCS21775789878946476816",
                null,
                "NHAN TU 2114012003 TRACE 500899 ND SCS21775789878946476816",
                null,
                null
        );

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");
        Order refreshedOrder = orderRepository.findFirstByOrderCodeIgnoreCase(canonicalOrderCode).orElseThrow();
        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(refreshedOrder.getId());

        assertThat(result.status()).isEqualTo("processed");
        assertThat(result.orderCode()).isEqualTo(canonicalOrderCode);
        assertThat(payments).hasSize(1);
        assertThat(payments.get(0).getAmount()).isEqualByComparingTo(outstandingAmount(order));
        assertThat(unmatchedPaymentRepository.count()).isZero();
        assertThat(refreshedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void orderCodeCanBeExtractedFromWebhookCodeField() {
        Product product = createProduct("SEPAY-TEST-CODE");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-606", product, null));
        SepayWebhookRequest request = new SepayWebhookRequest(
                "TX-CODE-606",
                "SePay",
                "2026-04-11 10:15:00",
                "123456789",
                "in",
                outstandingAmount(order),
                null,
                "SCS-2026-606",
                null,
                "FT123456789",
                null,
                null,
                null
        );

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");

        assertThat(result.status()).isEqualTo("processed");
        assertThat(result.orderCode()).isEqualTo("SCS-2026-606");
    }

    @Test
    void orderCodeCanBeExtractedFromDescriptionField() {
        Product product = createProduct("SEPAY-TEST-DESCRIPTION");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-707", product, null));
        SepayWebhookRequest request = new SepayWebhookRequest(
                "TX-DESCRIPTION-707",
                "SePay",
                "2026-04-11 10:20:00",
                "123456789",
                "in",
                outstandingAmount(order),
                null,
                null,
                null,
                "FT22334455",
                "Chuyen khoan don SCS-2026-707",
                null,
                null
        );

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");

        assertThat(result.status()).isEqualTo("processed");
        assertThat(result.orderCode()).isEqualTo("SCS-2026-707");
    }

    @Test
    void unmatchedPaymentIsPersistedWhenNotificationFails() {
        // amount_mismatch path: unmatched payment must be saved even when admin notification throws
        Product product = createProduct("SEPAY-UNMATCHED-1");
        orderRepository.save(createBankTransferOrder("SCS-2026-601", product, null));
        SepayWebhookRequest request = new SepayWebhookRequest(
                "TX-UNMATCHED-601", "SePay", "2026-03-13 11:30:00", "123456789", "in",
                BigDecimal.valueOf(1L), // wrong amount — triggers amount_mismatch
                null, null, null, null,
                "Thanh toan SCS-2026-601", "Thanh toan SCS-2026-601", null
        );
        doThrow(new RuntimeException("Notification service unavailable"))
                .when(notificationService).create(any());

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");

        assertThat(result.status()).isEqualTo("amount_mismatch");
        assertThat(unmatchedPaymentRepository.count()).isEqualTo(1L);
        var saved = unmatchedPaymentRepository.findAll().get(0);
        assertThat(saved.getOrderCodeHint()).isEqualTo("SCS-2026-601");
        assertThat(saved.getReason()).isEqualTo(UnmatchedPaymentReason.AMOUNT_MISMATCH);
        assertThat(saved.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(1L));
    }

    @Test
    void unmatchedPaymentIsPersistedForNoOrderCodeWebhook() {
        // order_not_found path with no recognisable order code in content
        SepayWebhookRequest request = new SepayWebhookRequest(
                "TX-NOCODE-001", "SePay", "2026-03-13 11:30:00", "123456789", "in",
                BigDecimal.valueOf(200_000L),
                null, null, null, null,
                "Random content without order code", "Random content without order code", null
        );

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");

        assertThat(result.status()).isEqualTo("order_not_found");
        assertThat(unmatchedPaymentRepository.count()).isEqualTo(1L);
        var saved = unmatchedPaymentRepository.findAll().get(0);
        assertThat(saved.getReason()).isEqualTo(UnmatchedPaymentReason.ORDER_NOT_FOUND);
        assertThat(saved.getOrderCodeHint()).isNull();
        assertThat(saved.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(200_000L));
    }

    @Test
    void unmatchedPaymentNotificationFailurePerAdminDoesNotAbortOtherNotifications() {
        // Per-admin notification failures must be isolated; the record is persisted and
        // the webhook result is still the expected ignored status.
        Product product = createProduct("SEPAY-UNMATCHED-2");
        orderRepository.save(createBankTransferOrder("SCS-2026-602", product, null));
        SepayWebhookRequest request = new SepayWebhookRequest(
                "TX-UNMATCHED-602", "SePay", "2026-03-13 11:30:00", "123456789", "in",
                BigDecimal.valueOf(1L), // wrong amount
                null, null, null, null,
                "Thanh toan SCS-2026-602", "Thanh toan SCS-2026-602", null
        );
        // First call throws, simulating one admin notification failing
        doThrow(new RuntimeException("SMTP timeout")).when(notificationService).create(any());

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");

        assertThat(result.status()).isEqualTo("amount_mismatch");
        // Record must be durably saved regardless of notification outcome
        assertThat(unmatchedPaymentRepository.count()).isEqualTo(1L);
    }

    @Test
    void blankWebhookTokenIsRejected() {
        Product product = createProduct("SEPAY-TEST-4");
        orderRepository.save(createBankTransferOrder("SCS-2026-404", product, null));

        assertThatThrownBy(() -> sepayService.processWebhook(createWebhook("SCS-2026-404", BigDecimal.valueOf(220_000)), "   "))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid SePay webhook token");
    }

    private SepayWebhookRequest createWebhook(String orderCode, BigDecimal amount) {
        return new SepayWebhookRequest(
                null,
                "SePay",
                "2026-03-13 11:30:00",
                "123456789",
                "in",
                amount,
                null,
                null,
                null,
                null,
                "Thanh toan " + orderCode,
                "Thanh toan " + orderCode,
                null
        );
    }

    private Product createProduct(String sku) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("SePay test product");
        product.setRetailPrice(BigDecimal.valueOf(100_000));
        product.setStock(100);
        product.setIsDeleted(false);
        return productRepository.save(product);
    }

    private Dealer createDealer(String email) {
        Dealer dealer = new Dealer();
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + email);
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealerRepository.save(dealer);
    }

    private Order createBankTransferOrder(String orderCode, Product product, Dealer dealer) {
        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setDealer(dealer);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setIsDeleted(false);
        order.setShippingFee(0);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setOrderItems(new HashSet<>());

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(2);
        item.setUnitPrice(BigDecimal.valueOf(100_000));
        order.getOrderItems().add(item);
        return order;
    }

    private BigDecimal outstandingAmount(Order order) {
        return OrderPricingSupport.computeTotalAmount(order, List.of(), 10);
    }
}
