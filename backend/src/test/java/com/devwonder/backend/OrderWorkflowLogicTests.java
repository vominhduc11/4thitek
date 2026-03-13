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
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.DealerPortalService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
    private BulkDiscountRepository bulkDiscountRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
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
                new UpdateDealerOrderStatusRequest(OrderStatus.COMPLETED)
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
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED)
        );

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(orderRepository.findById(order.getId()).orElseThrow().getPaymentStatus())
                .isEqualTo(PaymentStatus.CANCELLED);
    }

    @Test
    void dealerCannotCreateDebtOrderBeyondCreditLimit() {
        Dealer dealer = createDealer("credit-limit@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(100_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = productRepository.save(createProduct("SKU-CREDIT-1", BigDecimal.valueOf(100_000)));

        CreateDealerOrderRequest request = new CreateDealerOrderRequest(
                PaymentMethod.DEBT,
                "Dealer receiver",
                "123 Credit Street",
                "0900000000",
                0,
                "Debt order should exceed limit",
                List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
        );

        assertThatThrownBy(() -> dealerPortalService.createOrder(savedDealer.getUsername(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Credit limit exceeded");
    }

    @Test
    void concurrentDebtOrdersRespectDealerCreditLimit() throws Exception {
        Dealer dealer = createDealer("credit-limit-race@example.com");
        dealer.setCreditLimit(BigDecimal.valueOf(150_000));
        Dealer savedDealer = dealerRepository.save(dealer);
        Product product = productRepository.save(createProduct("SKU-CREDIT-RACE-1", BigDecimal.valueOf(100_000), 10));

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
                dealerPortalService.createOrder(savedDealer.getUsername(), request);
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
    void discountPercentUsesActiveBulkDiscountRuleRange() {
        Dealer dealer = dealerRepository.save(createDealer("discount-rule@example.com"));
        Product product = productRepository.save(createProduct("SKU-DISCOUNT-1", BigDecimal.valueOf(100_000)));
        bulkDiscountRepository.save(createBulkDiscount("3 - 5", BigDecimal.valueOf(15)));

        var response = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Discount Street",
                        "0900000000",
                        0,
                        "Discount should use active rule",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 3, product.getRetailPrice()))
                )
        );

        assertThat(response.discountPercent()).isEqualTo(15);
        assertThat(response.discountAmount()).isEqualByComparingTo("45000");
    }

    @Test
    void dealerCannotCreateOrderBeyondAvailableStock() {
        Dealer dealer = dealerRepository.save(createDealer("stock-check@example.com"));
        Product product = productRepository.save(createProduct("SKU-STOCK-1", BigDecimal.valueOf(100_000), 5));

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
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void creatingOrderReservesStockAndCancellingOrderRestoresIt() {
        Dealer dealer = dealerRepository.save(createDealer("stock-reserve@example.com"));
        Product product = productRepository.save(createProduct("SKU-STOCK-2", BigDecimal.valueOf(100_000), 5));

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
                )
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
    void mixedOrderAppliesProductSpecificDiscountPerMatchingLine() {
        Dealer dealer = dealerRepository.save(createDealer("mixed-discount@example.com"));
        Product discountedProduct = productRepository.save(createProduct("SKU-MIX-1", BigDecimal.valueOf(100_000)));
        Product regularProduct = productRepository.save(createProduct("SKU-MIX-2", BigDecimal.valueOf(50_000)));

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
                )
        );

        assertThat(response.subtotal()).isEqualByComparingTo("150000");
        assertThat(response.discountAmount()).isEqualByComparingTo("25000");
        assertThat(response.discountPercent()).isEqualTo(17);
        assertThat(response.totalAmount()).isEqualByComparingTo("137500");
    }

    @Test
    void adminCanRecordBankTransferPaymentWhenSepayIsDisabled() {
        Dealer dealer = dealerRepository.save(createDealer("manual-bank-payment@example.com"));
        Product product = productRepository.save(createProduct("SKU-BANK-1", BigDecimal.valueOf(100_000)));
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
                )
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
    void adminCannotRecordPaymentAboveOutstandingBalance() {
        Dealer dealer = dealerRepository.save(createDealer("manual-overpay@example.com"));
        Product product = productRepository.save(createProduct("SKU-BANK-2", BigDecimal.valueOf(100_000)));
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
                )
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
    void concurrentManualDuplicatePaymentsOnlyRecordOnce() throws Exception {
        Dealer dealer = dealerRepository.save(createDealer("manual-duplicate@example.com"));
        Product product = productRepository.save(createProduct("SKU-DUP-1", BigDecimal.valueOf(100_000)));
        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Duplicate Street",
                        "0900000000",
                        0,
                        "Concurrent duplicate payment test",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 2, product.getRetailPrice()))
                )
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
        Product product = productRepository.save(createProduct("SKU-CANCEL-1", BigDecimal.valueOf(100_000)));
        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Cancel Street",
                        "0900000000",
                        0,
                        "Dealer may cancel this order",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                )
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
        return admin;
    }
}
