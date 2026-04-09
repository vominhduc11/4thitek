package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Guards the JSON field names and envelope shape for the dealer/admin order
 * and payment APIs consumed by dealer app and admin-fe.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:order_payment_response_shape;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=orders.shape.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Orders Shape Admin"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class OrderPaymentResponseShapeTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Dealer dealer;
    private Product product;
    private Order order;

    @BeforeEach
    void setUp() throws Exception {
        notifyRepository.deleteAll();
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();

        Admin admin = adminRepository.findByUsername("orders.shape.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);

        dealer = registerActiveDealer("order-shape");
        product = productRepository.save(createProduct("SKU-ORDER-SHAPE", BigDecimal.valueOf(100_000)));
        order = saveOrderWithPayment(dealer, product);
    }

    @Test
    void dealerOrdersEndpointKeepsResponseShape() throws Exception {
        String dealerToken = login(dealer.getEmail(), "Dealer#123");

        mockMvc.perform(get("/api/v1/dealer/orders")
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(order.getId()))
                .andExpect(jsonPath("$.data[0].orderCode").value(order.getOrderCode()))
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.data[0].paymentMethod").value("BANK_TRANSFER"))
                .andExpect(jsonPath("$.data[0].paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.data[0].paidAmount").isNumber())
                .andExpect(jsonPath("$.data[0].subtotal").isNumber())
                .andExpect(jsonPath("$.data[0].discountPercent").isNumber())
                .andExpect(jsonPath("$.data[0].discountAmount").isNumber())
                .andExpect(jsonPath("$.data[0].vatPercent").value(10))
                .andExpect(jsonPath("$.data[0].vatAmount").isNumber())
                .andExpect(jsonPath("$.data[0].shippingFee").value(0))
                .andExpect(jsonPath("$.data[0].totalAmount").isNumber())
                .andExpect(jsonPath("$.data[0].outstandingAmount").isNumber())
                .andExpect(jsonPath("$.data[0].receiverName").value("Dealer Receiver"))
                .andExpect(jsonPath("$.data[0].receiverAddress").value("123 Contract Street"))
                .andExpect(jsonPath("$.data[0].receiverPhone").value("0900000000"))
                .andExpect(jsonPath("$.data[0].note").value("Shape test order note"))
                .andExpect(jsonPath("$.data[0].createdAt").exists())
                .andExpect(jsonPath("$.data[0].updatedAt").exists())
                .andExpect(jsonPath("$.data[0].completedAt").exists())
                .andExpect(jsonPath("$.data[0].items").isArray())
                .andExpect(jsonPath("$.data[0].items[0].productId").value(product.getId()))
                .andExpect(jsonPath("$.data[0].items[0].productName").value(product.getName()))
                .andExpect(jsonPath("$.data[0].items[0].productSku").value(product.getSku()))
                .andExpect(jsonPath("$.data[0].items[0].quantity").value(1))
                .andExpect(jsonPath("$.data[0].items[0].unitPrice").isNumber())
                .andExpect(jsonPath("$.data[0].items[0].lineTotal").isNumber());
    }

    @Test
    void dealerOrderPaymentsEndpointKeepsResponseShape() throws Exception {
        String dealerToken = login(dealer.getEmail(), "Dealer#123");

        mockMvc.perform(get("/api/v1/dealer/orders/{id}/payments", order.getId())
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").isNumber())
                .andExpect(jsonPath("$.data[0].orderId").value(order.getId()))
                .andExpect(jsonPath("$.data[0].amount").isNumber())
                .andExpect(jsonPath("$.data[0].method").value("BANK_TRANSFER"))
                .andExpect(jsonPath("$.data[0].status").value("PAID"))
                .andExpect(jsonPath("$.data[0].channel").value("MANUAL_UPLOAD"))
                .andExpect(jsonPath("$.data[0].transactionCode").value("TX-SHAPE-001"))
                .andExpect(jsonPath("$.data[0].note").value("Shape test payment note"))
                .andExpect(jsonPath("$.data[0].proofFileName").value("proof-shape.png"))
                .andExpect(jsonPath("$.data[0].paidAt").exists())
                .andExpect(jsonPath("$.data[0].createdAt").exists());
    }

    @Test
    void adminOrdersEndpointKeepsResponseShape() throws Exception {
        String adminToken = login("orders.shape.admin@example.com", "ChangedPass#456");

        mockMvc.perform(get("/api/v1/admin/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(order.getId()))
                .andExpect(jsonPath("$.data[0].orderCode").value(order.getOrderCode()))
                .andExpect(jsonPath("$.data[0].dealerId").value(dealer.getId()))
                .andExpect(jsonPath("$.data[0].dealerName").isString())
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.data[0].paymentMethod").value("BANK_TRANSFER"))
                .andExpect(jsonPath("$.data[0].paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.data[0].paidAmount").isNumber())
                .andExpect(jsonPath("$.data[0].createdAt").exists())
                .andExpect(jsonPath("$.data[0].updatedAt").exists())
                .andExpect(jsonPath("$.data[0].totalAmount").isNumber())
                .andExpect(jsonPath("$.data[0].outstandingAmount").isNumber())
                .andExpect(jsonPath("$.data[0].itemCount").value(1))
                .andExpect(jsonPath("$.data[0].address").value("123 Contract Street"))
                .andExpect(jsonPath("$.data[0].note").value("Shape test order note"))
                .andExpect(jsonPath("$.data[0].orderItems").isArray())
                .andExpect(jsonPath("$.data[0].orderItems[0].productId").value(product.getId()))
                .andExpect(jsonPath("$.data[0].orderItems[0].productSku").value(product.getSku()))
                .andExpect(jsonPath("$.data[0].orderItems[0].productName").value(product.getName()))
                .andExpect(jsonPath("$.data[0].orderItems[0].quantity").value(1))
                .andExpect(jsonPath("$.data[0].orderItems[0].unitPrice").isNumber())
                .andExpect(jsonPath("$.data[0].staleReviewRequired").value(false))
                .andExpect(jsonPath("$.data[0].allowedTransitions").isArray());
    }

    @Test
    void adminOrderAndDealerAccountEndpointsExposeBackendTransitionHints() throws Exception {
        String adminToken = login("orders.shape.admin@example.com", "ChangedPass#456");
        Order unpaidPendingOrder = saveOrderWithStatus(
                dealer,
                product,
                "ORD-SHAPE-PENDING",
                OrderStatus.PENDING,
                PaymentStatus.PENDING,
                BigDecimal.ZERO
        );

        mockMvc.perform(get("/api/v1/admin/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].orderCode").value(unpaidPendingOrder.getOrderCode()))
                .andExpect(jsonPath("$.data[0].allowedTransitions[0]").value("PENDING"))
                .andExpect(jsonPath("$.data[0].allowedTransitions[1]").value("CANCELLED"));

        mockMvc.perform(get("/api/v1/admin/dealers/accounts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(APPLICATION_JSON))
                .andExpect(jsonPath("$.data[0].id").value(dealer.getId()))
                .andExpect(jsonPath("$.data[0].revenue").isNumber())
                .andExpect(jsonPath("$.data[0].allowedTransitions").isArray())
                .andExpect(jsonPath("$.data[0].allowedTransitions[0]").value("ACTIVE"))
                .andExpect(jsonPath("$.data[0].allowedTransitions[1]").value("SUSPENDED"));
    }

    @Test
    void adminRecentPaymentsEndpointKeepsResponseShapeAndFlagsBurstActivity() throws Exception {
        String adminToken = login("orders.shape.admin@example.com", "ChangedPass#456");
        saveBankTransferOrderWithPayment("ORD-BANK-SHAPE-1", "TX-BANK-SHAPE-1", Instant.parse("2026-03-10T01:00:00Z"));
        saveBankTransferOrderWithPayment("ORD-BANK-SHAPE-2", "TX-BANK-SHAPE-2", Instant.parse("2026-03-10T01:20:00Z"));
        Order flaggedOrder = saveBankTransferOrderWithPayment(
                "ORD-BANK-SHAPE-3",
                "TX-BANK-SHAPE-3",
                Instant.parse("2026-03-10T01:40:00Z")
        );

        mockMvc.perform(get("/api/v1/admin/payments/recent")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("dealerId", dealer.getId().toString())
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items[0].id").isNumber())
                .andExpect(jsonPath("$.data.items[0].orderId").value(flaggedOrder.getId()))
                .andExpect(jsonPath("$.data.items[0].orderCode").value("ORD-BANK-SHAPE-3"))
                .andExpect(jsonPath("$.data.items[0].dealerId").value(dealer.getId()))
                .andExpect(jsonPath("$.data.items[0].dealerName").isString())
                .andExpect(jsonPath("$.data.items[0].amount").isNumber())
                .andExpect(jsonPath("$.data.items[0].method").value("BANK_TRANSFER"))
                .andExpect(jsonPath("$.data.items[0].status").value("PAID"))
                .andExpect(jsonPath("$.data.items[0].channel").value("Dealer bank transfer confirmation"))
                .andExpect(jsonPath("$.data.items[0].transactionCode").value("TX-BANK-SHAPE-3"))
                .andExpect(jsonPath("$.data.items[0].note").value("Bank transfer payment shape test"))
                .andExpect(jsonPath("$.data.items[0].proofFileName").value("proof-bank-shape.png"))
                .andExpect(jsonPath("$.data.items[0].paidAt").exists())
                .andExpect(jsonPath("$.data.items[0].createdAt").exists())
                .andExpect(jsonPath("$.data.items[0].reviewSuggested").value(true));
    }

    @Test
    void dealerOrderCreateEndpointRejectsUnsupportedPaymentMethodPayload() throws Exception {
        String dealerToken = login(dealer.getEmail(), "Dealer#123");

        mockMvc.perform(post("/api/v1/dealer/orders")
                        .header("Authorization", "Bearer " + dealerToken)
                        .header("X-Idempotency-Key", "shape-invalid-payment-method")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "paymentMethod": "CASH",
                                  "receiverName": "Dealer Receiver",
                                  "receiverAddress": "123 Contract Street",
                                  "receiverPhone": "0900000000",
                                  "shippingFee": 0,
                                  "note": "Reject unsupported payment payload",
                                  "items": [
                                    {
                                      "productId": %d,
                                      "quantity": 1,
                                      "unitPrice": 100000
                                    }
                                  ]
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only BANK_TRANSFER is supported"));
    }

    private Dealer registerActiveDealer(String prefix) throws Exception {
        String username = prefix + "@example.com";
        String email = "mail+" + prefix + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "Dealer#123",
                                  "businessName": "Dealer %s",
                                  "contactName": "Dealer %s",
                                  "taxCode": "TAX-%s",
                                  "phone": "0901234567",
                                  "email": "%s",
                                  "addressLine": "123 Dealer Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """.formatted(username, prefix, prefix, prefix, email)))
                .andExpect(status().isOk());

        Dealer savedDealer = dealerRepository.findByUsername(username).orElseThrow();
        savedDealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealerRepository.save(savedDealer);
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }

    private Product createProduct(String sku, BigDecimal retailPrice) {
        Product seededProduct = new Product();
        seededProduct.setSku(sku);
        seededProduct.setName("Product " + sku);
        seededProduct.setShortDescription("Shape test product");
        seededProduct.setRetailPrice(retailPrice);
        seededProduct.setStock(10);
        seededProduct.setWarrantyPeriod(12);
        seededProduct.setIsDeleted(false);
        return seededProduct;
    }

    private Order saveOrderWithPayment(Dealer seededDealer, Product seededProduct) {
        return saveOrderWithStatus(
                seededDealer,
                seededProduct,
                "ORD-SHAPE-001",
                OrderStatus.COMPLETED,
                PaymentStatus.PAID,
                BigDecimal.valueOf(110_000)
        );
    }

    private Order saveOrderWithStatus(
            Dealer seededDealer,
            Product seededProduct,
            String orderCode,
            OrderStatus orderStatus,
            PaymentStatus paymentStatus,
            BigDecimal paidAmount
    ) {
        Order seededOrder = new Order();
        seededOrder.setDealer(seededDealer);
        seededOrder.setOrderCode(orderCode);
        seededOrder.setStatus(orderStatus);
        seededOrder.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        seededOrder.setPaymentStatus(paymentStatus);
        seededOrder.setPaidAmount(paidAmount);
        seededOrder.setIsDeleted(false);
        seededOrder.setReceiverName("Dealer Receiver");
        seededOrder.setReceiverAddress("123 Contract Street");
        seededOrder.setReceiverPhone("0900000000");
        seededOrder.setShippingFee(0);
        seededOrder.setNote("Shape test order note");
        if (orderStatus == OrderStatus.COMPLETED) {
            seededOrder.setCompletedAt(Instant.parse("2026-03-11T05:00:00Z"));
        }
        seededOrder.setStaleReviewRequired(Boolean.FALSE);

        OrderItem item = new OrderItem();
        item.setOrder(seededOrder);
        item.setProduct(seededProduct);
        item.setQuantity(1);
        item.setUnitPrice(seededProduct.getRetailPrice());
        Set<OrderItem> items = new LinkedHashSet<>();
        items.add(item);
        seededOrder.setOrderItems(items);

        Order savedOrder = orderRepository.saveAndFlush(seededOrder);

        if (paymentStatus == PaymentStatus.PAID && paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = new Payment();
            payment.setOrder(savedOrder);
            payment.setAmount(paidAmount);
            payment.setMethod(PaymentMethod.BANK_TRANSFER);
            payment.setStatus(PaymentStatus.PAID);
            payment.setChannel("MANUAL_UPLOAD");
            payment.setTransactionCode("TX-SHAPE-001");
            payment.setNote("Shape test payment note");
            payment.setProofFileName("proof-shape.png");
            payment.setPaidAt(Instant.parse("2026-03-10T00:10:00Z"));
            paymentRepository.saveAndFlush(payment);
        }

        return orderRepository.findById(savedOrder.getId()).orElseThrow();
    }

    private Order saveBankTransferOrderWithPayment(String orderCode, String transactionCode, Instant paidAt) {
        Order bankTransferOrder = new Order();
        bankTransferOrder.setDealer(dealer);
        bankTransferOrder.setOrderCode(orderCode);
        bankTransferOrder.setStatus(OrderStatus.PENDING);
        bankTransferOrder.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        bankTransferOrder.setPaymentStatus(PaymentStatus.PAID);
        bankTransferOrder.setPaidAmount(BigDecimal.valueOf(50_000));
        bankTransferOrder.setIsDeleted(false);
        bankTransferOrder.setReceiverName("Bank Transfer Dealer Receiver");
        bankTransferOrder.setReceiverAddress("456 Payment Street");
        bankTransferOrder.setReceiverPhone("0911000000");
        bankTransferOrder.setShippingFee(0);
        bankTransferOrder.setNote("Bank transfer order shape test");

        OrderItem item = new OrderItem();
        item.setOrder(bankTransferOrder);
        item.setProduct(product);
        item.setQuantity(1);
        item.setUnitPrice(product.getRetailPrice());
        bankTransferOrder.setOrderItems(new LinkedHashSet<>(Set.of(item)));

        Order savedOrder = orderRepository.saveAndFlush(bankTransferOrder);

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setAmount(BigDecimal.valueOf(50_000));
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PAID);
        payment.setChannel("Dealer bank transfer confirmation");
        payment.setTransactionCode(transactionCode);
        payment.setNote("Bank transfer payment shape test");
        payment.setProofFileName("proof-bank-shape.png");
        payment.setPaidAt(paidAt);
        paymentRepository.saveAndFlush(payment);

        return orderRepository.findById(savedOrder.getId()).orElseThrow();
    }
}
