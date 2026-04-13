package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.admin.AdminCompleteReturnRequest;
import com.devwonder.backend.dto.admin.AdminInspectReturnItemRequest;
import com.devwonder.backend.dto.admin.AdminReceiveReturnRequest;
import com.devwonder.backend.dto.admin.AdminReviewReturnItemDecision;
import com.devwonder.backend.dto.admin.AdminReviewReturnRequest;
import com.devwonder.backend.dto.dealer.CreateDealerReturnRequest;
import com.devwonder.backend.dto.dealer.DealerReturnRequestAttachmentPayload;
import com.devwonder.backend.dto.dealer.DealerReturnRequestItemPayload;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.dto.returns.ReturnRequestDetailResponse;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.ReturnRequestAttachmentCategory;
import com.devwonder.backend.entity.enums.ReturnRequestItemCondition;
import com.devwonder.backend.entity.enums.ReturnRequestItemFinalResolution;
import com.devwonder.backend.entity.enums.ReturnRequestItemStatus;
import com.devwonder.backend.entity.enums.ReturnRequestResolution;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import com.devwonder.backend.entity.enums.ReturnRequestType;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.ReturnRequestRepository;
import com.devwonder.backend.service.DealerPortalService;
import com.devwonder.backend.service.ReturnRequestService;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:return_request_workflow;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
class ReturnRequestWorkflowTests {

