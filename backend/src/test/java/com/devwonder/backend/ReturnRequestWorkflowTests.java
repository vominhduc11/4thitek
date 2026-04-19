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
import com.devwonder.backend.entity.MediaAsset;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderAdjustment;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.SupportTicketMessage;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.MediaCategory;
import com.devwonder.backend.entity.enums.MediaLinkedEntityType;
import com.devwonder.backend.entity.enums.MediaStatus;
import com.devwonder.backend.entity.enums.MediaType;
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
import com.devwonder.backend.entity.enums.StorageProvider;
import com.devwonder.backend.entity.enums.SupportTicketMessageAuthorRole;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.MediaAssetRepository;
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
import com.devwonder.backend.service.FileStorageService;
import com.devwonder.backend.service.ReturnRequestService;
import java.io.ByteArrayInputStream;
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

    @Autowired
    private MediaAssetRepository mediaAssetRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        returnRequestRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        mediaAssetRepository.deleteAll();
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
        var supportTicket = dealerSupportTicketRepository.findById(created.supportTicketId()).orElseThrow();
        assertThat(supportTicket.getCategory()).isEqualTo(DealerSupportCategory.RETURN);
        assertThat(supportTicket.getContextData()).contains("\"returnRequestId\":" + created.id());
        assertThat(supportTicket.getContextData()).contains("\"returnRequestCode\":\"" + created.requestCode() + "\"");
        assertThat(supportTicket.getContextData()).contains("\"returnStatus\":\"SUBMITTED\"");
        assertThat(supportTicket.getContextData()).contains("\"orderId\":" + order.getId());
        assertThat(supportTicket.getContextData()).contains("\"orderCode\":\"" + order.getOrderCode() + "\"");
    }

    @Test
    void dealerCanSubmitReturnRequestWithAttachedMediaAssetId() throws Exception {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-media@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-MEDIA", BigDecimal.valueOf(101_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-MEDIA", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-MEDIA",
                ProductSerialStatus.ASSIGNED
        ));
        MediaAsset mediaAsset = createDealerReturnMediaAsset(dealer, "proof.pdf");

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                new CreateDealerReturnRequest(
                        order.getId(),
                        ReturnRequestType.DEFECTIVE_RETURN,
                        ReturnRequestResolution.REPLACE,
                        "DAMAGED",
                        "Attachment with media asset id",
                        List.of(new DealerReturnRequestItemPayload(
                                serial.getId(),
                                ReturnRequestItemCondition.DEFECTIVE
                        )),
                        List.of(new DealerReturnRequestAttachmentPayload(
                                serial.getId(),
                                serial.getId(),
                                mediaAsset.getId(),
                                "https://cdn.example.com/proof.pdf",
                                "proof.pdf",
                                ReturnRequestAttachmentCategory.PROOF
                        ))
                )
        );

        assertThat(created.attachments()).hasSize(1);
        assertThat(created.attachments().get(0).mediaAssetId()).isEqualTo(mediaAsset.getId());
        MediaAsset linkedAsset = mediaAssetRepository.findById(mediaAsset.getId()).orElseThrow();
        assertThat(linkedAsset.getStatus()).isEqualTo(MediaStatus.ACTIVE);
        assertThat(linkedAsset.getLinkedEntityType()).isEqualTo(MediaLinkedEntityType.RETURN_REQUEST);
        assertThat(linkedAsset.getLinkedEntityId()).isEqualTo(created.id());
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
    void warrantyRmaFailsWhenSerialHasNoWarrantyRegistration() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-warranty-missing@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-WAR-MISSING", BigDecimal.valueOf(142_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-WAR-MISSING", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-WAR-MISSING",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.INSPECT_ONLY,
                        serial.getId()
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("requires an active warranty registration");
    }

    @Test
    void warrantyRmaFailsWhenWarrantyStatusIsNotActive() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-warranty-inactive@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-WAR-INACTIVE", BigDecimal.valueOf(143_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-WAR-INACTIVE", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-WAR-INACTIVE",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration warranty = warrantyRegistrationRepository.save(createWarranty(
                serial,
                dealer,
                order,
                "WAR-INACTIVE",
                WarrantyStatus.VOID,
                Instant.now().plusSeconds(86_400)
        ));
        serial.setWarranty(warranty);
        productSerialRepository.save(serial);

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.INSPECT_ONLY,
                        serial.getId()
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("warranty status must be ACTIVE");
    }

    @Test
    void warrantyRmaFailsWhenWarrantyExpired() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-warranty-expired@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-WAR-EXPIRED", BigDecimal.valueOf(144_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-WAR-EXPIRED", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-WAR-EXPIRED",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration warranty = warrantyRegistrationRepository.save(createWarranty(
                serial,
                dealer,
                order,
                "WAR-EXPIRED",
                WarrantyStatus.ACTIVE,
                Instant.now().minusSeconds(60)
        ));
        serial.setWarranty(warranty);
        productSerialRepository.save(serial);

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.INSPECT_ONLY,
                        serial.getId()
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("warranty has expired");
    }

    @Test
    void warrantyRmaFailsWhenWarrantyDealerMismatch() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-warranty-owner@example.com"));
        Dealer otherDealer = dealerRepository.save(createDealer("dealer-return-warranty-other@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-WAR-MISMATCH", BigDecimal.valueOf(145_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-WAR-MISMATCH", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-WAR-MISMATCH",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration warranty = warrantyRegistrationRepository.save(createWarranty(
                serial,
                otherDealer,
                order,
                "WAR-MISMATCH",
                WarrantyStatus.ACTIVE,
                Instant.now().plusSeconds(86_400)
        ));
        serial.setWarranty(warranty);
        productSerialRepository.save(serial);

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.REPLACE,
                        serial.getId()
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("warranty registration belongs to a different dealer");
    }

    @Test
    void warrantyRmaFailsWhenRequestedResolutionIsCreditOrRefund() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-warranty-resolution@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-WAR-RES", BigDecimal.valueOf(146_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-WAR-RES", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-WAR-RES",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration warranty = warrantyRegistrationRepository.save(createWarranty(serial, dealer, order, "WAR-RES"));
        serial.setWarranty(warranty);
        productSerialRepository.save(serial);

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.CREDIT_NOTE,
                        serial.getId()
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("WARRANTY_RMA only supports INSPECT_ONLY or REPLACE");

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.REFUND,
                        serial.getId()
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("WARRANTY_RMA only supports INSPECT_ONLY or REPLACE");
    }

    @Test
    void warrantyRmaSucceedsWithEligibleActiveWarrantyAndAllowedRequestedResolution() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-warranty-success@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-WAR-SUCCESS", BigDecimal.valueOf(147_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 2, "RET-ORDER-WAR-SUCCESS", OrderStatus.COMPLETED));

        ProductSerial first = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-WAR-SUCCESS-1",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration firstWarranty = warrantyRegistrationRepository.save(createWarranty(first, dealer, order, "WAR-SUCCESS-1"));
        first.setWarranty(firstWarranty);
        productSerialRepository.save(first);

        ProductSerial second = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-WAR-SUCCESS-2",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration secondWarranty = warrantyRegistrationRepository.save(createWarranty(second, dealer, order, "WAR-SUCCESS-2"));
        second.setWarranty(secondWarranty);
        productSerialRepository.save(second);

        ReturnRequestDetailResponse inspectOnly = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.INSPECT_ONLY,
                        first.getId()
                )
        );
        assertThat(inspectOnly.type()).isEqualTo(ReturnRequestType.WARRANTY_RMA);
        assertThat(inspectOnly.requestedResolution()).isEqualTo(ReturnRequestResolution.INSPECT_ONLY);

        ReturnRequestDetailResponse replace = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.WARRANTY_RMA,
                        ReturnRequestResolution.REPLACE,
                        second.getId()
                )
        );
        assertThat(replace.type()).isEqualTo(ReturnRequestType.WARRANTY_RMA);
        assertThat(replace.requestedResolution()).isEqualTo(ReturnRequestResolution.REPLACE);
    }

    @Test
    void defectiveReturnSucceedsForAssignedOrDefectiveSerials() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-defective-ok@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-DEF-OK", BigDecimal.valueOf(148_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 2, "RET-ORDER-DEF-OK", OrderStatus.COMPLETED));
        ProductSerial assignedSerial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-DEF-OK-1",
                ProductSerialStatus.ASSIGNED
        ));
        ProductSerial defectiveSerial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-DEF-OK-2",
                ProductSerialStatus.DEFECTIVE
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.DEFECTIVE_RETURN,
                        ReturnRequestResolution.REPLACE,
                        assignedSerial.getId(),
                        defectiveSerial.getId()
                )
        );

        assertThat(created.type()).isEqualTo(ReturnRequestType.DEFECTIVE_RETURN);
        assertThat(created.items()).hasSize(2);
    }

    @Test
    void commercialReturnUsesB2bRulesLikeDefectiveReturn() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-commercial-ok@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-COMM-OK", BigDecimal.valueOf(148_500)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-COMM-OK", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-COMM-OK",
                ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.COMMERCIAL_RETURN,
                        ReturnRequestResolution.CREDIT_NOTE,
                        serial.getId()
                )
        );

        assertThat(created.type()).isEqualTo(ReturnRequestType.COMMERCIAL_RETURN);
        assertThat(created.requestedResolution()).isEqualTo(ReturnRequestResolution.CREDIT_NOTE);
    }

    @Test
    void defectiveReturnFailsForWarrantySerialWithActiveWarranty() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-defective-warranty@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-DEF-WAR", BigDecimal.valueOf(149_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-DEF-WAR", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "RET-SERIAL-DEF-WAR",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration warranty = warrantyRegistrationRepository.save(createWarranty(serial, dealer, order, "WAR-DEF-WAR"));
        serial.setWarranty(warranty);
        productSerialRepository.save(serial);

        assertThatThrownBy(() -> returnRequestService.createDealerReturnRequest(
                dealer.getUsername(),
                createRequest(
                        order.getId(),
                        ReturnRequestType.DEFECTIVE_RETURN,
                        ReturnRequestResolution.REPLACE,
                        serial.getId()
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("has active warranty; submit WARRANTY_RMA instead");
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
        ProductSerial replacementSerial = productSerialRepository.save(createDealerOwnedSerial(
                fixture.dealer(),
                validReplacementOrder,
                fixture.product(),
                "RET-REPLACE-VALID-SERIAL",
                ProductSerialStatus.ASSIGNED
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
            assertThat(item.replacementSerialId()).isEqualTo(replacementSerial.getId());
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

        assertThat(resolved.type()).isEqualTo(ReturnRequestType.DEFECTIVE_RETURN);
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

        assertThat(resolved.type()).isEqualTo(ReturnRequestType.DEFECTIVE_RETURN);
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
    void warrantyRepairLeavesWarrantyActiveAndSerialInWarranty() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "repair-warranty",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.PASS_QC,
                        "Repair approved",
                        List.of("https://proof/repair.jpg"),
                        ReturnRequestItemFinalResolution.REPAIR,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.REPAIRED);
        assertThat(resolved.items().get(0).finalResolution()).isEqualTo(ReturnRequestItemFinalResolution.REPAIR);

        ProductSerial reloadedSerial = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(reloadedSerial.getStatus()).isEqualTo(ProductSerialStatus.WARRANTY);
        assertThat(reloadedSerial.getDealer().getId()).isEqualTo(fixture.dealer().getId());
        assertThat(reloadedSerial.getOrder().getId()).isEqualTo(fixture.order().getId());

        WarrantyRegistration warranty = warrantyRegistrationRepository.findById(fixture.warrantyId()).orElseThrow();
        assertThat(warranty.getStatus()).isEqualTo(WarrantyStatus.ACTIVE);
    }

    @Test
    void warrantyReturnToCustomerLeavesWarrantyActive() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "return-customer-warranty",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.PASS_QC,
                        "Return to customer approved",
                        List.of("https://proof/return-customer.jpg"),
                        ReturnRequestItemFinalResolution.RETURN_TO_CUSTOMER,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.RETURNED_TO_CUSTOMER);
        assertThat(resolved.items().get(0).finalResolution())
                .isEqualTo(ReturnRequestItemFinalResolution.RETURN_TO_CUSTOMER);

        ProductSerial reloadedSerial = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(reloadedSerial.getStatus()).isEqualTo(ProductSerialStatus.WARRANTY);

        WarrantyRegistration warranty = warrantyRegistrationRepository.findById(fixture.warrantyId()).orElseThrow();
        assertThat(warranty.getStatus()).isEqualTo(WarrantyStatus.ACTIVE);
    }

    @Test
    void warrantyRejectWarrantyKeepsWarrantyActive() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "reject-warranty",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Reject warranty claim",
                        List.of("https://proof/reject-warranty.jpg"),
                        ReturnRequestItemFinalResolution.REJECT_WARRANTY,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.WARRANTY_REJECTED);
        assertThat(resolved.items().get(0).finalResolution())
                .isEqualTo(ReturnRequestItemFinalResolution.REJECT_WARRANTY);

        ProductSerial reloadedSerial = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(reloadedSerial.getStatus()).isEqualTo(ProductSerialStatus.WARRANTY);

        WarrantyRegistration warranty = warrantyRegistrationRepository.findById(fixture.warrantyId()).orElseThrow();
        assertThat(warranty.getStatus()).isEqualTo(WarrantyStatus.ACTIVE);
    }

    @Test
    void warrantyReplaceTransfersWarrantyToReplacementSerialAndSetsTrace() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "replace-warranty",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        Order replacementOrder = orderRepository.save(createOrder(
                fixture.dealer(),
                fixture.product(),
                1,
                "RET-WAR-REPLACE-ORDER",
                OrderStatus.COMPLETED
        ));
        ProductSerial replacementSerial = productSerialRepository.save(createDealerOwnedSerial(
                fixture.dealer(),
                replacementOrder,
                fixture.product(),
                "RET-WAR-REPLACE-SERIAL",
                ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Replace warranty unit",
                        List.of("https://proof/warranty-replace.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        replacementOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        );

        assertThat(resolved.items().get(0).itemStatus()).isEqualTo(ReturnRequestItemStatus.REPLACED);
        assertThat(resolved.items().get(0).finalResolution()).isEqualTo(ReturnRequestItemFinalResolution.REPLACE);
        assertThat(resolved.items().get(0).replacementOrderId()).isEqualTo(replacementOrder.getId());
        assertThat(resolved.items().get(0).replacementSerialId()).isEqualTo(replacementSerial.getId());

        ProductSerial oldSerial = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(oldSerial.getStatus()).isEqualTo(ProductSerialStatus.WARRANTY_REPLACED);

        ProductSerial reloadedReplacementSerial = productSerialRepository.findById(replacementSerial.getId()).orElseThrow();
        assertThat(reloadedReplacementSerial.getStatus()).isEqualTo(ProductSerialStatus.WARRANTY);
        assertThat(reloadedReplacementSerial.getWarranty()).isNotNull();

        WarrantyRegistration oldWarranty = warrantyRegistrationRepository.findById(fixture.warrantyId()).orElseThrow();
        assertThat(oldWarranty.getStatus()).isEqualTo(WarrantyStatus.VOID);
        WarrantyRegistration replacementWarranty = warrantyRegistrationRepository
                .findByProductSerialId(replacementSerial.getId())
                .orElseThrow();
        assertThat(replacementWarranty.getStatus()).isEqualTo(WarrantyStatus.ACTIVE);
    }

    @Test
    void warrantyRmaFinalResolutionCannotBeCreditOrRefund() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "warranty-final-resolution",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Try credit note for warranty",
                        List.of("https://proof/warranty-credit.jpg"),
                        ReturnRequestItemFinalResolution.CREDIT_NOTE,
                        null,
                        null,
                        BigDecimal.valueOf(100_000)
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("WARRANTY_RMA SCRAP supports REPLACE or REJECT_WARRANTY only");

        ProductSerial serialAfterCreditAttempt = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(serialAfterCreditAttempt.getStatus()).isEqualTo(ProductSerialStatus.INSPECTING);
        WarrantyRegistration warrantyAfterCreditAttempt = warrantyRegistrationRepository.findById(fixture.warrantyId()).orElseThrow();
        assertThat(warrantyAfterCreditAttempt.getStatus()).isEqualTo(WarrantyStatus.ACTIVE);

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Try refund for warranty",
                        List.of("https://proof/warranty-refund.jpg"),
                        ReturnRequestItemFinalResolution.REFUND,
                        null,
                        BigDecimal.valueOf(100_000),
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("WARRANTY_RMA SCRAP supports REPLACE or REJECT_WARRANTY only");

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Try restock for warranty",
                        List.of("https://proof/warranty-restock.jpg"),
                        ReturnRequestItemFinalResolution.RESTOCK,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("WARRANTY_RMA SCRAP supports REPLACE or REJECT_WARRANTY only");

        ProductSerial serialAfterRefundAttempt = productSerialRepository.findById(fixture.serial().getId()).orElseThrow();
        assertThat(serialAfterRefundAttempt.getStatus()).isEqualTo(ProductSerialStatus.INSPECTING);
        WarrantyRegistration warrantyAfterRefundAttempt = warrantyRegistrationRepository.findById(fixture.warrantyId()).orElseThrow();
        assertThat(warrantyAfterRefundAttempt.getStatus()).isEqualTo(WarrantyStatus.ACTIVE);

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Try scrap for warranty",
                        List.of("https://proof/warranty-scrap.jpg"),
                        ReturnRequestItemFinalResolution.SCRAP,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("REPLACE or REJECT_WARRANTY only");
    }

    @Test
    void defectiveReturnRejectsInvalidFinalResolutionsBeforeSideEffects() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "defective-invalid-final",
                ProductSerialStatus.ASSIGNED,
                false
        );

        assertUnsupportedFinalResolutionRejected(fixture, ReturnRequestItemFinalResolution.REPAIR);
        assertUnsupportedFinalResolutionRejected(fixture, ReturnRequestItemFinalResolution.RETURN_TO_CUSTOMER);
        assertUnsupportedFinalResolutionRejected(fixture, ReturnRequestItemFinalResolution.REJECT_WARRANTY);
    }

    @Test
    void commercialReturnRejectsInvalidFinalResolutionBeforeSideEffects() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "commercial-invalid-final",
                ProductSerialStatus.ASSIGNED,
                false,
                ReturnRequestType.COMMERCIAL_RETURN,
                ReturnRequestResolution.REPLACE
        );

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Commercial invalid final resolution",
                        List.of("https://proof/commercial-invalid.jpg"),
                        ReturnRequestItemFinalResolution.REJECT_WARRANTY,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("only allow");

        assertInspectItemStillPending(fixture.requestId(), fixture.serial().getId());
    }

    @Test
    void warrantyReplaceRejectsReplacementSerialWithActiveWarranty() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "replace-active-warranty",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        Order replacementOrder = orderRepository.save(createOrder(
                fixture.dealer(),
                fixture.product(),
                1,
                "RET-WAR-REPLACE-ACTIVE-ORDER",
                OrderStatus.COMPLETED
        ));
        ProductSerial replacementSerial = productSerialRepository.save(createDealerOwnedSerial(
                fixture.dealer(),
                replacementOrder,
                fixture.product(),
                "RET-WAR-REPLACE-ACTIVE-SERIAL",
                ProductSerialStatus.ASSIGNED
        ));
        WarrantyRegistration replacementWarranty = warrantyRegistrationRepository.save(
                createWarranty(replacementSerial, fixture.dealer(), replacementOrder, "WAR-REPLACE-ACTIVE")
        );
        replacementSerial.setWarranty(replacementWarranty);
        productSerialRepository.save(replacementSerial);

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Replace with active warranty serial",
                        List.of("https://proof/replace-active-warranty.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        replacementOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("active warranty");

        assertInspectItemStillPending(fixture.requestId(), fixture.serial().getId());
        assertThat(productSerialRepository.findById(replacementSerial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.ASSIGNED);
        assertThat(warrantyRegistrationRepository.findByProductSerialId(replacementSerial.getId()))
                .isPresent();
    }

    @Test
    void warrantyReplaceRejectsReplacementSerialWithInvalidStatus() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "replace-invalid-status",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        Order replacementOrder = orderRepository.save(createOrder(
                fixture.dealer(),
                fixture.product(),
                1,
                "RET-WAR-REPLACE-INVALID-ORDER",
                OrderStatus.COMPLETED
        ));
        ProductSerial replacementSerial = productSerialRepository.save(createDealerOwnedSerial(
                fixture.dealer(),
                replacementOrder,
                fixture.product(),
                "RET-WAR-REPLACE-INVALID-SERIAL",
                ProductSerialStatus.AVAILABLE
        ));

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Replace with invalid status serial",
                        List.of("https://proof/replace-invalid-status.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        replacementOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ASSIGNED status");

        assertInspectItemStillPending(fixture.requestId(), fixture.serial().getId());
        assertThat(productSerialRepository.findById(replacementSerial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.AVAILABLE);
    }

    @Test
    void warrantyReplaceRejectsWhenReplacementOrderHasMultipleEligibleSerials() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "replace-multiple-eligible",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        Order replacementOrder = orderRepository.save(createOrder(
                fixture.dealer(),
                fixture.product(),
                2,
                "RET-WAR-REPLACE-MULTIPLE-ORDER",
                OrderStatus.COMPLETED
        ));
        productSerialRepository.save(createDealerOwnedSerial(
                fixture.dealer(),
                replacementOrder,
                fixture.product(),
                "RET-WAR-REPLACE-MULTIPLE-SERIAL-1",
                ProductSerialStatus.ASSIGNED
        ));
        productSerialRepository.save(createDealerOwnedSerial(
                fixture.dealer(),
                replacementOrder,
                fixture.product(),
                "RET-WAR-REPLACE-MULTIPLE-SERIAL-2",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Replace with ambiguous serials",
                        List.of("https://proof/replace-multiple.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        replacementOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("multiple eligible serials");

        assertInspectItemStillPending(fixture.requestId(), fixture.serial().getId());
    }

    @Test
    void warrantyReplaceRejectsWhenReplacementSerialHasActiveReturnRequest() {
        WorkflowFixture fixture = prepareInspectingFixture(
                "replace-active-return",
                ProductSerialStatus.WARRANTY,
                true,
                ReturnRequestType.WARRANTY_RMA,
                ReturnRequestResolution.REPLACE
        );

        Order replacementOrder = orderRepository.save(createOrder(
                fixture.dealer(),
                fixture.product(),
                1,
                "RET-WAR-REPLACE-ACTIVE-REQ-ORDER",
                OrderStatus.COMPLETED
        ));
        ProductSerial replacementSerial = productSerialRepository.save(createDealerOwnedSerial(
                fixture.dealer(),
                replacementOrder,
                fixture.product(),
                "RET-WAR-REPLACE-ACTIVE-REQ-SERIAL",
                ProductSerialStatus.ASSIGNED
        ));
        returnRequestService.createDealerReturnRequest(
                fixture.dealer().getUsername(),
                createRequest(replacementOrder.getId(), replacementSerial.getId())
        );

        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Replace with serial already in active request",
                        List.of("https://proof/replace-active-request.jpg"),
                        ReturnRequestItemFinalResolution.REPLACE,
                        replacementOrder.getId(),
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("active return request");

        assertInspectItemStillPending(fixture.requestId(), fixture.serial().getId());
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
                createRequestWithAttachment(
                        order.getId(),
                        serial.getId(),
                        null,
                        ReturnRequestType.DEFECTIVE_RETURN,
                        ReturnRequestResolution.REPLACE,
                        serial.getId()
                )
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
                createRequestWithAttachment(
                        order.getId(),
                        serial.getId(),
                        serial.getId(),
                        ReturnRequestType.DEFECTIVE_RETURN,
                        ReturnRequestResolution.REPLACE,
                        null
                )
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
    void milestoneStatusChangesUpdateLinkedSupportContextAndThread() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-return-support-milestone@example.com"));
        Product product = productRepository.save(createProduct("SKU-RET-MILESTONE", BigDecimal.valueOf(191_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "RET-ORDER-MILESTONE", OrderStatus.COMPLETED));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer, order, product, "RET-SERIAL-MILESTONE", ProductSerialStatus.ASSIGNED
        ));

        ReturnRequestDetailResponse created = returnRequestService.createDealerReturnRequest(
                dealer.getUsername(), createRequest(order.getId(), serial.getId())
        );
        Long supportTicketId = created.supportTicketId();
        assertThat(supportTicketId).isNotNull();

        ReturnRequestDetailResponse reviewed = returnRequestService.reviewReturnRequest(
                created.id(),
                new AdminReviewReturnRequest(
                        List.of(new AdminReviewReturnItemDecision(created.items().get(0).id(), true, "approve")),
                        false
                ),
                "admin-review"
        );
        ReturnRequestDetailResponse received = returnRequestService.receiveReturnRequest(
                reviewed.id(),
                new AdminReceiveReturnRequest(List.of(reviewed.items().get(0).id()), "received"),
                "admin-receive"
        );
        ReturnRequestDetailResponse inspecting = returnRequestService.inspectReturnItem(
                received.id(),
                received.items().get(0).id(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.START_INSPECTION,
                        "inspect",
                        List.of("https://proof/inspect.jpg"),
                        null,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );
        ReturnRequestDetailResponse resolved = returnRequestService.inspectReturnItem(
                inspecting.id(),
                inspecting.items().get(0).id(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.PASS_QC,
                        "pass",
                        List.of("https://proof/pass.jpg"),
                        ReturnRequestItemFinalResolution.RESTOCK,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        );
        ReturnRequestDetailResponse completed = returnRequestService.completeReturnRequest(
                resolved.id(),
                new AdminCompleteReturnRequest("complete"),
                "admin-complete"
        );

        var supportTicket = dealerSupportTicketRepository.findById(supportTicketId).orElseThrow();
        assertThat(completed.status()).isEqualTo(ReturnRequestStatus.COMPLETED);
        assertThat(supportTicket.getStatus()).isEqualTo(DealerSupportTicketStatus.OPEN);
        assertThat(supportTicket.getContextData()).contains("\"returnStatus\":\"COMPLETED\"");

        List<SupportTicketMessage> systemMessages = supportTicket.getMessages().stream()
                .filter(message -> message.getAuthorRole() == SupportTicketMessageAuthorRole.SYSTEM)
                .filter(message -> !Boolean.TRUE.equals(message.getInternalNote()))
                .toList();
        assertThat(systemMessages).anyMatch(message -> message.getMessage().contains("APPROVED"));
        assertThat(systemMessages).anyMatch(message -> message.getMessage().contains("RECEIVED"));
        assertThat(systemMessages).anyMatch(message -> message.getMessage().contains("INSPECTING"));
        assertThat(systemMessages).anyMatch(message -> message.getMessage().contains("COMPLETED"));
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

    private void assertUnsupportedFinalResolutionRejected(
            WorkflowFixture fixture,
            ReturnRequestItemFinalResolution invalidResolution
    ) {
        assertThatThrownBy(() -> returnRequestService.inspectReturnItem(
                fixture.requestId(),
                fixture.itemId(),
                new AdminInspectReturnItemRequest(
                        AdminRmaRequest.RmaAction.SCRAP,
                        "Invalid final resolution",
                        List.of("https://proof/invalid-final-resolution.jpg"),
                        invalidResolution,
                        null,
                        null,
                        null
                ),
                "admin-qc"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("only allow");
        assertInspectItemStillPending(fixture.requestId(), fixture.serial().getId());
    }

    private void assertInspectItemStillPending(Long requestId, Long serialId) {
        ReturnRequestDetailResponse detail = returnRequestService.getAdminReturnDetail(requestId);
        assertThat(detail.items()).singleElement().satisfies(item -> {
            assertThat(item.itemStatus()).isEqualTo(ReturnRequestItemStatus.INSPECTING);
            assertThat(item.finalResolution()).isNull();
            assertThat(item.replacementOrderId()).isNull();
            assertThat(item.replacementSerialId()).isNull();
        });
        assertThat(productSerialRepository.findById(serialId).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.INSPECTING);
    }

    private WorkflowFixture prepareInspectingFixture(
            String uniqueSuffix,
            ProductSerialStatus initialStatus,
            boolean includeActiveWarranty
    ) {
        return prepareInspectingFixture(
                uniqueSuffix,
                initialStatus,
                includeActiveWarranty,
                ReturnRequestType.DEFECTIVE_RETURN,
                ReturnRequestResolution.REPLACE
        );
    }

    private WorkflowFixture prepareInspectingFixture(
            String uniqueSuffix,
            ProductSerialStatus initialStatus,
            boolean includeActiveWarranty,
            ReturnRequestType requestType,
            ReturnRequestResolution requestedResolution
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
                createRequest(order.getId(), requestType, requestedResolution, serial.getId())
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
        return createRequest(
                orderId,
                ReturnRequestType.DEFECTIVE_RETURN,
                ReturnRequestResolution.REPLACE,
                serialIds
        );
    }

    private CreateDealerReturnRequest createRequest(
            Long orderId,
            ReturnRequestType type,
            ReturnRequestResolution requestedResolution,
            Long... serialIds
    ) {
        return createRequestWithAttachment(
                orderId,
                serialIds.length > 0 ? serialIds[0] : null,
                serialIds.length > 0 ? serialIds[0] : null,
                type,
                requestedResolution,
                null,
                serialIds
        );
    }

    private CreateDealerReturnRequest createRequestWithAttachment(
            Long orderId,
            Long defaultSerialId,
            Long attachmentItemId,
            ReturnRequestType type,
            ReturnRequestResolution requestedResolution,
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
                type,
                requestedResolution,
                "DEFECT",
                "Product failed after installation",
                items,
                List.of(new DealerReturnRequestAttachmentPayload(
                        attachmentItemId,
                        attachmentProductSerialId,
                        null,
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
        return createWarranty(
                serial,
                dealer,
                order,
                warrantyCode,
                WarrantyStatus.ACTIVE,
                Instant.now().plusSeconds(86_400 * 365)
        );
    }

    private WarrantyRegistration createWarranty(
            ProductSerial serial,
            Dealer dealer,
            Order order,
            String warrantyCode,
            WarrantyStatus status,
            Instant warrantyEnd
    ) {
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
        warranty.setWarrantyEnd(warrantyEnd);
        warranty.setStatus(status);
        return warranty;
    }

    private MediaAsset createDealerReturnMediaAsset(Dealer dealer, String fileName) throws Exception {
        byte[] bytes = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
                .getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String objectKey = fileStorageService.createRandomObjectKey(
                "support/evidence/dealers/" + dealer.getId(),
                "pdf"
        );
        fileStorageService.write(objectKey, new ByteArrayInputStream(bytes), bytes.length, "application/pdf");

        MediaAsset mediaAsset = new MediaAsset();
        mediaAsset.setObjectKey(objectKey);
        mediaAsset.setOriginalFileName(fileName);
        mediaAsset.setStoredFileName(fileName);
        mediaAsset.setContentType("application/pdf");
        mediaAsset.setMediaType(MediaType.DOCUMENT);
        mediaAsset.setCategory(MediaCategory.SUPPORT_TICKET);
        mediaAsset.setSizeBytes((long) bytes.length);
        mediaAsset.setStorageProvider(StorageProvider.LOCAL);
        mediaAsset.setOwnerAccount(dealer);
        mediaAsset.setUploadedByAccount(dealer);
        mediaAsset.setStatus(MediaStatus.PENDING);
        mediaAsset.setFinalizedAt(Instant.now());
        return mediaAssetRepository.save(mediaAsset);
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
