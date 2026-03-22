package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.admin.AdminAssignOrderSerialsRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.service.AdminManagementService;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:assign_order_serials_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
class AdminAssignOrderSerialsContractTests {

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
    void assigningSerialsAcrossMultipleLinesCannotExceedOrderedQuantity() {
        Dealer dealer = dealerRepository.save(createDealer("assign-overflow@example.com"));
        Product product = productRepository.save(createProduct("SKU-ASSIGN-OVERFLOW"));
        Order order = orderRepository.save(createOrderWithItems(dealer, product, 2, "ASG-OVERFLOW"));
        createAvailableSerial(product, "ASG-OVERFLOW-001");
        createAvailableSerial(product, "ASG-OVERFLOW-002");
        createAvailableSerial(product, "ASG-OVERFLOW-003");

        AdminAssignOrderSerialsRequest request = new AdminAssignOrderSerialsRequest(List.of(
                new AdminAssignOrderSerialsRequest.LineAssignment(product.getId(), List.of("ASG-OVERFLOW-001")),
                new AdminAssignOrderSerialsRequest.LineAssignment(product.getId(), List.of("ASG-OVERFLOW-002", "ASG-OVERFLOW-003"))
        ));

        assertThatThrownBy(() -> adminManagementService.assignOrderSerials(order.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds ordered quantity");
    }

    @Test
    void assigningDuplicateSerialsInSameRequestIsRejected() {
        Dealer dealer = dealerRepository.save(createDealer("assign-duplicate@example.com"));
        Product product = productRepository.save(createProduct("SKU-ASSIGN-DUPLICATE"));
        Order order = orderRepository.save(createOrderWithItems(dealer, product, 2, "ASG-DUPLICATE"));
        createAvailableSerial(product, "ASG-DUPLICATE-001");
        createAvailableSerial(product, "ASG-DUPLICATE-002");

        AdminAssignOrderSerialsRequest request = new AdminAssignOrderSerialsRequest(List.of(
                new AdminAssignOrderSerialsRequest.LineAssignment(product.getId(), List.of("ASG-DUPLICATE-001")),
                new AdminAssignOrderSerialsRequest.LineAssignment(product.getId(), List.of("ASG-DUPLICATE-001"))
        ));

        assertThatThrownBy(() -> adminManagementService.assignOrderSerials(order.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Duplicate serial in request");
    }

    @Test
    void assigningSerialsAtOrderedQuantityBoundarySucceeds() {
        Dealer dealer = dealerRepository.save(createDealer("assign-boundary@example.com"));
        Product product = productRepository.save(createProduct("SKU-ASSIGN-BOUNDARY"));
        Order order = orderRepository.save(createOrderWithItems(dealer, product, 2, "ASG-BOUNDARY"));
        ProductSerial first = createAvailableSerial(product, "ASG-BOUNDARY-001");
        ProductSerial second = createAvailableSerial(product, "ASG-BOUNDARY-002");

        List<?> response = adminManagementService.assignOrderSerials(order.getId(), new AdminAssignOrderSerialsRequest(List.of(
                new AdminAssignOrderSerialsRequest.LineAssignment(product.getId(), List.of("ASG-BOUNDARY-001")),
                new AdminAssignOrderSerialsRequest.LineAssignment(product.getId(), List.of("ASG-BOUNDARY-002"))
        )));

        assertThat(response).hasSize(2);
        assertThat(productSerialRepository.findById(first.getId()).orElseThrow().getStatus()).isEqualTo(ProductSerialStatus.RESERVED);
        assertThat(productSerialRepository.findById(second.getId()).orElseThrow().getStatus()).isEqualTo(ProductSerialStatus.RESERVED);
        assertThat(productSerialRepository.findById(first.getId()).orElseThrow().getOrder().getId()).isEqualTo(order.getId());
        assertThat(productSerialRepository.findById(second.getId()).orElseThrow().getOrder().getId()).isEqualTo(order.getId());
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }

    private Product createProduct(String sku) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Assign serial test product");
        product.setRetailPrice(BigDecimal.valueOf(100_000));
        product.setStock(100);
        product.setIsDeleted(false);
        return product;
    }

    private Order createOrderWithItems(Dealer dealer, Product product, int quantity, String orderCode) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setIsDeleted(false);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setUnitPrice(product.getRetailPrice());

        order.setOrderItems(new LinkedHashSet<>());
        order.getOrderItems().add(item);
        return order;
    }

    private ProductSerial createAvailableSerial(Product product, String serialValue) {
        ProductSerial serial = new ProductSerial();
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        return productSerialRepository.save(serial);
    }
}