    @Autowired
    private ReturnRequestService returnRequestService;

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private ReturnRequestRepository returnRequestRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @BeforeEach
    void setUp() {
        returnRequestRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        notifyRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void dealerCanSubmitValidReturnRequestForCompletedOrderSerials() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-valid@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-1", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-001", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-001",
                ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), serial.getId())
        );

        assertThat(created.status()).isEqualTo(ReturnRequestStatus.SUBMITTED);
        assertThat(created.items()).hasSize(1);
        assertThat(created.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.REQUESTED);
        assertThat(created.supportTicketId()).isNotNull();
    }

    @Test
    void dealerCannotSubmitReturnRequestForNonOwnedSerial() {
        Dealer owner = dealerRepository.save(createDealer("dealer-owner@example.com"));
        Dealer requester = dealerRepository.save(createDealer("dealer-requester@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-2", BigDecimal.valueOf(120_000)));
        Order ownerOrder = orderRepository.save(createOrder(owner, product, 1, "RET-ORDER-OWNER", OrderStatus.COMPLETED));
        Order requesterOrder = orderRepository.save(createOrder(requester, product, 1, "RET-ORDER-REQUESTER", OrderStatus.COMPLETED));
        ProductSerial ownerSerial = productSerialRepository.save(createDealerOwnedSerial(
                owner,
                ownerOrder,
                product,
                "RET-SERIAL-OWNER",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                requester.getUsername(),
                createRequest(requesterOrder.getId(), ownerSerial.getId())
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Serial not owned by dealer");
    }

    @Test
    void dealerCannotSubmitReturnRequestForNonCompletedOrder() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-pending@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-3", BigDecimal.valueOf(130_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-PENDING", OrderStatus.SHIPPING));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-PENDING",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), serial.getId())
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only completed orders");
    }

    @Test
    void dealerCannotDuplicateActiveRequestForSameSerial() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-duplicate@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-4", BigDecimal.valueOf(140_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-DUP", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-DUP",
                ProductSerialStatus.ASSIGNED
        ));

        returnRequestService.createDealerReturnRequest(dealer.getUsername(), createRequest(order.getId(), serial.getId()));

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), serial.getId())
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("active return request");
    }

    @Test
    void adminCanPartiallyApproveAndRejectItems() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-review@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-5", BigDecimal.valueOf(150_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 2, "RET-ORDER-REVIEW", OrderStatus.COMPLETED));
        ProductSerial first = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-REVIEW-1", ProductSerialStatus.ASSIGNED
        ));
        ProductSerial second = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-REVIEW-2", ProductSerialStatus.ASSIGNED
        ));
        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), first.getId(), second.getId())
        );

        ReturnRequestDetailResponse reviewed = returnRequestService.reviewReturnRequest(
                created.id(),
                new AdminReviewReturnRequest(
                        List.of(
                                new AdminReviewReturnItemDecision(created.items().get(0).id(), true, "Approve"),
                                new AdminReviewReturnItemDecision(created.items().get(1).id(), false, "Reject")
                        ),
                        true
                ),
                "admin-reviewer"
        );

        assertThat(reviewed.status()).isEqualTo(ReturnRequestStatus.AWAITING_RECEIPT);
        assertThat(reviewed.items()).anySatisfy(item ->
                assertThat(item.itemStatus()).isEqualTo(ReturnRequestItemStatus.APPROVED));
        assertThat(reviewed.items()).anySatisfy(item ->
                assertThat(item.itemStatus()).isEqualTo(ReturnRequestItemStatus.REJECTED));
    }

    @Test
    void adminCanMarkReceivedAndMoveSerialToReturned() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-receive@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-6", BigDecimal.valueOf(160_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-RECEIVE", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-RECEIVE", ProductSerialStatus.ASSIGNED
        ));
        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(), createRequest(order.getId(), serial.getId())
        );
        ReturnRequestDetailResponse reviewed = returnRequestService.reviewReturnRequest(
                created.id(),
                new AdminReviewReturnRequest(
                        List.of(new AdminReviewReturnItemDecision(created.items().get(0).id(), true, "Approve")),
                        true
                ),
                "admin-reviewer"
        );

        ReturnRequestDetailResponse received = returnRequestService.receiveReturnRequest(
                reviewed.id(),
                new AdminReceiveReturnRequest(List.of(reviewed.items().get(0).id()), "Warehouse received"),
                "admin-warehouse"
        );

        assertThat(received.status()).isEqualTo(ReturnRequestStatus.RECEIVED);
        assertThat(received.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.RECEIVED);
        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.RETURNED);
    }

    @Test
    void adminCanInspectAndResolveItem() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-inspect@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-7", BigDecimal.valueOf(170_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-INSPECT", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-INSPECT", ProductSerialStatus.ASSIGNED
        ));
        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(), createRequest(order.getId(), serial.getId())
        );
        ReturnRequestDetailResponse reviewed = returnRequestService.reviewReturnRequest(
                created.id(),
                new AdminReviewReturnRequest(
                        List.of(new AdminReviewReturnItemDecision(created.items().get(0).id(), true, "Approve")),
                        true
                ),
                "admin-reviewer"
        );
        ReturnRequestDetailResponse received = returnRequestService.receiveReturnRequest(
                reviewed.id(),
                new AdminReceiveReturnRequest(List.of(reviewed.items().get(0).id()), "Received"),
                "admin-warehouse"
        );

        ReturnRequestDetailResponse inspecting = returnRequestService.inspectReturnItem(
                received.id(),
                received.items().get(0).id(),
                new AdminInspectReturnItemRequest(
                        com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.START_INSPECTION,
                        "Start inspection",
                        List.of("https://proof/start.jpg"),
                        null,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );
        assertThat(inspecting.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.INSPECTING);

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                inspecting.id(),
                inspecting.items().get(0).id(),
                new AdminInspectReturnItemRequest(
                        com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.PASS_QC,
                        "QC pass",
                        List.of("https://proof/pass.jpg"),
                        ReturnRequestItemFinalResolution.RESTOCK,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.RESTOCKED);
        assertThat(resolved.items().get(0).finalResolution()).isEqualTo(ReturnRequestItemFinalResolution.RESTOCK);
        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.AVAILABLE);
    }

    @Test
    void requestCompletesOnlyWhenAllItemsResolved() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-complete@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-8", BigDecimal.valueOf(180_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 2, "RET-ORDER-COMPLETE", OrderStatus.COMPLETED));
        ProductSerial first = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-COMPLETE-1", ProductSerialStatus.ASSIGNED
        ));
        ProductSerial second = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-COMPLETE-2", ProductSerialStatus.ASSIGNED
        ));
        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(), createRequest(order.getId(), first.getId(), second.getId())
        );
        ReturnRequestDetailResponse reviewed = returnRequestService.reviewReturnRequest(
                created.id(),
                new AdminReviewReturnRequest(
                        List.of(
                                new AdminReviewReturnItemDecision(created.items().get(0).id(), true, "Approve 1"),
                                new AdminReviewReturnItemDecision(created.items().get(1).id(), true, "Approve 2")
                        ),
                        true
                ),
                "admin-reviewer"
        );
        ReturnRequestDetailResponse received = returnRequestService.receiveReturnRequest(
                reviewed.id(),
                new AdminReceiveReturnRequest(null, "Receive all"),
                "admin-warehouse"
        );

        ReturnRequestDetailResponse firstStarted = returnRequestService.inspectReturnItem(
                received.id(),
                received.items().get(0).id(),
                new AdminInspectReturnItemRequest(
                        com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.START_INSPECTION,
                        "Start first",
                        List.of("https://proof/first-start.jpg"),
                        null,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );
        ReturnRequestDetailResponse firstResolved = returnRequestService.inspectReturnItem(
                firstStarted.id(),
                firstStarted.items().get(0).id(),
                new AdminInspectReturnItemRequest(
                        com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.PASS_QC,
                        "Pass first",
                        List.of("https://proof/first-pass.jpg"),
                        ReturnRequestItemFinalResolution.RESTOCK,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThatThrownBy(() -> returnRequestService.completeReturnRequest(
                firstResolved.id(),
                new AdminCompleteReturnRequest("Try complete early"),
                "admin"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must be resolved");

        ReturnRequestDetailResponse secondStarted = returnRequestService.inspectReturnItem(
                firstResolved.id(),
                firstResolved.items().get(1).id(),
                new AdminInspectReturnItemRequest(
                        com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.START_INSPECTION,
                        "Start second",
                        List.of("https://proof/second-start.jpg"),
                        null,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );
        ReturnRequestDetailResponse secondResolved = returnRequestService.inspectReturnItem(
                secondStarted.id(),
                secondStarted.items().get(1).id(),
                new AdminInspectReturnItemRequest(
                        com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.SCRAP,
                        "Scrap second",
                        List.of("https://proof/second-scrap.jpg"),
                        ReturnRequestItemFinalResolution.SCRAP,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );

        ReturnRequestDetailResponse completed = returnRequestService.completeReturnRequest(
                secondResolved.id(),
                new AdminCompleteReturnRequest("Complete"),
                "admin"
        );

        assertThat(completed.status()).isEqualTo(ReturnRequestStatus.COMPLETED);
    }

    @Test
    void supportLinkageDoesNotReplaceReturnRequestTruth() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-support-link@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-9", BigDecimal.valueOf(190_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-SUPPORT", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-SUPPORT", ProductSerialStatus.ASSIGNED
        ));
        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(), createRequest(order.getId(), serial.getId())
        );
        Long supportTicketId = created.supportTicketId();
        assertThat(supportTicketId).isNotNull();

        var supportTicket = dealerSupportTicketRepository.findById(supportTicketId).orElseThrow();
        supportTicket.setStatus(DealerSupportTicketStatus.CLOSED);
        dealerSupportTicketRepository.save(supportTicket);

        ReturnRequestDetailResponse detail = returnRequestService.getAdminReturnDetail(created.id());
        assertThat(detail.status()).isEqualTo(ReturnRequestStatus.SUBMITTED);
        assertThat(detail.supportTicketId()).isEqualTo(supportTicketId);
    }

    @Test
    void oldDealerDirectReturnedMutationPathIsBlocked() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-direct-mutation@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-10", BigDecimal.valueOf(200_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-OLD-PATH", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-OLD-PATH", ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> dealerPortalService.updateSerialStatus(
                dealer.getUsername(),
                serial.getId(),
                new UpdateDealerSerialStatusRequest(ProductSerialStatus.RETURNED)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("submit a return request");
    }

    private CreateDealerReturnRequest createRequest(Long orderId, Long... serialIds) {
        List<DealerReturnRequestItemPayload> items = java.util.Arrays.stream(serialIds)
                .map(id -> new DealerReturnRequestItemPayload(id, ReturnRequestItemCondition.DEFECTIVE))
                .toList();
        return new CreateDealerReturnRequest(
                orderId,
                ReturnRequestType.DEFECTIVE_RETURN,
                ReturnRequestResolution.REPLACE,
                "DEFECT",
                "Product failed after installation",
                items,
                List.of(new DealerReturnRequestAttachmentPayload(
                        serialIds.length > 0 ? serialIds[0] : null,
                        "https://cdn.example.com/proof.jpg",
                        "proof.jpg",
                        ReturnRequestAttachmentCategory.PROOF
                ))
        );
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

    private Product createProduct(String sku, BigDecimal retailPrice) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Test product");
        product.setRetailPrice(retailPrice);
        product.setStock(100);
        product.setIsDeleted(false);
        product.setWarrantyPeriod(12);
        return product;
    }

    private Order createOrder(Dealer dealer, Product product, int quantity, String orderCode, OrderStatus status) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(status);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setIsDeleted(false);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setUnitPrice(product.getRetailPrice());

        Set<OrderItem> items = new LinkedHashSet<>();
        items.add(item);
        order.setOrderItems(items);
        return order;
    }

    private ProductSerial createDealerOwnedSerial(
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
