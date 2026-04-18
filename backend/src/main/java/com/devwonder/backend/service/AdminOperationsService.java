package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminNotificationDispatchResponse;
import com.devwonder.backend.dto.admin.AdminNotificationResponse;
import com.devwonder.backend.dto.admin.AdminSerialImportRequest;
import com.devwonder.backend.dto.admin.AdminSerialResponse;
import com.devwonder.backend.dto.admin.AdminSupportTicketResponse;
import com.devwonder.backend.dto.admin.AdminWarrantyResponse;
import com.devwonder.backend.dto.admin.CreateAdminSupportTicketMessageRequest;
import com.devwonder.backend.dto.admin.CreateAdminNotificationRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSerialStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSupportTicketRequest;
import com.devwonder.backend.dto.admin.UpdateAdminWarrantyStatusRequest;
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.dto.serial.SerialImportSkippedItem;
import com.devwonder.backend.dto.serial.SerialImportSummaryResponse;
import com.devwonder.backend.dto.support.SupportTicketMessageResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.DealerSupportTicket;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.SupportTicketMessage;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.MediaType;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.SupportTicketMessageAuthorRole;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.support.AccountValidationSupport;
import com.devwonder.backend.service.support.AppMessageSupport;
import com.devwonder.backend.service.support.ProductStockSyncSupport;
import com.devwonder.backend.service.support.SupportTicketPayloadSupport;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import com.devwonder.backend.service.support.WarrantyStatusSupport;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class AdminOperationsService {

    private static final Logger log = LoggerFactory.getLogger(AdminOperationsService.class);

    private final DealerSupportTicketRepository dealerSupportTicketRepository;
    private final AdminRepository adminRepository;
    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final ProductSerialRepository productSerialRepository;
    private final ProductRepository productRepository;
    private final DealerRepository dealerRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final NotifyRepository notifyRepository;
    private final AccountRepository accountRepository;
    private final MailService mailService;
    private final AsyncMailService asyncMailService;
    private final AppMessageSupport appMessageSupport;
    private final ProductStockSyncSupport productStockSyncSupport;
    private final SupportTicketPayloadSupport supportTicketPayloadSupport;
    private final MediaAssetService mediaAssetService;

    @Transactional(readOnly = true)
    public Page<AdminSupportTicketResponse> getSupportTickets(Pageable pageable) {
        return dealerSupportTicketRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(ticket -> toSupportTicketResponse(ticket, null));
    }

    @Transactional
    public AdminSupportTicketResponse updateSupportTicket(
            Long id,
            UpdateAdminSupportTicketRequest request,
            String actorUsername
    ) {
        DealerSupportTicket ticket = dealerSupportTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found"));
        Admin actor = requireAdmin(actorUsername);

        DealerSupportTicketStatus previousStatus = ticket.getStatus();
        DealerSupportTicketStatus nextStatus = request.status();
        assertSupportTicketTransitionAllowed(previousStatus, nextStatus);
        ticket.setStatus(nextStatus);
        Admin previousAssignee = ticket.getAssignee();
        ticket.setAssignee(resolveSupportAssignee(request.assigneeId()));
        Instant now = Instant.now();
        synchronizeSupportTicketTimeline(ticket, nextStatus, now);
        if (previousStatus != nextStatus) {
            ticket.addMessage(buildSupportTicketMessage(
                    SupportTicketMessageAuthorRole.SYSTEM,
                    "System",
                    true,
                    "Trạng thái được cập nhật từ %s sang %s bởi %s.".formatted(
                            buildSupportTicketStatusLabel(previousStatus),
                            buildSupportTicketStatusLabel(nextStatus),
                            safeValue(resolveAdminName(actor), "Admin")
                    ),
                    null
            ));
        }
        if (!Objects.equals(previousAssignee == null ? null : previousAssignee.getId(), request.assigneeId())) {
            ticket.addMessage(buildSupportTicketMessage(
                    SupportTicketMessageAuthorRole.SYSTEM,
                    "System",
                    true,
                    buildAssigneeAuditMessage(previousAssignee, ticket.getAssignee(), actor),
                    null
            ));
        }

        DealerSupportTicket saved = dealerSupportTicketRepository.save(ticket);
        Dealer dealer = saved.getDealer();
        boolean statusChanged = previousStatus != saved.getStatus();
        if (dealer != null && statusChanged) {
            notificationService.create(new CreateNotifyRequest(
                    dealer.getId(),
                    appMessageSupport.get("notification.support.updated.title"),
                    buildSupportTicketNotificationContent(saved, true, false),
                    NotifyType.SYSTEM,
                    "/support",
                    null
            ));
            sendSupportTicketEmailIfPossible(dealer, saved, true, false);
        }
        return toSupportTicketResponse(saved, actor);
    }

    @Transactional
    public AdminSupportTicketResponse addSupportTicketMessage(
            Long id,
            CreateAdminSupportTicketMessageRequest request,
            String actorUsername
    ) {
        DealerSupportTicket ticket = dealerSupportTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found"));
        Admin actor = requireAdmin(actorUsername);
        boolean internalNote = Boolean.TRUE.equals(request.internalNote());

        SupportTicketMessage adminMessage = buildSupportTicketMessage(
                SupportTicketMessageAuthorRole.ADMIN,
                resolveAdminName(actor),
                internalNote,
                requireNonBlank(request.message(), "message"),
                request.attachments()
        );
        ticket.addMessage(adminMessage);
        if (!internalNote) {
            ticket.setAdminReply(requireNonBlank(request.message(), "message"));
            if (ticket.getStatus() == DealerSupportTicketStatus.OPEN) {
                ticket.setStatus(DealerSupportTicketStatus.IN_PROGRESS);
            }
            synchronizeSupportTicketTimeline(ticket, ticket.getStatus(), Instant.now());
        }

        DealerSupportTicket saved = dealerSupportTicketRepository.saveAndFlush(ticket);
        SupportTicketMessage persistedMessage = saved.getMessages().isEmpty()
                ? null
                : saved.getMessages().get(saved.getMessages().size() - 1);
        mediaAssetService.attachAssetsToSupportMessage(
                actor,
                saved,
                persistedMessage,
                request.mediaAssetIds(),
                countLegacyAttachments(request.attachments()),
                countLegacyVideos(request.attachments())
        );
        dealerSupportTicketRepository.save(saved);
        Dealer dealer = saved.getDealer();
        if (!internalNote && dealer != null) {
            notificationService.create(new CreateNotifyRequest(
                    dealer.getId(),
                    appMessageSupport.get("notification.support.updated.title"),
                    buildSupportTicketNotificationContent(saved, false, true),
                    NotifyType.SYSTEM,
                    "/support",
                    null
            ));
            sendSupportTicketEmailIfPossible(dealer, saved, false, true);
        }
        return toSupportTicketResponse(saved, actor);
    }

    @Transactional(readOnly = true)
    public Page<AdminWarrantyResponse> getWarranties(Pageable pageable) {
        return warrantyRegistrationRepository.findAll(pageable).map(this::toWarrantyResponse);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, allEntries = true)
    public AdminWarrantyResponse updateWarrantyStatus(Long id, UpdateAdminWarrantyStatusRequest request) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        if (request.status() == WarrantyStatus.ACTIVE
                && WarrantyDateSupport.isExpired(registration.getWarrantyEnd())) {
            throw new BadRequestException("Cannot activate a warranty that has already expired");
        }

        registration.setStatus(request.status());
        ProductSerial productSerial = registration.getProductSerial();
        if (productSerial != null) {
            productSerial.setStatus(resolveSerialStatusForWarranty(registration, productSerial));
            productSerialRepository.save(productSerial);
            productStockSyncSupport.syncProductStock(productSerial.getProduct());
        }

        WarrantyRegistration saved = warrantyRegistrationRepository.save(registration);
        return toWarrantyResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<AdminSerialResponse> getSerials(Pageable pageable) {
        return productSerialRepository.findAllByOrderByImportedAtDesc(pageable).map(this::toSerialResponse);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, allEntries = true)
    public SerialImportSummaryResponse<AdminSerialResponse> importSerials(AdminSerialImportRequest request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Dealer dealer = resolveDealer(request.dealerId());
        Order order = resolveOrder(request.orderId());
        if (order != null && order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot import serials for a cancelled order");
        }
        if (dealer == null && order != null) {
            dealer = order.getDealer();
        }
        if (dealer != null && order != null && order.getDealer() != null
                && !Objects.equals(dealer.getId(), order.getDealer().getId())) {
            throw new BadRequestException("Dealer does not own the selected order");
        }
        int orderedQuantity = resolveOrderedQuantity(order, product.getId());
        if (order != null && orderedQuantity <= 0) {
            throw new BadRequestException("Product is not part of the selected order");
        }

        Set<String> uniqueSerials = new LinkedHashSet<>();
        List<SerialImportSkippedItem> skippedItems = new ArrayList<>();
        for (String rawSerial : request.serials()) {
            String normalized = normalize(rawSerial);
            if (normalized == null) {
                skippedItems.add(new SerialImportSkippedItem("", "serial must not be blank"));
                continue;
            }
            String serial = normalized.toUpperCase(Locale.ROOT);
            if (!uniqueSerials.add(serial)) {
                skippedItems.add(new SerialImportSkippedItem(serial, "Duplicate serial in request"));
            }
        }
        ProductSerialStatus initialStatus = resolveImportedStatus(request.status(), order);
        if (initialStatus != ProductSerialStatus.AVAILABLE
                && initialStatus != ProductSerialStatus.DEFECTIVE
                && initialStatus != ProductSerialStatus.ASSIGNED
                && initialStatus != ProductSerialStatus.RESERVED) {
            throw new BadRequestException("Unsupported serial import status");
        }
        if (initialStatus == ProductSerialStatus.ASSIGNED && order == null) {
            throw new BadRequestException("ASSIGNED status requires a linked order");
        }
        if (initialStatus == ProductSerialStatus.RESERVED && order == null) {
            throw new BadRequestException("RESERVED status requires a linked order");
        }
        if (initialStatus == ProductSerialStatus.ASSIGNED && dealer == null) {
            throw new BadRequestException("ASSIGNED status requires a linked dealer");
        }
        long existingSerialCount = order == null
                ? 0L
                : productSerialRepository.countByOrderIdAndProductId(order.getId(), product.getId());

        List<String> importableSerials = new ArrayList<>();
        for (String serial : uniqueSerials) {
            if (productSerialRepository.findBySerialIgnoreCase(serial).isPresent()) {
                skippedItems.add(new SerialImportSkippedItem(serial, "Serial already exists"));
                continue;
            }
            importableSerials.add(serial);
        }

        int remainingCapacity = order == null
                ? Integer.MAX_VALUE
                : Math.max(0, orderedQuantity - Math.toIntExact(existingSerialCount));
        List<String> acceptedSerials = new ArrayList<>();
        for (String serial : importableSerials) {
            if (acceptedSerials.size() >= remainingCapacity) {
                skippedItems.add(new SerialImportSkippedItem(serial, "Imported serial count exceeds ordered quantity"));
                continue;
            }
            acceptedSerials.add(serial);
        }

        List<ProductSerial> serialsToSave = new ArrayList<>();
        for (String serial : acceptedSerials) {
            ProductSerial productSerial = new ProductSerial();
            productSerial.setSerial(serial);
            productSerial.setProduct(product);
            productSerial.setDealer(initialStatus == ProductSerialStatus.ASSIGNED ? dealer : null);
            productSerial.setOrder(order);
            productSerial.setStatus(initialStatus);
            productSerial.setWarehouseId(defaultIfBlank(request.warehouseId(), "main"));
            productSerial.setWarehouseName(defaultIfBlank(request.warehouseName(), "Kho tong"));
            serialsToSave.add(productSerial);
        }
        List<AdminSerialResponse> responses = List.of();
        if (!serialsToSave.isEmpty()) {
            responses = productSerialRepository.saveAll(serialsToSave).stream()
                    .map(this::toSerialResponse)
                    .toList();
        }
        productStockSyncSupport.syncProductStock(product);
        return SerialImportSummaryResponse.of(responses, skippedItems);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, allEntries = true)
    public AdminSerialResponse updateSerialStatus(Long id, UpdateAdminSerialStatusRequest request) {
        ProductSerial productSerial = productSerialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
        ProductSerialStatus nextStatus = request.status();
        if (nextStatus == null) {
            throw new BadRequestException("status is required");
        }
        if (nextStatus.equals(productSerial.getStatus())) {
            return toSerialResponse(productSerial);
        }
        assertManualSerialStatusAllowed(productSerial, nextStatus);
        if (nextStatus == ProductSerialStatus.ASSIGNED) {
            Dealer resolvedDealer = productSerial.getDealer();
            if (resolvedDealer == null && productSerial.getOrder() != null) {
                resolvedDealer = productSerial.getOrder().getDealer();
            }
            if (resolvedDealer == null) {
                throw new BadRequestException("ASSIGNED status requires a linked dealer");
            }
            productSerial.setDealer(resolvedDealer);
        }
        productSerial.setStatus(nextStatus);
        AdminSerialResponse response = toSerialResponse(productSerialRepository.save(productSerial));
        productStockSyncSupport.syncProductStock(productSerial.getProduct());
        return response;
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, allEntries = true)
    public void deleteSerial(Long id) {
        ProductSerial productSerial = productSerialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
        ProductSerialStatus status = productSerial.getStatus();
        if (status != ProductSerialStatus.AVAILABLE && status != ProductSerialStatus.DEFECTIVE) {
            throw new BadRequestException("Only serials with AVAILABLE or DEFECTIVE status can be deleted");
        }
        if (productSerial.getOrder() != null || productSerial.getDealer() != null) {
            throw new BadRequestException("Serial is linked to an order or dealer and cannot be deleted");
        }
        Product product = productSerial.getProduct();
        productSerialRepository.delete(productSerial);
        productStockSyncSupport.syncProductStock(product);
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> getNotifications(Pageable pageable) {
        return notifyRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toNotificationResponse);
    }

    @Transactional
    public AdminNotificationDispatchResponse createNotification(CreateAdminNotificationRequest request) {
        List<Long> recipientIds = resolveRecipientIds(request);
        if (recipientIds.isEmpty()) {
            throw new BadRequestException("No recipients matched the selected audience");
        }

        for (Long accountId : recipientIds) {
            notificationService.create(new CreateNotifyRequest(
                    accountId,
                    requireNonBlank(request.title(), "title"),
                    requireNonBlank(request.body(), "body"),
                    request.type() == null ? NotifyType.SYSTEM : request.type(),
                    normalize(request.link()),
                    normalize(request.deepLink())
            ));
        }

        return new AdminNotificationDispatchResponse(
                normalizeAudience(request.audience()),
                request.type() == null ? NotifyType.SYSTEM : request.type(),
                recipientIds.size(),
                recipientIds,
                Instant.now()
        );
    }

    private List<Long> resolveRecipientIds(CreateAdminNotificationRequest request) {
        String audience = normalizeAudience(request.audience());
        return switch (audience) {
            case "DEALERS" -> dealerRepository.findAllIds();
            case "ALL_ACCOUNTS" -> accountRepository.findAllIds();
            case "ACCOUNTS" -> {
                List<Long> accountIds = request.accountIds() == null ? List.of() : request.accountIds().stream()
                        .filter(id -> id != null)
                        .distinct()
                        .toList();
                if (accountIds.isEmpty()) {
                    throw new BadRequestException("accountIds is required for ACCOUNTS audience");
                }
                List<Long> existingIds = accountRepository.findByIdIn(accountIds).stream()
                        .map(Account::getId)
                        .distinct()
                        .toList();
                if (existingIds.size() != accountIds.size()) {
                    List<Long> missingIds = accountIds.stream()
                            .filter(id -> !existingIds.contains(id))
                            .toList();
                    throw new BadRequestException("Unknown accountIds: " + missingIds);
                }
                yield accountIds;
            }
            default -> throw new BadRequestException("Unsupported audience: " + audience);
        };
    }

    private AdminSupportTicketResponse toSupportTicketResponse(DealerSupportTicket ticket, Account viewer) {
        Dealer dealer = ticket.getDealer();
        return new AdminSupportTicketResponse(
                ticket.getId(),
                dealer == null ? null : dealer.getId(),
                dealer == null ? null : firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername()),
                ticket.getTicketCode(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getSubject(),
                resolveFirstDealerMessage(ticket.getMessages()),
                supportTicketPayloadSupport.readContext(ticket.getContextData()),
                ticket.getAssignee() == null ? null : ticket.getAssignee().getId(),
                ticket.getAssignee() == null ? null : resolveAdminName(ticket.getAssignee()),
                ticket.getMessages().stream().map(message -> toSupportTicketMessageResponse(message, viewer)).toList(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getResolvedAt(),
                ticket.getClosedAt()
        );
    }

    private AdminWarrantyResponse toWarrantyResponse(WarrantyRegistration registration) {
        ProductSerial productSerial = registration.getProductSerial();
        Product product = productSerial == null ? null : productSerial.getProduct();
        Dealer dealer = registration.getDealer();
        Instant warrantyEnd = registration.getWarrantyEnd();
        return new AdminWarrantyResponse(
                registration.getId(),
                registration.getWarrantyCode(),
                productSerial == null ? null : productSerial.getId(),
                productSerial == null ? null : productSerial.getSerial(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                dealer == null ? null : dealer.getId(),
                dealer == null ? null : firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername()),
                registration.getCustomerName(),
                registration.getCustomerEmail(),
                registration.getCustomerPhone(),
                WarrantyStatusSupport.resolveEffectiveStatus(registration),
                registration.getWarrantyStart(),
                warrantyEnd,
                computeRemainingDays(warrantyEnd),
                registration.getCreatedAt()
        );
    }

    private AdminSerialResponse toSerialResponse(ProductSerial serial) {
        Product product = serial.getProduct();
        Dealer dealer = serial.getDealer();
        Order order = serial.getOrder();
        WarrantyRegistration warranty = serial.getWarranty();
        Dealer pendingDealer = dealer == null && order != null ? order.getDealer() : null;
        return new AdminSerialResponse(
                serial.getId(),
                serial.getSerial(),
                serial.getStatus(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                dealer == null ? null : dealer.getId(),
                dealer == null ? null : firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername()),
                pendingDealer == null ? null : pendingDealer.getId(),
                pendingDealer == null ? null : firstNonBlank(pendingDealer.getBusinessName(), pendingDealer.getContactName(), pendingDealer.getUsername()),
                warranty == null ? null : warranty.getCustomerName(),
                order == null ? null : order.getId(),
                order == null ? null : order.getOrderCode(),
                serial.getWarehouseId(),
                serial.getWarehouseName(),
                serial.getImportedAt()
        );
    }

    private AdminNotificationResponse toNotificationResponse(Notify notify) {
        Account account = notify.getAccount();
        return new AdminNotificationResponse(
                notify.getId(),
                account == null ? null : account.getId(),
                account == null ? null : resolveAccountName(account),
                account == null ? null : account.getClass().getSimpleName().toUpperCase(Locale.ROOT),
                notify.getTitle(),
                notify.getContent(),
                notify.getIsRead(),
                notify.getType(),
                notify.getLink(),
                notify.getDeepLink(),
                notify.getCreatedAt()
        );
    }

    private String resolveAccountName(Account account) {
        if (account instanceof Dealer dealer) {
            return firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername());
        }
        return firstNonBlank(account.getUsername(), account.getEmail());
    }

    private Dealer resolveDealer(Long dealerId) {
        if (dealerId == null) {
            return null;
        }
        return dealerRepository.findById(dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
    }

    private Order resolveOrder(Long orderId) {
        if (orderId == null) {
            return null;
        }
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private int resolveOrderedQuantity(Order order, Long productId) {
        if (order == null || order.getOrderItems() == null || productId == null) {
            return 0;
        }
        return order.getOrderItems().stream()
                .filter(item -> item != null
                        && item.getProduct() != null
                        && Objects.equals(item.getProduct().getId(), productId))
                .map(OrderItem::getQuantity)
                .filter(Objects::nonNull)
                .mapToInt(quantity -> Math.max(0, quantity))
                .sum();
    }

    private ProductSerialStatus resolveSerialStatusForWarranty(
            WarrantyRegistration registration,
            ProductSerial productSerial
    ) {
        ProductSerialStatus currentStatus = productSerial.getStatus();
        if (currentStatus == ProductSerialStatus.DEFECTIVE || currentStatus == ProductSerialStatus.RETURNED) {
            return currentStatus;
        }
        WarrantyStatus resolvedWarrantyStatus = WarrantyStatusSupport.resolveEffectiveStatus(registration);
        if (resolvedWarrantyStatus == WarrantyStatus.ACTIVE) {
            return ProductSerialStatus.WARRANTY;
        }
        Order order = productSerial.getOrder();
        return order != null && order.getStatus() == OrderStatus.COMPLETED
                ? ProductSerialStatus.ASSIGNED
                : ProductSerialStatus.AVAILABLE;
    }

    private ProductSerialStatus resolveImportedStatus(ProductSerialStatus requestedStatus, Order order) {
        if (order == null) {
            return requestedStatus == null ? ProductSerialStatus.AVAILABLE : requestedStatus;
        }
        ProductSerialStatus requiredStatus = order.getStatus() == OrderStatus.COMPLETED
                ? ProductSerialStatus.ASSIGNED
                : ProductSerialStatus.RESERVED;
        if (requestedStatus == null || requestedStatus == requiredStatus) {
            return requiredStatus;
        }
        if (requestedStatus == ProductSerialStatus.AVAILABLE) {
            throw new BadRequestException("AVAILABLE status is not allowed when linking serials to an order");
        }
        if (requestedStatus == ProductSerialStatus.ASSIGNED || requestedStatus == ProductSerialStatus.RESERVED) {
            return requiredStatus;
        }
        throw new BadRequestException("Order-linked serials must use status " + requiredStatus);
    }

    private void assertManualSerialStatusAllowed(ProductSerial productSerial, ProductSerialStatus nextStatus) {
        WarrantyRegistration warranty = productSerial.getWarranty();
        WarrantyStatus warrantyStatus = warranty == null ? null : WarrantyStatusSupport.resolveEffectiveStatus(warranty);
        if (productSerial.getStatus() == ProductSerialStatus.RETURNED) {
            throw new BadRequestException("RETURNED serial must be managed via a dedicated return workflow");
        }

        if (nextStatus == ProductSerialStatus.RETURNED) {
            throw new BadRequestException("RETURNED status must be managed via a dedicated return workflow");
        }
        if (nextStatus == ProductSerialStatus.RESERVED) {
            throw new BadRequestException("RESERVED status must be managed via the order workflow");
        }
        if (nextStatus == ProductSerialStatus.WARRANTY) {
            if (warranty == null || warrantyStatus != WarrantyStatus.ACTIVE) {
                throw new BadRequestException("WARRANTY status requires an active warranty registration");
            }
            return;
        }
        if (nextStatus == ProductSerialStatus.ASSIGNED) {
            if (productSerial.getOrder() == null) {
                throw new BadRequestException("ASSIGNED status requires a linked order");
            }
            if (warrantyStatus == WarrantyStatus.ACTIVE) {
                throw new BadRequestException("Active warranty serial must remain in WARRANTY status");
            }
            return;
        }
        if ((nextStatus == ProductSerialStatus.AVAILABLE || nextStatus == ProductSerialStatus.DEFECTIVE)
                && warranty != null) {
            throw new BadRequestException("Warranty-linked serial cannot move back to inventory status");
        }
        if (nextStatus == ProductSerialStatus.DEFECTIVE) {
            boolean ownedByDealer = productSerial.getDealer() != null
                    || (productSerial.getOrder() != null && productSerial.getOrder().getDealer() != null);
            if (ownedByDealer) {
                throw new BadRequestException("Serial already belongs to a dealer and cannot be marked defective by admin");
            }
        }
    }

    private long computeRemainingDays(Instant warrantyEnd) {
        return WarrantyDateSupport.remainingDays(warrantyEnd);
    }

    private void assertSupportTicketTransitionAllowed(
            DealerSupportTicketStatus currentStatus,
            DealerSupportTicketStatus nextStatus
    ) {
        if (nextStatus == null) {
            throw new BadRequestException("status is required");
        }
        boolean allowed = switch (currentStatus) {
            case OPEN -> nextStatus == DealerSupportTicketStatus.OPEN
                    || nextStatus == DealerSupportTicketStatus.IN_PROGRESS
                    || nextStatus == DealerSupportTicketStatus.CLOSED;
            case IN_PROGRESS -> nextStatus == DealerSupportTicketStatus.OPEN
                    || nextStatus == DealerSupportTicketStatus.IN_PROGRESS
                    || nextStatus == DealerSupportTicketStatus.RESOLVED
                    || nextStatus == DealerSupportTicketStatus.CLOSED;
            case RESOLVED -> nextStatus == DealerSupportTicketStatus.RESOLVED
                    || nextStatus == DealerSupportTicketStatus.IN_PROGRESS
                    || nextStatus == DealerSupportTicketStatus.CLOSED;
            case CLOSED -> nextStatus == DealerSupportTicketStatus.CLOSED;
        };
        if (!allowed) {
            throw new BadRequestException(
                    "Support ticket transition from " + currentStatus + " to " + nextStatus + " is not allowed"
            );
        }
    }

    private void synchronizeSupportTicketTimeline(
            DealerSupportTicket ticket,
            DealerSupportTicketStatus nextStatus,
            Instant now
    ) {
        switch (nextStatus) {
            case OPEN, IN_PROGRESS -> {
                ticket.setResolvedAt(null);
                ticket.setClosedAt(null);
            }
            case RESOLVED -> {
                if (ticket.getResolvedAt() == null) {
                    ticket.setResolvedAt(now);
                }
                ticket.setClosedAt(null);
            }
            case CLOSED -> {
                if (ticket.getResolvedAt() == null) {
                    ticket.setResolvedAt(now);
                }
                if (ticket.getClosedAt() == null) {
                    ticket.setClosedAt(now);
                }
            }
        }
    }

    private String buildSupportTicketNotificationContent(
            DealerSupportTicket ticket,
            boolean statusChanged,
            boolean replyChanged
    ) {
        String ticketCode = safeValue(ticket.getTicketCode(), "#" + ticket.getId());
        if (statusChanged && replyChanged) {
            return appMessageSupport.get(
                    "notification.support.updated.status_reply",
                    ticketCode,
                    buildSupportTicketStatusLabel(ticket.getStatus())
            );
        }
        if (replyChanged) {
            return appMessageSupport.get("notification.support.updated.reply", ticketCode);
        }
        return appMessageSupport.get(
                "notification.support.updated.status",
                ticketCode,
                buildSupportTicketStatusLabel(ticket.getStatus())
        );
    }

    private void sendSupportTicketEmailIfPossible(
            Dealer dealer,
            DealerSupportTicket ticket,
            boolean statusChanged,
            boolean replyChanged
    ) {
        String recipient = normalize(dealer.getEmail());
        if (recipient == null || !mailService.isEnabled()) {
            return;
        }

        try {
            asyncMailService.sendText(
                    recipient,
                    buildSupportTicketEmailSubject(ticket),
                    buildSupportTicketEmailBody(dealer, ticket, statusChanged, replyChanged)
            );
        } catch (RuntimeException ex) {
            log.warn("Could not send support ticket email to {}", recipient, ex);
        }
    }

    private String buildSupportTicketEmailSubject(DealerSupportTicket ticket) {
        String ticketCode = safeValue(ticket.getTicketCode(), "#" + ticket.getId());
        return "4T HITEK cập nhật yêu cầu hỗ trợ " + ticketCode;
    }

    private String buildSupportTicketEmailBody(
            Dealer dealer,
            DealerSupportTicket ticket,
            boolean statusChanged,
            boolean replyChanged
    ) {
        String greetingName = firstNonBlank(
                dealer.getContactName(),
                dealer.getBusinessName(),
                dealer.getUsername(),
                dealer.getEmail()
        );
        String ticketCode = safeValue(ticket.getTicketCode(), "#" + ticket.getId());
        StringBuilder body = new StringBuilder()
                .append("Xin chào ").append(greetingName).append(",\n\n")
                .append("Yêu cầu hỗ trợ ").append(ticketCode).append(" vừa được admin cập nhật.\n")
                .append("Chủ đề: ").append(safeValue(ticket.getSubject(), "Không có tiêu đề")).append(".\n")
                .append("Trạng thái hiện tại: ").append(buildSupportTicketStatusLabel(ticket.getStatus())).append(".\n");

        String latestPublicAdminMessage = resolveLatestPublicAdminMessage(ticket.getMessages());
        if (replyChanged && latestPublicAdminMessage != null) {
            body.append("\nPhản hồi mới từ admin:\n")
                    .append(latestPublicAdminMessage)
                    .append("\n");
        } else if (statusChanged) {
            body.append("\n")
                    .append(buildSupportTicketNotificationContent(ticket, true, false))
                    .append("\n");
        }

        body.append("\nVui lòng mở ứng dụng Dealer để xem chi tiết thêm.\n\n")
                .append("Trân trọng,\n")
                .append("4T HITEK");
        return body.toString();
    }

    private String buildSupportTicketStatusLabel(DealerSupportTicketStatus status) {
        if (status == null) {
            return "Đang cập nhật";
        }
        return switch (status) {
            case OPEN -> "Mở";
            case IN_PROGRESS -> "Đang xử lý";
            case RESOLVED -> "Đã giải quyết";
            case CLOSED -> "Đã đóng";
        };
    }

    private SupportTicketMessageResponse toSupportTicketMessageResponse(SupportTicketMessage message, Account viewer) {
        List<com.devwonder.backend.dto.support.SupportTicketAttachmentResponse> attachments = new ArrayList<>();
        attachments.addAll(mediaAssetService.buildMediaAttachmentResponses(message, viewer, appBaseUrl()));
        attachments.addAll(supportTicketPayloadSupport.readAttachments(message.getAttachments()));
        return new SupportTicketMessageResponse(
                message.getId(),
                message.getAuthorRole(),
                message.getAuthorName(),
                Boolean.TRUE.equals(message.getInternalNote()),
                message.getMessage(),
                List.copyOf(attachments),
                message.getCreatedAt()
        );
    }

    private SupportTicketMessage buildSupportTicketMessage(
            SupportTicketMessageAuthorRole authorRole,
            String authorName,
            boolean internalNote,
            String message,
            List<com.devwonder.backend.dto.support.SupportTicketAttachmentPayload> attachments
    ) {
        SupportTicketMessage supportTicketMessage = new SupportTicketMessage();
        supportTicketMessage.setAuthorRole(authorRole);
        supportTicketMessage.setAuthorName(authorName);
        supportTicketMessage.setInternalNote(internalNote);
        supportTicketMessage.setMessage(message);
        supportTicketMessage.setAttachments(supportTicketPayloadSupport.writeAttachments(attachments));
        return supportTicketMessage;
    }

    private String resolveFirstDealerMessage(List<SupportTicketMessage> messages) {
        return messages.stream()
                .filter(message -> message.getAuthorRole() == SupportTicketMessageAuthorRole.DEALER)
                .filter(message -> !Boolean.TRUE.equals(message.getInternalNote()))
                .map(SupportTicketMessage::getMessage)
                .findFirst()
                .orElse(null);
    }

    private String resolveLatestAdminReply(List<SupportTicketMessage> messages) {
        String latestReply = null;
        for (SupportTicketMessage message : messages) {
            if (message.getAuthorRole() == SupportTicketMessageAuthorRole.ADMIN
                    && !Boolean.TRUE.equals(message.getInternalNote())) {
                latestReply = message.getMessage();
            }
        }
        return latestReply;
    }

    private String resolveLatestPublicAdminMessage(List<SupportTicketMessage> messages) {
        return resolveLatestAdminReply(messages);
    }

    private Admin resolveSupportAssignee(Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }
        return adminRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
    }

    private Admin requireAdmin(String username) {
        return adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
    }

    private String resolveAdminName(Admin admin) {
        if (admin == null) {
            return null;
        }
        return firstNonBlank(admin.getDisplayName(), admin.getRoleTitle(), admin.getUsername(), admin.getEmail());
    }

    private String buildAssigneeAuditMessage(Admin previousAssignee, Admin nextAssignee, Admin actor) {
        String actorName = safeValue(resolveAdminName(actor), "Admin");
        if (nextAssignee == null) {
            return "Ticket được bỏ gán người phụ trách bởi %s.".formatted(actorName);
        }
        if (previousAssignee == null) {
            return "Ticket được gán cho %s bởi %s.".formatted(
                    safeValue(resolveAdminName(nextAssignee), "Admin"),
                    actorName
            );
        }
        return "Ticket được chuyển phụ trách từ %s sang %s bởi %s.".formatted(
                safeValue(resolveAdminName(previousAssignee), "Admin"),
                safeValue(resolveAdminName(nextAssignee), "Admin"),
                actorName
        );
    }

    private int countLegacyAttachments(List<com.devwonder.backend.dto.support.SupportTicketAttachmentPayload> attachments) {
        String raw = supportTicketPayloadSupport.writeAttachments(attachments);
        return supportTicketPayloadSupport.readAttachments(raw).size();
    }

    private int countLegacyVideos(List<com.devwonder.backend.dto.support.SupportTicketAttachmentPayload> attachments) {
        String raw = supportTicketPayloadSupport.writeAttachments(attachments);
        return (int) supportTicketPayloadSupport.readAttachments(raw).stream()
                .map(com.devwonder.backend.dto.support.SupportTicketAttachmentResponse::mediaType)
                .filter(Objects::nonNull)
                .filter(mediaType -> mediaType == MediaType.VIDEO)
                .count();
    }

    private String appBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }

    private String normalize(String value) {
        return AccountValidationSupport.normalize(value);
    }

    private String requireNonBlank(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new BadRequestException(fieldName + " must not be blank");
        }
        return normalized;
    }

    private String defaultIfBlank(String value, String fallback) {
        String normalized = normalize(value);
        return normalized == null ? fallback : normalized;
    }

    private String normalizeAudience(String audience) {
        return requireNonBlank(audience, "audience").toUpperCase(Locale.ROOT);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return "";
    }

    private String safeValue(String value, String fallback) {
        String normalized = normalize(value);
        return normalized == null ? fallback : normalized;
    }
}
