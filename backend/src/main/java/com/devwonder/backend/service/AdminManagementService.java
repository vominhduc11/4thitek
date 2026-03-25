package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminAssignOrderSerialsRequest;
import com.devwonder.backend.dto.admin.AdminBlogResponse;
import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountUpdateRequest;
import com.devwonder.backend.dto.admin.AdminDealerResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleUpsertRequest;
import com.devwonder.backend.dto.admin.AdminOrderResponse;
import com.devwonder.backend.dto.admin.AdminProductResponse;
import com.devwonder.backend.dto.admin.AdminProductUpsertRequest;
import com.devwonder.backend.dto.admin.AdminStaffUserResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserUpsertRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDiscountRuleStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminStaffUserStatusRequest;
import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.dto.realtime.DealerOrderStatusEvent;
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.BlogRepository;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.CategoryBlogRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.UnmatchedPaymentRepository;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.service.support.AdminDashboardSupport;
import com.devwonder.backend.service.support.AdminIdentitySupport;
import com.devwonder.backend.service.support.AdminOrderNotificationSupport;
import com.devwonder.backend.service.support.AdminResponseMapper;
import com.devwonder.backend.service.support.AccountValidationSupport;
import com.devwonder.backend.service.support.AdminWriteSupport;
import com.devwonder.backend.service.support.DealerOrderNotificationSupport;
import com.devwonder.backend.service.support.DealerPaymentSupport;
import com.devwonder.backend.service.support.DealerAccountStatusTransitionPolicy;
import com.devwonder.backend.service.support.OrderInventorySupport;
import com.devwonder.backend.service.support.OrderPricingSupport;
import com.devwonder.backend.service.support.OrderStatusTransitionPolicy;
import com.devwonder.backend.service.support.ProductSerialOrderSupport;
import com.devwonder.backend.service.support.ProductSerialResponseMapper;
import com.devwonder.backend.service.support.ProductStockSyncSupport;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminManagementService {

    private static final Logger log = LoggerFactory.getLogger(AdminManagementService.class);
    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final DealerRepository dealerRepository;
    private final ProductSerialRepository productSerialRepository;
    private final BlogRepository blogRepository;
    private final CategoryBlogRepository categoryBlogRepository;
    private final AdminRepository adminRepository;
    private final BulkDiscountRepository bulkDiscountRepository;
    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final DealerAccountLifecycleService dealerAccountLifecycleService;
    private final AdminSettingsService adminSettingsService;
    private final AdminWriteSupport adminWriteSupport;
    private final AdminIdentitySupport adminIdentitySupport;
    private final AdminOrderNotificationSupport adminOrderNotificationSupport;
    private final DealerPaymentSupport dealerPaymentSupport;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final OrderInventorySupport orderInventorySupport;
    private final ProductSerialOrderSupport productSerialOrderSupport;
    private final ProductStockSyncSupport productStockSyncSupport;
    private final FinancialSettlementRepository financialSettlementRepository;
    private final UnmatchedPaymentRepository unmatchedPaymentRepository;
    private final DealerOrderNotificationSupport dealerOrderNotificationSupport;
    private final PasswordResetService passwordResetService;

    @Transactional(readOnly = true)
    public List<AdminProductResponse> getProducts() {
        return productRepository.findByIsDeletedFalseOrderByUpdatedAtDesc().stream()
                .map(p -> AdminResponseMapper.toProductResponse(p, safeStock(p)))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<AdminProductResponse> getProducts(Pageable pageable) {
        return productRepository.findByIsDeletedFalse(pageable)
                .map(p -> AdminResponseMapper.toProductResponse(p, safeStock(p)));
    }

    @Transactional
    @CacheEvict(cacheNames = {
            CacheNames.ADMIN_DASHBOARD,
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_HOMEPAGE_PRODUCTS,
            CacheNames.PUBLIC_FEATURED_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID
    }, allEntries = true)
    public AdminProductResponse createProduct(AdminProductUpsertRequest request) {
        Product product = new Product();
        adminWriteSupport.applyProduct(product, request, true);
        Product saved = productRepository.save(product);
        productStockSyncSupport.syncProductStock(saved);
        return AdminResponseMapper.toProductResponse(saved, safeStock(saved));
    }

    @Transactional
    @CacheEvict(cacheNames = {
            CacheNames.ADMIN_DASHBOARD,
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_HOMEPAGE_PRODUCTS,
            CacheNames.PUBLIC_FEATURED_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID
    }, allEntries = true)
    public AdminProductResponse updateProduct(Long id, AdminProductUpsertRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        adminWriteSupport.applyProduct(product, request, false);
        Product saved = productRepository.save(product);
        productStockSyncSupport.syncProductStock(saved);
        return AdminResponseMapper.toProductResponse(saved, safeStock(saved));
    }

    @Transactional
    @CacheEvict(cacheNames = {
            CacheNames.ADMIN_DASHBOARD,
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_HOMEPAGE_PRODUCTS,
            CacheNames.PUBLIC_FEATURED_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID
    }, allEntries = true)
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsDeleted(true);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getOrders() {
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        return orderRepository.findVisibleByCreatedAtDesc(Pageable.unpaged()).stream()
                .map(order -> AdminResponseMapper.toOrderResponse(order, activeDiscountRules))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<AdminOrderResponse> getOrders(Pageable pageable) {
        return getOrders(pageable, null);
    }

    @Transactional(readOnly = true)
    public Page<AdminOrderResponse> getOrders(Pageable pageable, OrderStatus status) {
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        Pageable effectivePageable = pageable == null || pageable.isUnpaged()
                ? PageRequest.of(0, 100)
                : pageable;
        return orderRepository.findVisibleByStatusAndCreatedAtDesc(status, effectivePageable)
                .map(order -> AdminResponseMapper.toOrderResponse(order, activeDiscountRules));
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public AdminOrderResponse updateOrderStatus(Long id, UpdateDealerOrderStatusRequest request, String actorUsername) {
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        OrderStatus previousStatus = order.getStatus();
        OrderStatusTransitionPolicy.assertAdminTransitionAllowed(previousStatus, request.status());
        order.setStatus(request.status());
        applyCompletedAt(order, request.status(), previousStatus);
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED) {
            productSerialOrderSupport.releaseNonWarrantySerials(order);
            orderInventorySupport.restoreStock(order);
        }
        if (request.status() == OrderStatus.COMPLETED && previousStatus != OrderStatus.COMPLETED && order.getDealer() != null) {
            List<ProductSerial> orderSerials = productSerialRepository.findByOrderId(id);
            java.util.List<ProductSerial> toUpdate = new java.util.ArrayList<>();
            for (ProductSerial serial : orderSerials) {
                if (serial.getDealer() == null) {
                    serial.setDealer(order.getDealer());
                }
                if (serial.getStatus() == ProductSerialStatus.RESERVED || serial.getStatus() == ProductSerialStatus.AVAILABLE) {
                    serial.setStatus(ProductSerialStatus.ASSIGNED);
                    toUpdate.add(serial);
                    continue;
                }
                toUpdate.add(serial);
            }
            if (!toUpdate.isEmpty()) {
                productSerialRepository.saveAll(toUpdate);
            }
        }
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        BigDecimal paidAmount = order.getPaidAmount() == null ? BigDecimal.ZERO : order.getPaidAmount();
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED
                && paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            order.setFinancialSettlementRequired(Boolean.TRUE);
        }
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules));
        Order saved = orderRepository.save(order);
        // Create FinancialSettlement when admin cancels an order with paidAmount > 0
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED
                && paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            FinancialSettlement settlement = new FinancialSettlement();
            settlement.setOrder(saved);
            settlement.setType("CANCELLATION_REFUND");
            settlement.setAmount(paidAmount);
            settlement.setStatus(FinancialSettlementStatus.PENDING);
            settlement.setCreatedBy(actorUsername);
            financialSettlementRepository.save(settlement);
            dealerOrderNotificationSupport.notifyAdminsFinancialSettlementRequired(saved, paidAmount);
        }
        adminOrderNotificationSupport.notifyStatusChange(saved, previousStatus);
        publishOrderStatusRealtime(saved, previousStatus);
        return AdminResponseMapper.toOrderResponse(saved, activeDiscountRules);
    }

    @Transactional
    public List<DealerProductSerialResponse> assignOrderSerials(Long orderId, AdminAssignOrderSerialsRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Can only assign serials to a confirmed order");
        }
        if (order.getDealer() == null) {
            throw new BadRequestException("Order has no associated dealer");
        }

        // Build map of productId → orderedQuantity for validation
        java.util.Map<Long, Integer> orderedQty = new java.util.HashMap<>();
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (item != null && item.getProduct() != null) {
                    orderedQty.merge(item.getProduct().getId(),
                            item.getQuantity() == null ? 0 : item.getQuantity(), Integer::sum);
                }
            }
        }

        // Build map of productId → already-assigned serial count for this order
        java.util.Map<Long, Long> alreadyAssigned = new java.util.HashMap<>();
        for (ProductSerial existing : productSerialRepository.findByOrderId(orderId)) {
            if (existing.getProduct() != null) {
                alreadyAssigned.merge(existing.getProduct().getId(), 1L, Long::sum);
            }
        }

        java.util.Map<Long, Long> requestedCounts = new java.util.HashMap<>();
        java.util.Set<String> requestedSerials = new java.util.LinkedHashSet<>();
        for (AdminAssignOrderSerialsRequest.LineAssignment line : request.assignments()) {
            Long productId = line.productId();
            int ordered = orderedQty.getOrDefault(productId, 0);
            if (ordered <= 0) {
                throw new BadRequestException("Product " + productId + " is not part of this order");
            }
            for (String serialValue : line.serials()) {
                String normalizedSerial = serialValue.trim().toUpperCase(java.util.Locale.ROOT);
                if (!requestedSerials.add(normalizedSerial)) {
                    throw new BadRequestException("Duplicate serial in request: " + normalizedSerial);
                }
                requestedCounts.merge(productId, 1L, Long::sum);
            }
        }
        for (java.util.Map.Entry<Long, Long> entry : requestedCounts.entrySet()) {
            Long productId = entry.getKey();
            long existingCount = alreadyAssigned.getOrDefault(productId, 0L);
            int ordered = orderedQty.getOrDefault(productId, 0);
            if (existingCount + entry.getValue() > ordered) {
                throw new BadRequestException("Serial count for product " + productId + " exceeds ordered quantity");
            }
        }

        List<ProductSerial> toSave = new java.util.ArrayList<>();
        for (AdminAssignOrderSerialsRequest.LineAssignment line : request.assignments()) {
            Long productId = line.productId();
            for (String serialValue : line.serials()) {
                String normalizedSerial = serialValue.trim().toUpperCase(java.util.Locale.ROOT);
                ProductSerial serial = productSerialRepository.findBySerialIgnoreCase(normalizedSerial)
                        .orElseThrow(() -> new ResourceNotFoundException("Serial not found: " + normalizedSerial));
                if (serial.getDealer() != null) {
                    throw new BadRequestException("Serial " + normalizedSerial + " is already assigned to a dealer");
                }
                if (serial.getOrder() != null && !Objects.equals(serial.getOrder().getId(), orderId)) {
                    throw new BadRequestException("Serial " + normalizedSerial + " is already linked to another order");
                }
                if (serial.getStatus() != ProductSerialStatus.AVAILABLE) {
                    throw new BadRequestException("Serial " + normalizedSerial + " is not available");
                }
                if (serial.getProduct() == null || !serial.getProduct().getId().equals(productId)) {
                    throw new BadRequestException("Serial " + normalizedSerial + " does not belong to product " + productId);
                }
                serial.setOrder(order);
                serial.setDealer(null);
                serial.setStatus(ProductSerialStatus.RESERVED);
                toSave.add(serial);
            }
        }

        List<DealerProductSerialResponse> savedSerials = productSerialRepository.saveAll(toSave).stream()
                .map(ProductSerialResponseMapper::toDealerProductSerialResponse)
                .toList();
        productStockSyncSupport.syncProductStocksByIds(requestedCounts.keySet());
        return savedSerials;
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.CANCELLED) {
            throw new BadRequestException("Only cancelled orders can be deleted");
        }
        boolean wasVisible = !Boolean.TRUE.equals(order.getIsDeleted());
        order.setIsDeleted(true);
        Order saved = orderRepository.save(order);
        if (wasVisible) {
            adminOrderNotificationSupport.notifyDeletion(saved);
        }
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public AdminOrderResponse recordOrderPayment(Long id, RecordPaymentRequest request) {
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        dealerPaymentSupport.recordAdminPayment(order, request, activeDiscountRules);
        return AdminResponseMapper.toOrderResponse(order, activeDiscountRules);
    }

    @Transactional(readOnly = true)
    public List<AdminDealerResponse> getDealers() {
        return dealerRepository.findAll().stream().map(AdminResponseMapper::toDealerResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DealerProductSerialResponse> getSerials() {
        return productSerialRepository.findAll().stream()
                .map(ProductSerialResponseMapper::toDealerProductSerialResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminBlogResponse> getBlogs() {
        return blogRepository.findAll().stream()
                .sorted(Comparator.comparing(Blog::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminResponseMapper::toBlogResponse)
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = {
            CacheNames.ADMIN_DASHBOARD,
            CacheNames.PUBLIC_BLOGS,
            CacheNames.PUBLIC_HOMEPAGE_BLOGS,
            CacheNames.PUBLIC_BLOG_BY_ID,
            CacheNames.PUBLIC_BLOG_RELATED,
            CacheNames.PUBLIC_BLOG_CATEGORIES,
            CacheNames.PUBLIC_BLOGS_BY_CATEGORY
    }, allEntries = true)
    public AdminBlogResponse createBlog(AdminBlogUpsertRequest request) {
        adminWriteSupport.validateBlogRequest(request, true);
        Blog blog = new Blog();
        adminWriteSupport.applyBlog(blog, request, true);
        return AdminResponseMapper.toBlogResponse(blogRepository.save(blog));
    }

    @Transactional
    @CacheEvict(cacheNames = {
            CacheNames.ADMIN_DASHBOARD,
            CacheNames.PUBLIC_BLOGS,
            CacheNames.PUBLIC_HOMEPAGE_BLOGS,
            CacheNames.PUBLIC_BLOG_BY_ID,
            CacheNames.PUBLIC_BLOG_RELATED,
            CacheNames.PUBLIC_BLOG_CATEGORIES,
            CacheNames.PUBLIC_BLOGS_BY_CATEGORY
    }, allEntries = true)
    public AdminBlogResponse updateBlog(Long id, AdminBlogUpsertRequest request) {
        adminWriteSupport.validateBlogRequest(request, false);
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        adminWriteSupport.applyBlog(blog, request, false);
        return AdminResponseMapper.toBlogResponse(blogRepository.save(blog));
    }

    @Transactional
    @CacheEvict(cacheNames = {
            CacheNames.ADMIN_DASHBOARD,
            CacheNames.PUBLIC_BLOGS,
            CacheNames.PUBLIC_HOMEPAGE_BLOGS,
            CacheNames.PUBLIC_BLOG_BY_ID,
            CacheNames.PUBLIC_BLOG_RELATED,
            CacheNames.PUBLIC_BLOG_CATEGORIES,
            CacheNames.PUBLIC_BLOGS_BY_CATEGORY
    }, allEntries = true)
    public void deleteBlog(Long id) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        blog.setIsDeleted(true);
        blogRepository.save(blog);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategories() {
        return categoryBlogRepository.findAll().stream()
                .map(category -> Map.<String, Object>of("id", category.getId(), "name", category.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminDealerAccountResponse> getDealerAccounts() {
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        return dealerRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(dealer -> AdminResponseMapper.toDealerAccountResponse(dealer, activeDiscountRules))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<AdminDealerAccountResponse> getDealerAccounts(Pageable pageable) {
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        Pageable effectivePageable = pageable == null || pageable.isUnpaged()
                ? PageRequest.of(0, 100)
                : pageable;
        return dealerRepository.findAllByOrderByCreatedAtDesc(effectivePageable)
                .map(dealer -> AdminResponseMapper.toDealerAccountResponse(dealer, activeDiscountRules));
    }

    @Transactional
    @CacheEvict(cacheNames = {CacheNames.ADMIN_DASHBOARD, CacheNames.PUBLIC_DEALERS}, allEntries = true)
    public AdminDealerAccountResponse updateDealerAccount(Long id, AdminDealerAccountUpdateRequest request) {
        Dealer dealer = dealerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer account not found"));
        dealer.setCreditLimit(requireNonNegativeAmount(request.creditLimit(), "creditLimit"));
        Dealer saved = dealerRepository.save(dealer);
        return AdminResponseMapper.toDealerAccountResponse(saved, activeDiscountRules());
    }

    @Transactional
    @CacheEvict(cacheNames = {CacheNames.ADMIN_DASHBOARD, CacheNames.PUBLIC_DEALERS}, allEntries = true)
    public AdminDealerAccountResponse updateDealerAccountStatus(
            Long id,
            UpdateAdminDealerAccountStatusRequest request
    ) {
        Dealer dealer = dealerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer account not found"));
        CustomerStatus previousStatus = dealer.getCustomerStatus();
        DealerAccountStatusTransitionPolicy.assertTransitionAllowed(previousStatus, request.status());
        dealer.setCustomerStatus(request.status());
        // Record suspension timestamp for 24h grace period (BUSINESS_LOGIC.md Section 8.2)
        if (request.status() == CustomerStatus.SUSPENDED
                && previousStatus != CustomerStatus.SUSPENDED) {
            dealer.setSuspendedAt(Instant.now());
        } else if (request.status() != CustomerStatus.SUSPENDED) {
            dealer.setSuspendedAt(null);
        }
        Dealer saved = dealerRepository.save(dealer);
        dealerAccountLifecycleService.notifyDealerStatusChanged(saved, previousStatus);
        return AdminResponseMapper.toDealerAccountResponse(saved, activeDiscountRules());
    }

    @Transactional(readOnly = true)
    public List<AdminStaffUserResponse> getUsers() {
        return adminRepository.findAll().stream()
                .sorted(Comparator.comparing(Admin::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminResponseMapper::toStaffUserResponse)
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public AdminStaffUserResponse createUser(AdminStaffUserUpsertRequest request) {
        String email = AccountValidationSupport.normalizeEmail(request.email());
        if (email == null) {
            throw new BadRequestException("email is required");
        }
        if (accountRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email already exists");
        }
        String name = requireNonBlank(request.name(), "name");
        String roleTitle = requireNonBlank(request.role(), "role");
        String username = adminIdentitySupport.generateUniqueUsername(name, "staff");
        String temporaryPassword = generateTemporaryPassword();

        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(temporaryPassword));
        admin.setDisplayName(name);
        admin.setRoleTitle(roleTitle);
        admin.setUserStatus(request.status() == null ? StaffUserStatus.PENDING : request.status());
        admin.setRequirePasswordChange(Boolean.TRUE);
        admin.setRoles(new HashSet<>(List.of(resolveRole("ADMIN", "Admin role"))));
        Admin saved = adminRepository.save(admin);
        passwordResetService.sendStaffOnboardingLink(saved);
        return AdminResponseMapper.toStaffUserResponse(saved);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));
        if (!passwordEncoder.matches(request.currentPassword(), admin.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        AccountValidationSupport.assertStrongPassword(request.newPassword(), "newPassword");
        admin.setPassword(passwordEncoder.encode(request.newPassword()));
        admin.setRequirePasswordChange(Boolean.FALSE);
        adminRepository.save(admin);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public AdminStaffUserResponse updateUserStatus(Long id, UpdateAdminStaffUserStatusRequest request) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found"));
        admin.setUserStatus(request.status());
        return AdminResponseMapper.toStaffUserResponse(adminRepository.save(admin));
    }
    @Transactional(readOnly = true)
    public List<AdminDiscountRuleResponse> getDiscountRules() {
        return bulkDiscountRepository.findAll().stream()
                .sorted(Comparator.comparing(BulkDiscount::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminResponseMapper::toDiscountRuleResponse)
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public AdminDiscountRuleResponse createDiscountRule(AdminDiscountRuleUpsertRequest request) {
        adminWriteSupport.validateDiscountRuleRequest(request);
        BulkDiscount rule = new BulkDiscount();
        rule.setLabel(requireNonBlank(request.label(), "label"));
        applyDiscountRuleRange(rule, requireNonBlank(request.range(), "range"));
        rule.setDiscountPercent(adminWriteSupport.requirePositivePercent(request.percent()));
        rule.setStatus(request.status() == null ? DiscountRuleStatus.DRAFT : request.status());
        return AdminResponseMapper.toDiscountRuleResponse(bulkDiscountRepository.save(rule));
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public AdminDiscountRuleResponse updateDiscountRuleStatus(Long id, UpdateAdminDiscountRuleStatusRequest request) {
        BulkDiscount rule = bulkDiscountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount rule not found"));
        rule.setStatus(request.status());
        return AdminResponseMapper.toDiscountRuleResponse(bulkDiscountRepository.save(rule));
    }

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.ADMIN_DASHBOARD)
    public AdminDashboardResponse getDashboard() {
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        boolean inventoryAlertsEnabled = adminSettingsService.getEffectiveSettings().inventoryAlerts();
        Instant dashboardStart = YearMonth.now(WarrantyDateSupport.APP_ZONE)
                .minusMonths(5)
                .atDay(1)
                .atStartOfDay(WarrantyDateSupport.APP_ZONE)
                .toInstant();
        List<Order> revenueOrders = orderRepository.findRevenueOrdersFrom(dashboardStart);
        List<AdminDashboardSupport.TopProductStat> topProducts = orderRepository.findTopProductsForDashboard(
                        OrderStatus.COMPLETED,
                        PageRequest.of(0, 5)
                ).stream()
                .map(this::toDashboardTopProductStat)
                .toList();

        return AdminDashboardSupport.buildDashboard(new AdminDashboardSupport.DashboardSnapshot(
                Math.toIntExact(orderRepository.countVisibleOrders()),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.PENDING)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.CONFIRMED)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.SHIPPING)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.COMPLETED)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.CANCELLED)),
                Math.toIntExact(productRepository.countActiveProducts()),
                inventoryAlertsEnabled ? Math.toIntExact(productRepository.countActiveProductsBelowStock(10)) : 0,
                inventoryAlertsEnabled ? Math.toIntExact(productRepository.countActiveProductsBelowStock(5)) : 0,
                Math.toIntExact(dealerRepository.count()),
                Math.toIntExact(dealerRepository.countByCustomerStatus(CustomerStatus.UNDER_REVIEW)),
                Math.toIntExact(adminRepository.count()),
                Math.toIntExact(adminRepository.countByUserStatus(StaffUserStatus.PENDING)),
                Math.toIntExact(productRepository.countActiveProductsByPublishStatus(com.devwonder.backend.entity.enums.PublishStatus.PUBLISHED)),
                Math.toIntExact(productRepository.countActiveProducts() - productRepository.countActiveProductsByPublishStatus(com.devwonder.backend.entity.enums.PublishStatus.PUBLISHED)),
                Math.toIntExact(blogRepository.countActiveByStatus(com.devwonder.backend.entity.enums.BlogStatus.PUBLISHED)),
                Math.toIntExact(blogRepository.countActiveByStatusNot(com.devwonder.backend.entity.enums.BlogStatus.PUBLISHED)),
                Math.toIntExact(bulkDiscountRepository.count()),
                Math.toIntExact(bulkDiscountRepository.countByStatus(DiscountRuleStatus.PENDING)),
                revenueOrders,
                topProducts,
                activeDiscountRules,
                Math.toIntExact(unmatchedPaymentRepository.countByStatus(UnmatchedPaymentStatus.PENDING)),
                Math.toIntExact(financialSettlementRepository.countByStatus(FinancialSettlementStatus.PENDING)),
                Math.toIntExact(orderRepository.countByStaleReviewRequired())
        ));
    }

    private Role resolveRole(String name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            return roleRepository.save(role);
        });
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

    private BigDecimal requireNonNegativeAmount(BigDecimal value, String fieldName) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(fieldName + " must not be negative");
        }
        return value;
    }

    private List<BulkDiscount> activeDiscountRules() {
        return bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
    }

    private void applyDiscountRuleRange(BulkDiscount rule, String rangeLabel) {
        OrderPricingSupport.QuantityRange range = OrderPricingSupport.parseRange(rangeLabel);
        if (range == null) {
            throw new BadRequestException("range is invalid");
        }
        rule.setRangeLabel(OrderPricingSupport.canonicalRangeLabel(range));
        rule.setMinQuantity(range == null ? null : range.min());
        rule.setMaxQuantity(range == null ? null : range.max());
    }

    private AdminDashboardSupport.TopProductStat toDashboardTopProductStat(Object[] row) {
        String name = firstNonBlank(
                row == null || row.length < 2 ? null : valueAsString(row[1]),
                row == null || row.length < 3 ? null : valueAsString(row[2]),
                "Unknown product"
        );
        long units = row == null || row.length < 4 || row[3] == null
                ? 0L
                : ((Number) row[3]).longValue();
        return new AdminDashboardSupport.TopProductStat(name, units);
    }

    private String generateTemporaryPassword() {
        StringBuilder builder = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            int index = SECURE_RANDOM.nextInt(TEMP_PASSWORD_CHARS.length());
            builder.append(TEMP_PASSWORD_CHARS.charAt(index));
        }
        return builder.toString();
    }

    private void applyCompletedAt(Order order, OrderStatus nextStatus, OrderStatus previousStatus) {
        if (order == null || nextStatus == null) {
            return;
        }
        if (nextStatus == OrderStatus.COMPLETED && previousStatus != OrderStatus.COMPLETED) {
            order.setCompletedAt(Instant.now());
            return;
        }
        if (nextStatus != OrderStatus.COMPLETED && previousStatus == OrderStatus.COMPLETED) {
            order.setCompletedAt(null);
        }
    }

    private String valueAsString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private int safeStock(Product product) {
        return product == null || product.getStock() == null ? 0 : Math.max(0, product.getStock());
    }

    private void publishOrderStatusRealtime(Order order, OrderStatus previousStatus) {
        Dealer dealer = order.getDealer();
        if (dealer == null || order.getStatus() == null || order.getStatus() == previousStatus) {
            return;
        }

        String username = firstNonBlank(dealer.getUsername(), dealer.getEmail());
        if (username == null) {
            return;
        }

        webSocketEventPublisher.publishOrderStatusChanged(
                username,
                new DealerOrderStatusEvent(
                        order.getId(),
                        firstNonBlank(order.getOrderCode(), String.valueOf(order.getId())),
                        previousStatus,
                        order.getStatus(),
                        order.getPaymentStatus(),
                        order.getPaidAmount(),
                        order.getUpdatedAt()
                )
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }
}
