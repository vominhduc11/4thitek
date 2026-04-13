package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.admin.AdminCompleteReturnRequest;
import com.devwonder.backend.dto.admin.AdminRmaRequest;
import com.devwonder.backend.dto.admin.AdminInspectReturnItemRequest;
import com.devwonder.backend.dto.admin.AdminReceiveReturnRequest;
import com.devwonder.backend.dto.admin.AdminReviewReturnItemDecision;
import com.devwonder.backend.dto.admin.AdminReviewReturnRequest;
import com.devwonder.backend.dto.dealer.CreateDealerReturnRequest;
import com.devwonder.backend.dto.dealer.DealerReturnRequestAttachmentPayload;
import com.devwonder.backend.dto.dealer.DealerReturnRequestItemPayload;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.dto.returns.ReturnEligibilityResponse;
import com.devwonder.backend.dto.returns.ReturnRequestDetailResponse;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderAdjustment;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.OrderAdjustmentType;
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
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderAdjustmentRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.ReturnRequestRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.AdminRmaService;
import com.devwonder.backend.service.DealerPortalService;
import com.devwonder.backend.service.ReturnRequestService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
    private OrderAdjustmentRepository orderAdjustmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @Autowired
    private AdminRmaService adminRmaService;

    @Autowired
    private NotifyRepository notifyRepository;

    @BeforeEach
    void setUp() {
        returnRequestRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        notifyRepository.deleteAll();
        orderAdjustmentRepository.deleteAll();
        paymentRepository.deleteAll();
        warrantyRegistrationRepository.deleteAll();
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
    void inspectRejectsInvalidActionResolutionCombinations() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "invalid-combo",
                ProductSerialStatus.ASSIGNED,
                false
        );

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.PASS_QC,
                        "Invalid pass qc combination",
                        List.of("https://proof/invalid-pass.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        999L,
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PASS_QC supports RESTOCK only");

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Invalid scrap combination",
                        List.of("https://proof/invalid-scrap.jpg"),
                        ReturnRequestItemFinalResolution.RESTOCK,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("SCRAP action cannot use RESTOCK final resolution");
    }

    @Test
    void replaceResolutionRequiresSameDealerAndSameProductReplacementOrder() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "replace-validation",
                ProductSerialStatus.ASSIGNED,
                false
        );

        Dealer otherDealer = dealerRepository.save(createDealer("replace-other-dealer@example.com"));
        Order otherDealerOrder = orderRepository.save(createOrder(
                otherDealer,
                fixture.product(),
                1,
                "RET-REPLACE-WRONG-DEALER",
                OrderStatus.COMPLETED
        ));

        Product anotherProduct = productRepository.save(createProduct("SKU-RET-REPLACE-OTHER", BigDecimal.valueOf(211_000)));
        Order wrongProductOrder = orderRepository.save(createOrder(
                fixture.dealer(),
                anotherProduct,
                1,
                "RET-REPLACE-WRONG-PRODUCT",
                OrderStatus.COMPLETED
        ));

        Order validReplacementOrder = orderRepository.save(createOrder(
                fixture.dealer(),
                fixture.product(),
                1,
                "RET-REPLACE-VALID",
                OrderStatus.COMPLETED
        ));

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Wrong dealer replacement",
                        List.of("https://proof/replace-dealer.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        otherDealerOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("same dealer");

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Wrong product replacement",
                        List.of("https://proof/replace-product.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        wrongProductOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("same product");

        ReturnRequestDetailResponse replaced = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Valid replacement",
                        List.of("https://proof/replace-valid.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        validReplacementOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThat(replaced.items()).singleElement().satisfies(item -> {
            assertThat(item.itemStatus()).isEqualTo(ReturnRequestItemStatus.REPLACED);
            assertThat(item.finalResolution()).isEqualTo(ReturnRequestItemFinalResolution.REPLACE);
            assertThat(item.replacementOrderId()).isEqualTo(validReplacementOrder.getId());
        });

        ProductSerial reloaded = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(ProductSerialStatus.SCRAPPED);
        assertThat(reloaded.getDealer()).isNull();
        assertThat(reloaded.getOrder()).isNull();
    }

    @Test
    void creditNoteResolutionCreatesOrderAdjustmentAndLinksItem() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "credit-resolution",
                ProductSerialStatus.ASSIGNED,
                false
        );
        paymentRepository.save(createPayment(
                fixture.order(),
                BigDecimal.valueOf(300_000),
                "PAY-CREDIT-001"
        ));

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Credit customer",
                        List.of("https://proof/credit.jpg"),
                        ReturnRequestItemFinalResolution.CREDIT_NOTE,
                        null,
                        null,
                        BigDecimal.valueOf(30_000)
                ),
                "admin-qc"
        );

        Long adjustmentId = resolved.items().get(0).orderAdjustmentId();
        assertThat(adjustmentId).isNotNull();
        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.CREDITED);
        assertThat(resolved.items().get(0).creditAmount()).isEqualByComparingTo("30000");

        OrderAdjustment adjustment = orderAdjustmentRepository.findById(adjustmentId).orElseThrow();
        assertThat(adjustment.getType()).isEqualTo(OrderAdjustmentType.CREDIT_NOTE);
        assertThat(adjustment.getAmount()).isEqualByComparingTo("-30000");
        assertThat(adjustment.getOrder().getId()).isEqualTo(fixture.order().getId());

        Order reloadedOrder = orderRepository.findById(fixture.order().getId()).orElseThrow();
        assertThat(reloadedOrder.getPaidAmount()).isEqualByComparingTo("270000");
        assertThat(reloadedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void refundResolutionCreatesOrderAdjustmentAndUpdatesOrderPaymentState() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "refund-resolution",
                ProductSerialStatus.ASSIGNED,
                false
        );
        paymentRepository.save(createPayment(
                fixture.order(),
                BigDecimal.valueOf(200_000),
                "PAY-REFUND-001"
        ));

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Refund customer",
                        List.of("https://proof/refund.jpg"),
                        ReturnRequestItemFinalResolution.REFUND,
                        null,
                        BigDecimal.valueOf(120_000),
                        null
                ),
                "admin-qc"
        );

        Long adjustmentId = resolved.items().get(0).orderAdjustmentId();
        assertThat(adjustmentId).isNotNull();
        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.CREDITED);
        assertThat(resolved.items().get(0).refundAmount()).isEqualByComparingTo("120000");

        OrderAdjustment adjustment = orderAdjustmentRepository.findById(adjustmentId).orElseThrow();
        assertThat(adjustment.getType()).isEqualTo(OrderAdjustmentType.REFUND_RECORD);
        assertThat(adjustment.getAmount()).isEqualByComparingTo("-120000");
        assertThat(adjustment.getOrder().getId()).isEqualTo(fixture.order().getId());

        Order reloadedOrder = orderRepository.findById(fixture.order().getId()).orElseThrow();
        assertThat(reloadedOrder.getPaidAmount()).isEqualByComparingTo("80000");
        assertThat(reloadedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void scrapResolutionScrapsSerialAndVoidsWarranty() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "scrap-warranty",
                ProductSerialStatus.WARRANTY,
                true
        );

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Scrap damaged unit",
                        List.of("https://proof/scrap.jpg"),
                        ReturnRequestItemFinalResolution.SCRAP,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.SCRAPPED);
        assertThat(resolved.items().get(0).finalResolution()).isEqualTo(ReturnRequestItemFinalResolution.SCRAP);

        ProductSerial reloadedSerial = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(reloadedSerial.getStatus()).isEqualTo(ProductSerialStatus.SCRAPPED);
        assertThat(reloadedSerial.getDealer()).isNull();
        assertThat(reloadedSerial.getOrder()).isNull();

        WarrantyRegistration warranty = warrantyRegistrationRepository.findById(fixture.warrantyId()).orElseThrow();
        assertThat(warranty.getStatus()).isEqualTo(WarrantyStatus.VOID);
    }

    @Test
    void rejectedReturnRequestCannotBeCancelledByDealer() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-rejected-cancel@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-REJECT-CANCEL", BigDecimal.valueOf(181_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-REJECT-CANCEL", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-REJECT-CANCEL",
                ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), serial.getId())
        );
        ReturnRequestDetailResponse rejected = returnRequestService.reviewReturnRequest(
                created.id(),
                new AdminReviewReturnRequest(
                        List.of(new AdminReviewReturnItemDecision(created.items().get(0).id(), false, "Reject")),
                        true
                ),
                "admin-reviewer"
        );
        assertThat(rejected.status()).isEqualTo(ReturnRequestStatus.REJECTED);

        assertThatThrownBy(() -> returnRequestService.cancelDealerReturnRequest(
                dealer.getUsername(),
                rejected.id()
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already closed");
    }

    @Test
    void serialEligibilityReturnsActiveRequestIdWhenRequestCodeIsHumanReadable() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-eligibility-active@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-ELIGIBILITY", BigDecimal.valueOf(182_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-ELIGIBILITY", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-ELIGIBILITY",
                ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), serial.getId())
        );

        ReturnEligibilityResponse eligibility = returnRequestService.getSerialEligibility(
                dealer.getUsername(),
                serial.getId()
        );

        assertThat(eligibility.activeRequestId()).isEqualTo(created.id());
        assertThat(eligibility.activeRequestCode()).isEqualTo(created.requestCode());
        assertThat(eligibility.eligible()).isFalse();
        assertThat(eligibility.reasonCode()).isEqualTo("ACTIVE_RETURN_REQUEST_EXISTS");
    }

    @Test
    void createReturnAcceptsAttachmentProductSerialIdMapping() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-attachment-serial@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-ATTACH-SERIAL", BigDecimal.valueOf(183_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-ATTACH-SERIAL", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-ATTACH-SERIAL",
                ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequestWithAttachment(order.getId(), serial.getId(), null, serial.getId())
        );

        assertThat(created.attachments()).singleElement().satisfies(attachment ->
                assertThat(attachment.itemId()).isEqualTo(created.items().get(0).id()));
    }

    @Test
    void createReturnKeepsLegacyAttachmentItemIdAliasAsSerialId() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-attachment-legacy@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-ATTACH-LEGACY", BigDecimal.valueOf(184_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-ATTACH-LEGACY", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-ATTACH-LEGACY",
                ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequestWithAttachment(order.getId(), serial.getId(), serial.getId(), null)
        );

        assertThat(created.attachments()).singleElement().satisfies(attachment ->
                assertThat(attachment.itemId()).isEqualTo(created.items().get(0).id()));
    }

    @Test
    void standaloneAdminRmaActionIsBlockedForSerialWithActiveReturnRequest() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-rma-block@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-RMA-BLOCK", BigDecimal.valueOf(185_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-RMA-BLOCK", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-RMA-BLOCK",
                ProductSerialStatus.ASSIGNED
        ));

        returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), serial.getId())
        );

        assertThatThrownBy(() -> adminRmaService.applyRmaAction(
                serial.getId(),
                new AdminRmaRequest(
                        AdminRmaRequest.RmaAction.START_INSPECTION,
                        "Direct standalone RMA",
                        List.of("https://proof/direct-rma.jpg")
                ),
                "admin-rma"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("active return request");
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

    private WorkflowFixture prepareInspectingFixture(
            String uniqueSuffix,
            ProductSerialStatus initialStatus,
            boolean includeActiveWarranty
    ) {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-" + uniqueSuffix + "@example.com"));
        Product product = productRepository.save(createProduct(
                "SKU-RET-" + uniqueSuffix.toUpperCase(),
                BigDecimal.valueOf(200_000)
        ));
        Order order = orderRepository.save(createOrder(
                dealer,
                product,
                1,
                "RET-ORDER-" + uniqueSuffix.toUpperCase(),
                OrderStatus.COMPLETED
        ));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-" + uniqueSuffix.toUpperCase(),
                initialStatus
        ));

        Long warrantyId = null;
        if (includeActiveWarranty) {
            WarrantyRegistration warranty = warrantyRegistrationRepository.save(
                    createWarranty(serial, dealer, order, "WAR-" + uniqueSuffix.toUpperCase())
            );
            serial.setWarranty(warranty);
            serial = productSerialRepository.save(serial);
            warrantyId = warranty.getId();
        }

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(order.getId(), serial.getId())
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
                        AdminRmaRequest.RmaAction.START_INSPECTION,
                        "Start inspection",
                        List.of("https://proof/start-" + uniqueSuffix + ".jpg"),
                        null,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );
        Long itemId = inspecting.items().get(0).id();
        return new WorkflowFixture(
                dealer,
                product,
                order,
                serial,
                inspecting.id(),
                itemId,
                warrantyId
        );
    }

    private CreateDealerReturnRequest createRequest(Long orderId, Long... serialIds) {
        return createRequestWithAttachment(
                orderId,
                serialIds.length > 0 ? serialIds[0] : null,
                serialIds.length > 0 ? serialIds[0] : null,
                null,
                serialIds
        );
    }

    private CreateDealerReturnRequest createRequestWithAttachment(
            Long orderId,
            Long defaultSerialId,
            Long attachmentItemId,
            Long attachmentProductSerialId,
            Long... serialIds
    ) {
        Long[] effectiveSerialIds = serialIds == null || serialIds.length == 0
                ? new Long[]{defaultSerialId}
                : serialIds;
        List<DealerReturnRequestItemPayload> items = java.util.Arrays.stream(effectiveSerialIds)
                .filter(java.util.Objects::nonNull)
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
                        attachmentItemId,
                        attachmentProductSerialId,
                        "https://cdn.example.com/proof.jpg",
                        "proof.jpg",
                        ReturnRequestAttachmentCategory.PROOF
                ))
        );
    }

    private Payment createPayment(Order order, BigDecimal amount, String transactionCode) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount);
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PAID);
        payment.setChannel("Test payment");
        payment.setTransactionCode(transactionCode);
        payment.setPaidAt(Instant.now());
        payment.setReviewed(true);
        return payment;
    }

    private WarrantyRegistration createWarranty(ProductSerial serial, Dealer dealer, Order order, String warrantyCode) {
        WarrantyRegistration warranty = new WarrantyRegistration();
        warranty.setProductSerial(serial);
        warranty.setDealer(dealer);
        warranty.setOrder(order);
        warranty.setWarrantyCode(warrantyCode);
        warranty.setCustomerName("Warranty Customer");
        warranty.setCustomerEmail("warranty@example.com");
        warranty.setCustomerPhone("0900000000");
        warranty.setCustomerAddress("Warranty Street");
        warranty.setPurchaseDate(LocalDate.now().minusDays(1));
        warranty.setWarrantyStart(Instant.now().minusSeconds(86_400));
        warranty.setWarrantyEnd(Instant.now().plusSeconds(86_400 * 365));
        warranty.setStatus(WarrantyStatus.ACTIVE);
        return warranty;
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

    private record WorkflowFixture(
            Dealer dealer,
            Product product,
            Order order,
            ProductSerial serial,
            Long requestId,
            Long itemId,
            Long warrantyId
    ) {
    }
}
