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
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
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
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.service.support.AdminDashboardSupport;
import com.devwonder.backend.service.support.AdminIdentitySupport;
import com.devwonder.backend.service.support.AdminOrderNotificationSupport;
import com.devwonder.backend.service.support.AdminResponseMapper;
import com.devwonder.backend.service.support.AccountValidationSupport;
import com.devwonder.backend.service.support.AdminWriteSupport;
import com.devwonder.backend.service.support.DealerPaymentSupport;
import com.devwonder.backend.service.support.OrderInventorySupport;
import com.devwonder.backend.service.support.OrderPricingSupport;
import com.devwonder.backend.service.support.OrderStatusTransitionPolicy;
import com.devwonder.backend.service.support.ProductSerialOrderSupport;
import com.devwonder.backend.service.support.ProductSerialResponseMapper;
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
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Value;
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
    private final MailService mailService;
    private final DealerAccountLifecycleService dealerAccountLifecycleService;
    private final AdminWriteSupport adminWriteSupport;
    private final AdminIdentitySupport adminIdentitySupport;
    private final AdminOrderNotificationSupport adminOrderNotificationSupport;
    private final DealerPaymentSupport dealerPaymentSupport;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final OrderInventorySupport orderInventorySupport;
    private final ProductSerialOrderSupport productSerialOrderSupport;

    @Value("${sepay.enabled:false}")
    private boolean sepayEnabled;

    @Transactional(readOnly = true)
    public List<AdminProductResponse> getProducts() {
        Map<Long, Integer> serialCounts = buildSerialCountMap();
        return productRepository.findByIsDeletedFalseOrderByUpdatedAtDesc().stream()
                .map(p -> AdminResponseMapper.toProductResponse(p, serialCounts.getOrDefault(p.getId(), 0)))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<AdminProductResponse> getProducts(Pageable pageable) {
        Map<Long, Integer> serialCounts = buildSerialCountMap();
        return productRepository.findByIsDeletedFalse(pageable)
                .map(p -> AdminResponseMapper.toProductResponse(p, serialCounts.getOrDefault(p.getId(), 0)));
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
        return AdminResponseMapper.toProductResponse(saved, 0);
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
        int availableStock = (int) productSerialRepository.countByProductIdAndDealerIsNullAndStatus(
                saved.getId(), com.devwonder.backend.entity.enums.ProductSerialStatus.AVAILABLE);
        return AdminResponseMapper.toProductResponse(saved, availableStock);
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
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        Pageable effectivePageable = pageable == null || pageable.isUnpaged()
                ? PageRequest.of(0, 100)
                : pageable;
        return orderRepository.findVisibleByCreatedAtDesc(effectivePageable)
                .map(order -> AdminResponseMapper.toOrderResponse(order, activeDiscountRules));
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public AdminOrderResponse updateOrderStatus(Long id, UpdateDealerOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        OrderStatus previousStatus = order.getStatus();
        OrderStatusTransitionPolicy.assertAdminTransitionAllowed(previousStatus, request.status());
        order.setStatus(request.status());
        applyCompletedAt(order, request.status(), previousStatus);
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED) {
            productSerialOrderSupport.releaseNonWarrantySerials(order);
        }
        if (previousStatus == OrderStatus.PENDING && request.status() == OrderStatus.CONFIRMED) {
            List<ProductSerial> reserved = productSerialRepository.findByOrderIdAndStatus(id, ProductSerialStatus.RESERVED);
            reserved.forEach(s -> s.setStatus(ProductSerialStatus.ASSIGNED));
            if (!reserved.isEmpty()) {
                productSerialRepository.saveAll(reserved);
            }
        }
        if (request.status() == OrderStatus.COMPLETED && order.getDealer() != null) {
            List<ProductSerial> orderSerials = productSerialRepository.findByOrderId(id);
            java.util.List<ProductSerial> toUpdate = new java.util.ArrayList<>();
            for (ProductSerial serial : orderSerials) {
                if (serial.getDealer() == null) {
                    serial.setDealer(order.getDealer());
                    serial.setStatus(ProductSerialStatus.AVAILABLE);
                    toUpdate.add(serial);
                }
            }
            if (!toUpdate.isEmpty()) {
                productSerialRepository.saveAll(toUpdate);
            }
        }
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules));
        Order saved = orderRepository.save(order);
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

        List<ProductSerial> toSave = new java.util.ArrayList<>();
        for (AdminAssignOrderSerialsRequest.LineAssignment line : request.assignments()) {
            Long productId = line.productId();
            int ordered = orderedQty.getOrDefault(productId, 0);
            if (ordered <= 0) {
                throw new BadRequestException("Product " + productId + " is not part of this order");
            }
            long existingCount = alreadyAssigned.getOrDefault(productId, 0L);
            if (existingCount + line.serials().size() > ordered) {
                throw new BadRequestException("Serial count for product " + productId + " exceeds ordered quantity");
            }
            for (String serialValue : line.serials()) {
                String normalizedSerial = serialValue.trim().toUpperCase(java.util.Locale.ROOT);
                ProductSerial serial = productSerialRepository.findBySerialIgnoreCase(normalizedSerial)
                        .orElseThrow(() -> new ResourceNotFoundException("Serial not found: " + normalizedSerial));
                if (serial.getDealer() != null) {
                    throw new BadRequestException("Serial " + normalizedSerial + " is already assigned to a dealer");
                }
                if (serial.getStatus() != ProductSerialStatus.AVAILABLE) {
                    throw new BadRequestException("Serial " + normalizedSerial + " is not available");
                }
                if (serial.getProduct() == null || !serial.getProduct().getId().equals(productId)) {
                    throw new BadRequestException("Serial " + normalizedSerial + " does not belong to product " + productId);
                }
                serial.setOrder(order);
                serial.setStatus(ProductSerialStatus.ASSIGNED);
                toSave.add(serial);
            }
        }

        return productSerialRepository.saveAll(toSave).stream()
                .map(ProductSerialResponseMapper::toDealerProductSerialResponse)
                .toList();
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
        dealerPaymentSupport.recordAdminPayment(order, request, sepayEnabled, activeDiscountRules);
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
        dealer.setCustomerStatus(request.status());
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
        String name = requireNonBlank(request.name(), "name");
        String roleTitle = requireNonBlank(request.role(), "role");
        AdminIdentitySupport.UniqueIdentity identity = adminIdentitySupport.generateUniqueIdentity(name, "staff");
        String temporaryPassword = generateTemporaryPassword();

        Admin admin = new Admin();
        admin.setUsername(identity.username());
        admin.setEmail(identity.email());
        admin.setPassword(passwordEncoder.encode(temporaryPassword));
        admin.setDisplayName(name);
        admin.setRoleTitle(roleTitle);
        admin.setUserStatus(request.status() == null ? StaffUserStatus.PENDING : request.status());
        admin.setRequireLoginEmailConfirmation(Boolean.TRUE);
        admin.setRoles(new HashSet<>(List.of(resolveRole("ADMIN", "Admin role"))));
        Admin saved = adminRepository.save(admin);
        sendWelcomeEmailIfPossible(saved, identity.username(), temporaryPassword);
        return AdminResponseMapper.toStaffUserResponse(saved, temporaryPassword);
    }

    private void sendWelcomeEmailIfPossible(Admin admin, String username, String temporaryPassword) {
        String recipient = admin.getEmail();
        if (recipient == null || recipient.isBlank() || !mailService.isEnabled()) {
            return;
        }
        try {
            String subject = "4ThiTek — Tài khoản quản trị của bạn đã được tạo";
            String body = """
                    Xin chào %s,

                    Tài khoản quản trị hệ thống 4ThiTek của bạn đã được tạo thành công.

                    Tên đăng nhập: %s
                    Mật khẩu tạm thời: %s

                    Vui lòng đăng nhập và đổi mật khẩu ngay khi có thể để đảm bảo an toàn tài khoản.

                    Trân trọng,
                    4ThiTek
                    """.formatted(admin.getDisplayName() != null ? admin.getDisplayName() : username, username, temporaryPassword);
            mailService.sendText(recipient, subject, body);
        } catch (RuntimeException ex) {
            log.warn("Could not send welcome email to new staff user {}", username, ex);
        }
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
        admin.setRequireLoginEmailConfirmation(Boolean.FALSE);
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
                Math.toIntExact(productRepository.countActiveProductsBelowStock(10)),
                Math.toIntExact(productRepository.countActiveProductsBelowStock(5)),
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
                activeDiscountRules
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

    private Map<Long, Integer> buildSerialCountMap() {
        Map<Long, Integer> counts = new java.util.HashMap<>();
        for (Object[] row : productSerialRepository.countAvailableGroupByProduct(
                com.devwonder.backend.entity.enums.ProductSerialStatus.AVAILABLE)) {
            Long productId = (Long) row[0];
            Long count = (Long) row[1];
            counts.put(productId, count.intValue());
        }
        return counts;
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
