package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderAdjustmentRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.DealerPortalService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderWorkflowLogicTests {

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private BulkDiscountRepository bulkDiscountRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private OrderAdjustmentRepository orderAdjustmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderAdjustmentRepository.deleteAll();
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        bulkDiscountRepository.deleteAll();
        productRepository.deleteAll();
        adminRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void adminCannotSkipPendingStraightToCompleted() {
        Dealer dealer = dealerRepository.save(createDealer("admin-flow@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-ADMIN-1"));

        assertThatThrownBy(() -> adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.COMPLETED),
                "test-admin@example.com"
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PENDING -> COMPLETED");
    }

    @Test
    void dealerCannotPromotePendingOrderToShipping() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-flow@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-DEALER-1"));

        assertThatThrownBy(() -> dealerPortalService.updateOrderStatus(
                dealer.getUsername(),
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.SHIPPING)
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PENDING -> SHIPPING");
    }

    @Test
    void dealerCannotMarkShippingOrderCompleted() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-complete@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.SHIPPING, "WF-DEALER-2"));

        assertThatThrownBy(() -> dealerPortalService.updateOrderStatus(
                dealer.getUsername(),
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.COMPLETED)
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("SHIPPING -> COMPLETED");
    }

    @Test
    void adminCancellationRecomputesPaymentStatus() {
        Dealer dealer = dealerRepository.save(createDealer("admin-cancel@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-CANCEL-1"));

        var response = adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED),
                "test-admin@example.com"
        );

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(orderRepository.findById(order.getId()).orElseThrow().getPaymentStatus())
                .isEqualTo(PaymentStatus.CANCELLED);
    }

    @Test
    void adminCancellationDetachesLegacyNonWarrantySerials() {
        Dealer dealer = dealerRepository.save(createDealer("admin-cancel-serial@example.com"));
        Product product = saveProduct("SKU-CANCEL-SERIAL-ADMIN", BigDecimal.valueOf(100_000));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-CANCEL-SERIAL-ADMIN"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                dealer,
                order,
                product,
                "SERIAL-CANCEL-ADMIN-1",
                ProductSerialStatus.AVAILABLE
        ));

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED),
                "test-admin@example.com"
        );

        ProductSerial savedSerial = productSerialRepository.findById(serial.getId()).orElseThrow();
        assertThat(savedSerial.getOrder()).isNull();
        assertThat(savedSerial.getStatus()).isEqualTo(ProductSerialStatus.AVAILABLE);
    }

    @Test
    void adminConfirmationKeepsReservedSerialsReserved() {
        Dealer dealer = dealerRepository.save(createDealer("admin-confirm-serial@example.com"));
        Product product = saveProduct("SKU-CONFIRM-SERIAL-ADMIN", BigDecimal.valueOf(100_000));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-CONFIRM-SERIAL-ADMIN"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                null,
                order,
                product,
                "SERIAL-CONFIRM-ADMIN-1",
                ProductSerialStatus.RESERVED
        ));

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CONFIRMED),
                "test-admin@example.com"
        );

        ProductSerial savedSerial = productSerialRepository.findById(serial.getId()).orElseThrow();
        assertThat(savedSerial.getStatus()).isEqualTo(ProductSerialStatus.RESERVED);
        assertThat(savedSerial.getDealer()).isNull();
    }

    @Test
    void adminCompletionAssignsReservedSerialsToDealerInventory() {
        Dealer dealer = dealerRepository.save(createDealer("admin-complete-serial@example.com"));
        Product product = saveProduct("SKU-COMPLETE-SERIAL-ADMIN", BigDecimal.valueOf(100_000));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.SHIPPING, "WF-COMPLETE-SERIAL-ADMIN"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                null,
                order,
                product,
                "SERIAL-COMPLETE-ADMIN-1",
                ProductSerialStatus.RESERVED
        ));

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.COMPLETED),
                "test-admin@example.com"
        );

        ProductSerial savedSerial = productSerialRepository.findById(serial.getId()).orElseThrow();
        assertThat(savedSerial.getStatus()).isEqualTo(ProductSerialStatus.ASSIGNED);
        assertThat(savedSerial.getDealer()).isNotNull();
        assertThat(savedSerial.getDealer().getId()).isEqualTo(dealer.getId());
    }

    @Test
    void dealerCannotCreateDebtOrderBeyondCreditLimit() {
        Dealer dealer = createDealer("credit-limit@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(100_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-CREDIT-1", BigDecimal.valueOf(100_000));

        CreateDealerOrderRequest request = new CreateDealerOrderRequest(
                PaymentMethod.DEBT,
                "Dealer receiver",
                "123 Credit Street",
                "0900000000",
                0,
                "Debt order should exceed limit",
                List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
        );

        assertThatThrownBy(() -> dealerPortalService.createOrder(savedDealer.getUsername(), request, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Credit limit exceeded");
    }

    @Test
    void dealerCannotCreateDebtOrderWithoutConfiguredCreditLimit() {
        Dealer dealer = dealerRepository.save(createDealer("credit-not-configured@example.com"));
        Product product = saveProduct("SKU-CREDIT-0", BigDecimal.valueOf(100_000));

        CreateDealerOrderRequest request = new CreateDealerOrderRequest(
                PaymentMethod.DEBT,
                "Dealer receiver",
                "123 Credit Street",
                "0900000000",
                0,
                "Debt order should require configured credit limit",
                List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
        );

        assertThatThrownBy(() -> dealerPortalService.createOrder(dealer.getUsername(), request, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Debt payment is not available");
    }

    @Test
    void concurrentDebtOrdersRespectDealerCreditLimit() throws Exception {
        Dealer dealer = createDealer("credit-limit-race@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(150_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-CREDIT-RACE-1", BigDecimal.valueOf(100_000), 10);

        CreateDealerOrderRequest request = new CreateDealerOrderRequest(
                PaymentMethod.DEBT,
                "Dealer receiver",
                "123 Credit Street",
                "0900000000",
                0,
                "Concurrent debt order should be serialized",
                List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<String> task = () -> {
            ready.countDown();
            start.await(5, TimeUnit.SECONDS);
            try {
                dealerPortalService.createOrder(savedDealer.getUsername(), request, UUID.randomUUID().toString());
                return "created";
            } catch (BadRequestException ex) {
                if (ex.getMessage() != null && ex.getMessage().contains("Credit limit exceeded")) {
                    return "limit";
                }
                throw ex;
            }
        };

        try {
            Future<String> first = executor.submit(task);
            Future<String> second = executor.submit(task);
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            List<String> results = new ArrayList<>();
            results.add(first.get(10, TimeUnit.SECONDS));
            results.add(second.get(10, TimeUnit.SECONDS));

            assertThat(results).containsExactlyInAnyOrder("created", "limit");
        } finally {
            executor.shutdownNow();
        }

        assertThat(orderRepository.findVisibleByDealerIdOrderByCreatedAtDesc(savedDealer.getId())).hasSize(1);
    }

    @Test
    void dealerCanCreateBankTransferOrderEvenWhenCreditLimitWouldBlockDebt() {
        Dealer dealer = createDealer("credit-limit-bank-transfer@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(100_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-CREDIT-BANK-1", BigDecimal.valueOf(100_000));

        var response = dealerPortalService.createOrder(
                savedDealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Credit Street",
                        "0900000000",
                        0,
                        "Bank transfer order should ignore credit limit",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThat(response.paymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void dealerDebtCreditCheckIgnoresOutstandingBankTransferOrders() {
        Dealer dealer = createDealer("credit-limit-debt-only@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(150_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-CREDIT-DEBT-ONLY", BigDecimal.valueOf(100_000), 10);

        dealerPortalService.createOrder(
                savedDealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Credit Street",
                        "0900000000",
                        0,
                        "Outstanding bank transfer should not count toward debt limit",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        var debtOrder = dealerPortalService.createOrder(
                savedDealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Credit Street",
                        "0900000000",
                        0,
                        "Debt order should only count debt outstanding",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThat(debtOrder.paymentMethod()).isEqualTo(PaymentMethod.DEBT);
        assertThat(debtOrder.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(debtOrder.reservedCreditAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(debtOrder.openReceivableAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void discountPercentUsesActiveBulkDiscountRuleRange() {
        Dealer dealer = dealerRepository.save(createDealer("discount-rule@example.com"));
        Product product = saveProduct("SKU-DISCOUNT-1", BigDecimal.valueOf(100_000));
        bulkDiscountRepository.save(createBulkDiscount("3 - 5", BigDecimal.valueOf(15)));

        var response = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Discount Street",
                        "0900000000",
                        0,
                        "Discount should use active rule",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 3, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThat(response.discountPercent()).isEqualTo(15);
        assertThat(response.discountAmount()).isEqualByComparingTo("45000");
    }

    @Test
    void dealerCannotCreateOrderBeyondAvailableStock() {
        Dealer dealer = dealerRepository.save(createDealer("stock-check@example.com"));
        Product product = saveProduct("SKU-STOCK-1", BigDecimal.valueOf(100_000), 5);

        assertThatThrownBy(() -> dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Stock Street",
                        "0900000000",
                        0,
                        "Should fail because stock is low",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 6, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void creatingOrderReservesStockAndCancellingOrderRestoresIt() {
        Dealer dealer = dealerRepository.save(createDealer("stock-reserve@example.com"));
        Product product = saveProduct("SKU-STOCK-2", BigDecimal.valueOf(100_000), 5);

        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Reserve Street",
                        "0900000000",
                        0,
                        "Reserve stock",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 3, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(2);

        dealerPortalService.updateOrderStatus(
                dealer.getUsername(),
                createdOrder.id(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED)
        );

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(5);
    }

    @Test
    void dealerCancellationDetachesLegacyNonWarrantySerials() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-cancel-serial@example.com"));
        Product product = saveProduct("SKU-CANCEL-SERIAL-DEALER", BigDecimal.valueOf(100_000), 5);

        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "456 Cancel Serial Street",
                        "0900000000",
                        0,
                        "Legacy serial cleanup",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );
        Order order = orderRepository.findById(createdOrder.id()).orElseThrow();
        ProductSerial serial = productSerialRepository.save(createSerial(
                dealer,
                order,
                product,
                "SERIAL-CANCEL-DEALER-1",
                ProductSerialStatus.DEFECTIVE
        ));

        dealerPortalService.updateOrderStatus(
                dealer.getUsername(),
                createdOrder.id(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED)
        );

        ProductSerial savedSerial = productSerialRepository.findById(serial.getId()).orElseThrow();
        assertThat(savedSerial.getOrder()).isNull();
        assertThat(savedSerial.getStatus()).isEqualTo(ProductSerialStatus.DEFECTIVE);
    }

    @Test
    void mixedOrderAppliesProductSpecificDiscountPerMatchingLine() {
        Dealer dealer = dealerRepository.save(createDealer("mixed-discount@example.com"));
        Product discountedProduct = saveProduct("SKU-MIX-1", BigDecimal.valueOf(100_000));
        Product regularProduct = saveProduct("SKU-MIX-2", BigDecimal.valueOf(50_000));

        BulkDiscount productRule = createBulkDiscount(">=1", BigDecimal.valueOf(20));
        productRule.setProduct(discountedProduct);
        bulkDiscountRepository.save(productRule);
        bulkDiscountRepository.save(createBulkDiscount(">=2", BigDecimal.valueOf(10)));

        var response = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "456 Mixed Street",
                        "0900000000",
                        0,
                        "Mixed product discount",
                        List.of(
                                new CreateDealerOrderItemRequest(discountedProduct.getId(), 1, discountedProduct.getRetailPrice()),
                                new CreateDealerOrderItemRequest(regularProduct.getId(), 1, regularProduct.getRetailPrice())
                        )
                ),
                UUID.randomUUID().toString()
        );

        assertThat(response.subtotal()).isEqualByComparingTo("150000");
        assertThat(response.discountAmount()).isEqualByComparingTo("25000");
        assertThat(response.discountPercent()).isEqualTo(17);
        assertThat(response.totalAmount()).isEqualByComparingTo("137500");
    }

    @Test
    void dealerPayloadCannotOverrideServerProductPrice() {
        Dealer dealer = dealerRepository.save(createDealer("price-guard@example.com"));
        Product product = saveProduct("SKU-PRICE-1", BigDecimal.valueOf(100_000));

        var response = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Price Street",
                        "0900000000",
                        0,
                        "Client price should be ignored",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, BigDecimal.ONE))
                ),
                UUID.randomUUID().toString()
        );

        assertThat(response.subtotal()).isEqualByComparingTo("100000");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("100000");
    }

    @Test
    void dealerPayloadCannotOverrideServerShippingFee() {
        Dealer dealer = dealerRepository.save(createDealer("shipping-fee-guard@example.com"));
        Product product = saveProduct("SKU-SHIP-1", BigDecimal.valueOf(100_000));

        assertThatThrownBy(() -> dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Shipping Street",
                        "0900000000",
                        25_000,
                        "Client shipping fee should be ignored",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("shippingFee is controlled by the server");
    }

    @Test
    void adminCanRecordBankTransferPaymentWhenSepayIsDisabled() {
        Dealer dealer = dealerRepository.save(createDealer("manual-bank-payment@example.com"));
        Product product = saveProduct("SKU-BANK-1", BigDecimal.valueOf(100_000));
        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Payment Street",
                        "0900000000",
                        0,
                        "Admin should confirm payment manually",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        var updatedOrder = adminManagementService.recordOrderPayment(
                createdOrder.id(),
                new RecordPaymentRequest(
                        createdOrder.totalAmount(),
                        PaymentMethod.BANK_TRANSFER,
                        "Admin manual confirmation",
                        "MANUAL-TX-001",
                        "Recorded because SePay is disabled",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        );

        assertThat(updatedOrder.paymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(updatedOrder.paidAmount()).isEqualByComparingTo(createdOrder.totalAmount());
    }

    @Test
    void dealerCanRecordBankTransferPaymentWhenSepayIsDisabled() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-bank-payment@example.com"));
        Product product = saveProduct("SKU-BANK-DEALER-1", BigDecimal.valueOf(100_000));
        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Dealer Payment Street",
                        "0900000000",
                        0,
                        "Dealer should confirm payment manually when SePay is disabled",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        var recordedPayment = dealerPortalService.recordPayment(
                dealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        createdOrder.totalAmount(),
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer manual confirmation",
                        "DEALER-TX-001",
                        "Recorded because SePay is disabled",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        );

        Order updatedOrder = orderRepository.findById(createdOrder.id()).orElseThrow();
        assertThat(recordedPayment.amount()).isEqualByComparingTo(createdOrder.totalAmount());
        assertThat(updatedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(updatedOrder.getPaidAmount()).isEqualByComparingTo(createdOrder.totalAmount());
    }

    @Test
    void adminCannotRecordPaymentAboveOutstandingBalance() {
        Dealer dealer = dealerRepository.save(createDealer("manual-overpay@example.com"));
        Product product = saveProduct("SKU-BANK-2", BigDecimal.valueOf(100_000));
        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Overpay Street",
                        "0900000000",
                        0,
                        "Overpayment should be rejected",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThatThrownBy(() -> adminManagementService.recordOrderPayment(
                createdOrder.id(),
                new RecordPaymentRequest(
                        createdOrder.totalAmount().add(BigDecimal.ONE),
                        PaymentMethod.BANK_TRANSFER,
                        "Admin manual confirmation",
                        "MANUAL-TX-OVERPAY",
                        "Should fail",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("outstanding balance");
    }

    @Test
    void dealerDebtPaymentRejectsPartialAmountsBelowConfiguredMinimum() {
        Dealer dealer = createDealer("partial-payment-floor@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(500_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-DEBT-MIN-1", BigDecimal.valueOf(150_000));
        var createdOrder = dealerPortalService.createOrder(
                savedDealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Minimum Payment Street",
                        "0900000000",
                        0,
                        "Minimum partial payment validation",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThatThrownBy(() -> dealerPortalService.recordPayment(
                savedDealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        BigDecimal.valueOf(50_000),
                        PaymentMethod.DEBT,
                        "Cash",
                        null,
                        "Partial payment below threshold",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("at least 100000 VND");
    }

    @Test
    void dealerDebtPaymentAllowsSmallFinalSettlementBelowConfiguredMinimum() {
        Dealer dealer = createDealer("partial-payment-final@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(500_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-DEBT-MIN-2", BigDecimal.valueOf(150_000));
        var createdOrder = dealerPortalService.createOrder(
                savedDealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Final Settlement Street",
                        "0900000000",
                        0,
                        "Final settlement below threshold should be allowed",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        dealerPortalService.recordPayment(
                savedDealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        BigDecimal.valueOf(100_000),
                        PaymentMethod.DEBT,
                        "Cash",
                        null,
                        "First debt payment",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        );

        var finalPayment = dealerPortalService.recordPayment(
                savedDealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        BigDecimal.valueOf(65_000),
                        PaymentMethod.DEBT,
                        "Cash",
                        null,
                        "Final debt settlement",
                        null,
                        Instant.parse("2026-03-10T03:00:00Z")
                )
        );

        Order updatedOrder = orderRepository.findById(createdOrder.id()).orElseThrow();
        assertThat(finalPayment.amount()).isEqualByComparingTo("65000");
        assertThat(updatedOrder.getPaidAmount()).isEqualByComparingTo("165000");
        assertThat(updatedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void recordPaymentRejectsAmountsThatRoundBelowOneDong() {
        Dealer dealer = createDealer("rounded-payment-floor@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(500_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-DEBT-MIN-3", BigDecimal.valueOf(100_000));
        var createdOrder = dealerPortalService.createOrder(
                savedDealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Rounded Amount Street",
                        "0900000000",
                        0,
                        "Rounded amount guard",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThatThrownBy(() -> dealerPortalService.recordPayment(
                savedDealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        new BigDecimal("0.49"),
                        PaymentMethod.DEBT,
                        "Cash",
                        null,
                        "Rounded below one dong",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("round to at least 1 VND");
    }

    @Test
    void concurrentManualDuplicatePaymentsOnlyRecordOnce() throws Exception {
        Dealer dealer = createDealer("manual-duplicate@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(500_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = saveProduct("SKU-DUP-1", BigDecimal.valueOf(100_000));
        var createdOrder = dealerPortalService.createOrder(
                savedDealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Duplicate Street",
                        "0900000000",
                        0,
                        "Concurrent duplicate payment test",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 2, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<String> task = () -> {
            ready.countDown();
            start.await(5, TimeUnit.SECONDS);
            try {
                adminManagementService.recordOrderPayment(
                        createdOrder.id(),
                        new RecordPaymentRequest(
                                BigDecimal.valueOf(100_000),
                                PaymentMethod.DEBT,
                                "Admin manual confirmation",
                                null,
                                "Concurrent duplicate test",
                                null,
                                Instant.parse("2026-03-10T02:00:00Z")
                        )
                );
                return "recorded";
            } catch (ConflictException ex) {
                return "duplicate";
            }
        };

        try {
            Future<String> first = executor.submit(task);
            Future<String> second = executor.submit(task);
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            List<String> results = new ArrayList<>();
            results.add(first.get(10, TimeUnit.SECONDS));
            results.add(second.get(10, TimeUnit.SECONDS));

            assertThat(results).containsExactlyInAnyOrder("recorded", "duplicate");
        } finally {
            executor.shutdownNow();
        }

        Order savedOrder = orderRepository.findById(createdOrder.id()).orElseThrow();
        assertThat(savedOrder.getPaidAmount()).isEqualByComparingTo("100000");
    }

    @Test
    void dealerCancellationCreatesNotificationForActiveAdmins() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-cancel@example.com"));
        Admin admin = adminRepository.save(createAdmin("ops.admin@example.com"));
        Product product = saveProduct("SKU-CANCEL-1", BigDecimal.valueOf(100_000));
        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Cancel Street",
                        "0900000000",
                        0,
                        "Dealer may cancel this order",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        dealerPortalService.updateOrderStatus(
                dealer.getUsername(),
                createdOrder.id(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED)
        );

        List<Notify> notifications = notifyRepository.findByAccountIdOrderByCreatedAtDesc(admin.getId());
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getContent()).contains("hủy đơn");
        assertThat(notifications.get(0).getLink()).isEqualTo("/orders/" + createdOrder.id());
    }

    @Test
    void dealerOrderCreationUsesSerialPoolInsteadOfStaleProductStock() {
        Dealer dealer = dealerRepository.save(createDealer("stale-stock@example.com"));
        Product product = productRepository.save(createProduct("SKU-STOCK-STALE", BigDecimal.valueOf(100_000), 5));
        productSerialRepository.saveAll(createAvailableSerials(product, 3, "SERIAL-STOCK-STALE"));

        assertThatThrownBy(() -> dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Stale Stock Street",
                        "0900000000",
                        0,
                        "Should fail because serial pool only has three items",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 4, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");

        List<ProductSerial> savedSerials = productSerialRepository.findAll().stream()
                .filter(serial -> serial.getProduct() != null && product.getId().equals(serial.getProduct().getId()))
                .toList();
        assertThat(savedSerials).hasSize(3);
        assertThat(savedSerials).allSatisfy(serial -> {
            assertThat(serial.getOrder()).isNull();
            assertThat(serial.getStatus()).isEqualTo(ProductSerialStatus.AVAILABLE);
        });
    }

    @Test
    void dealerOrderCreationIgnoresAvailableSerialsAlreadyLinkedToAnotherOrder() {
        Dealer dealer = dealerRepository.save(createDealer("linked-stock@example.com"));
        Dealer existingDealer = dealerRepository.save(createDealer("linked-stock-existing@example.com"));
        Product product = productRepository.save(createProduct("SKU-STOCK-LINKED", BigDecimal.valueOf(100_000), 2));
        Order existingOrder = orderRepository.save(createOrder(existingDealer, OrderStatus.PENDING, "WF-LINKED-STOCK-1"));
        ProductSerial linkedSerial = createSerial(
                null,
                null,
                product,
                "SERIAL-STOCK-LINKED-1",
                ProductSerialStatus.AVAILABLE
        );
        linkedSerial.setOrder(existingOrder);
        productSerialRepository.save(linkedSerial);
        productSerialRepository.save(createSerial(
                null,
                null,
                product,
                "SERIAL-STOCK-LINKED-2",
                ProductSerialStatus.AVAILABLE
        ));

        assertThatThrownBy(() -> dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Linked Stock Street",
                        "0900000000",
                        0,
                        "Linked order serials must not be reused as stock",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 2, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");

        ProductSerial savedLinkedSerial = productSerialRepository.findById(linkedSerial.getId()).orElseThrow();
        assertThat(savedLinkedSerial.getOrder()).isNotNull();
        assertThat(savedLinkedSerial.getOrder().getId()).isEqualTo(existingOrder.getId());
        assertThat(savedLinkedSerial.getStatus()).isEqualTo(ProductSerialStatus.AVAILABLE);
    }

    @Test
    void concurrentOrdersAcrossDealersDoNotOversellSharedSerialPool() throws Exception {
        Dealer firstDealer = dealerRepository.save(createDealer("pool-first@example.com"));
        Dealer secondDealer = dealerRepository.save(createDealer("pool-second@example.com"));
        Product product = saveProduct("SKU-SHARED-POOL", BigDecimal.valueOf(100_000), 3);

        CreateDealerOrderRequest request = new CreateDealerOrderRequest(
                PaymentMethod.BANK_TRANSFER,
                "Dealer receiver",
                "123 Shared Pool Street",
                "0900000000",
                0,
                "Shared serial pool race",
                List.of(new CreateDealerOrderItemRequest(product.getId(), 2, product.getRetailPrice()))
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try {
            Future<String> first = executor.submit(() -> attemptCreateOrder(firstDealer.getUsername(), request, ready, start));
            Future<String> second = executor.submit(() -> attemptCreateOrder(secondDealer.getUsername(), request, ready, start));
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            List<String> results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
            assertThat(results).containsExactlyInAnyOrder("created", "stock");
        } finally {
            executor.shutdownNow();
        }

        int visibleOrders = orderRepository.findVisibleByDealerIdOrderByCreatedAtDesc(firstDealer.getId()).size()
                + orderRepository.findVisibleByDealerIdOrderByCreatedAtDesc(secondDealer.getId()).size();
        assertThat(visibleOrders).isEqualTo(1);

        List<ProductSerial> savedSerials = productSerialRepository.findAll().stream()
                .filter(serial -> serial.getProduct() != null && product.getId().equals(serial.getProduct().getId()))
                .toList();
        assertThat(savedSerials.stream().filter(serial -> serial.getStatus() == ProductSerialStatus.RESERVED).count())
                .isEqualTo(2);
        assertThat(savedSerials.stream().filter(serial -> serial.getStatus() == ProductSerialStatus.AVAILABLE).count())
                .isEqualTo(1);
    }

    @Test
    void adminCanDeleteOnlyCancelledOrders() {
        Dealer dealer = dealerRepository.save(createDealer("delete-guard@example.com"));
        Order pendingOrder = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-DELETE-1"));

        assertThatThrownBy(() -> adminManagementService.deleteOrder(pendingOrder.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only cancelled orders can be deleted");

        pendingOrder.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(pendingOrder);

        adminManagementService.deleteOrder(pendingOrder.getId());

        assertThat(orderRepository.findById(pendingOrder.getId()).orElseThrow().getIsDeleted()).isTrue();
    }

    @Test
    void deletedOrdersAreHiddenFromVisibleAdminAndDealerQueries() {
        Dealer dealer = dealerRepository.save(createDealer("delete-visibility@example.com"));
        Order cancelledOrder = orderRepository.save(createOrder(dealer, OrderStatus.CANCELLED, "WF-DELETE-2"));

        adminManagementService.deleteOrder(cancelledOrder.getId());

        assertThat(dealerPortalService.getOrders(dealer.getUsername())).isEmpty();
        assertThat(adminManagementService.getOrders()).isEmpty();
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }

    private Order createOrder(Dealer dealer, OrderStatus status, String orderCode) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(status);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setIsDeleted(false);
        return order;
    }

    private Product createProduct(String sku, BigDecimal retailPrice) {
        return createProduct(sku, retailPrice, 100);
    }

    private Product createProduct(String sku, BigDecimal retailPrice, int stock) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Test product");
        product.setRetailPrice(retailPrice);
        product.setStock(stock);
        product.setIsDeleted(false);
        return product;
    }

    private Product saveProduct(String sku, BigDecimal retailPrice) {
        return saveProduct(sku, retailPrice, 100);
    }

    private Product saveProduct(String sku, BigDecimal retailPrice, int stock) {
        Product product = productRepository.save(createProduct(sku, retailPrice, stock));
        if (stock > 0) {
            productSerialRepository.saveAll(createAvailableSerials(product, stock, "SERIAL-" + sku));
        }
        return productRepository.findById(product.getId()).orElseThrow();
    }

    private List<ProductSerial> createAvailableSerials(Product product, int count, String prefix) {
        List<ProductSerial> serials = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            ProductSerial serial = new ProductSerial();
            serial.setProduct(product);
            serial.setSerial(prefix + "-" + (index + 1));
            serial.setStatus(ProductSerialStatus.AVAILABLE);
            serials.add(serial);
        }
        return serials;
    }

    private String attemptCreateOrder(
            String dealerUsername,
            CreateDealerOrderRequest request,
            CountDownLatch ready,
            CountDownLatch start
    ) throws Exception {
        ready.countDown();
        start.await(5, TimeUnit.SECONDS);
        try {
            dealerPortalService.createOrder(dealerUsername, request, UUID.randomUUID().toString());
            return "created";
        } catch (BadRequestException ex) {
            if (ex.getMessage() != null && ex.getMessage().contains("Insufficient stock")) {
                return "stock";
            }
            throw ex;
        }
    }

    private BulkDiscount createBulkDiscount(String rangeLabel, BigDecimal percent) {
        BulkDiscount discount = new BulkDiscount();
        discount.setLabel("Rule " + rangeLabel);
        discount.setRangeLabel(rangeLabel);
        discount.setDiscountPercent(percent);
        discount.setStatus(DiscountRuleStatus.ACTIVE);
        return discount;
    }

    private Admin createAdmin(String username) {
        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setEmail(username);
        admin.setPassword("encoded-password");
        admin.setDisplayName("Admin " + username);
        admin.setRoleTitle("Ops");
        admin.setUserStatus(StaffUserStatus.ACTIVE);
        admin.setEmailVerified(true);
        admin.setEmailVerifiedAt(Instant.now());
        return admin;
    }

    private ProductSerial createSerial(
            Dealer dealer,
            Order order,
            Product product,
            String serialValue,
            ProductSerialStatus status
    ) {
        ProductSerial serial = new ProductSerial();
        serial.setDealer(dealer);
        serial.setOrder(order);
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(status);
        return serial;
    }
}
