package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
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
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.service.NotificationService;
import com.devwonder.backend.service.SepayService;
import java.math.BigDecimal;
import java.util.HashSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sepay_service;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "sepay.enabled=true",
        "sepay.webhook-token=test-token"
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

    @MockBean
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    void duplicateWebhookWithoutProviderTransactionIdUsesFallbackFingerprint() {
        Product product = createProduct("SEPAY-TEST-1");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-101", product, null));
        SepayWebhookRequest request = createWebhook("SCS-2026-101");

        SepayService.WebhookResult first = sepayService.processWebhook(request, "test-token");
        SepayService.WebhookResult second = sepayService.processWebhook(request, "test-token");
        Order refreshedOrder = orderRepository.findFirstByOrderCodeIgnoreCase(order.getOrderCode()).orElseThrow();
        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(refreshedOrder.getId());

        assertThat(first.status()).isEqualTo("processed");
        assertThat(first.transactionCode()).startsWith("SEPAY:FINGERPRINT:");
        assertThat(second.status()).isEqualTo("duplicate_transaction");
        assertThat(second.transactionCode()).isEqualTo(first.transactionCode());
        assertThat(payments).hasSize(1);
        assertThat(refreshedOrder.getPaidAmount()).isEqualByComparingTo("110000");
    }

    @Test
    void notificationFailureDoesNotRollbackRecordedPayment() {
        Product product = createProduct("SEPAY-TEST-2");
        Dealer dealer = createDealer("dealer.sepay@example.com");
        Order order = orderRepository.save(createBankTransferOrder("SCS-2026-202", product, dealer));
        SepayWebhookRequest request = createWebhook("SCS-2026-202");
        doThrow(new ResourceNotFoundException("Account not found"))
                .when(notificationService)
                .create(any());

        SepayService.WebhookResult result = sepayService.processWebhook(request, "test-token");
        Order refreshedOrder = orderRepository.findFirstByOrderCodeIgnoreCase(order.getOrderCode()).orElseThrow();
        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(refreshedOrder.getId());

        assertThat(result.status()).isEqualTo("processed");
        assertThat(payments).hasSize(1);
        assertThat(refreshedOrder.getPaidAmount()).isEqualByComparingTo("110000");
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

        assertThat(result.status()).isEqualTo("amount_exceeds_outstanding");
        assertThat(payments).isEmpty();
        assertThat(refreshedOrder.getPaidAmount()).isEqualByComparingTo("0");
    }

    private SepayWebhookRequest createWebhook(String orderCode) {
        return new SepayWebhookRequest(
                null,
                "SePay",
                "2026-03-13 11:30:00",
                "123456789",
                "in",
                BigDecimal.valueOf(110_000),
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
}
