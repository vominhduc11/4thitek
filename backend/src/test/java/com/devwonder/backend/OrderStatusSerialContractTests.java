package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.service.AdminManagementService;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:order_status_serial_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
class OrderStatusSerialContractTests {

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void confirmedOrderKeepsReservedSerialsReserved() {
        Dealer dealer = dealerRepository.save(createDealer("confirmed-serial@example.com"));
        Product product = productRepository.save(createProduct("SKU-CONFIRM-SERIAL"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "SCS-CONFIRM-SERIAL"));
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAmount(BigDecimal.valueOf(100_000));
        order = orderRepository.save(order);
        ProductSerial serial = productSerialRepository.save(createReservedSerial(order, product, "SERIAL-CONFIRM-001"));

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
    void completedOrderAssignsReservedSerialsIntoDealerInventory() {
        Dealer dealer = dealerRepository.save(createDealer("completed-serial@example.com"));
        Product product = productRepository.save(createProduct("SKU-COMPLETE-SERIAL"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.SHIPPING, "SCS-COMPLETE-SERIAL"));
        ProductSerial serial = productSerialRepository.save(createReservedSerial(order, product, "SERIAL-COMPLETE-001"));

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

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealer;
    }

    private Product createProduct(String sku) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Test product");
        product.setRetailPrice(BigDecimal.valueOf(100_000));
        product.setStock(100);
        product.setIsDeleted(false);
        return product;
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

    private ProductSerial createReservedSerial(Order order, Product product, String serialValue) {
        ProductSerial serial = new ProductSerial();
        serial.setOrder(order);
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(ProductSerialStatus.RESERVED);
        return serial;
    }
}
