package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminBlogResponse;
import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountUpsertRequest;
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
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DealerTier;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
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
import com.devwonder.backend.service.support.AdminWriteSupport;
import com.devwonder.backend.service.support.OrderPricingSupport;
import com.devwonder.backend.service.support.OrderStatusTransitionPolicy;
import com.devwonder.backend.service.support.ProductSerialResponseMapper;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminManagementService {

    private static final String DEFAULT_PASSWORD = "123456";

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
    private final AdminWriteSupport adminWriteSupport;
    private final AdminIdentitySupport adminIdentitySupport;
    private final AdminOrderNotificationSupport adminOrderNotificationSupport;

    @Transactional(readOnly = true)
    public List<AdminProductResponse> getProducts() {
        return productRepository.findAll().stream()
                .sorted(Comparator.comparing(Product::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminResponseMapper::toProductResponse)
                .toList();
    }

    @Transactional
    public AdminProductResponse createProduct(AdminProductUpsertRequest request) {
        Product product = new Product();
        adminWriteSupport.applyProduct(product, request, true);
        return AdminResponseMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public AdminProductResponse updateProduct(Long id, AdminProductUpsertRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        adminWriteSupport.applyProduct(product, request, false);
        return AdminResponseMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsDeleted(true);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getOrders() {
        return orderRepository.findAll().stream()
                .filter(AdminDashboardSupport::isVisibleOrder)
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminResponseMapper::toOrderResponse)
                .toList();
    }

    @Transactional
    public AdminOrderResponse updateOrderStatus(Long id, UpdateDealerOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        OrderStatus previousStatus = order.getStatus();
        OrderStatusTransitionPolicy.assertAdminTransitionAllowed(previousStatus, request.status());
        order.setStatus(request.status());
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order));
        Order saved = orderRepository.save(order);
        adminOrderNotificationSupport.notifyStatusChange(saved, previousStatus);
        return AdminResponseMapper.toOrderResponse(saved);
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        boolean wasVisible = !Boolean.TRUE.equals(order.getIsDeleted());
        order.setIsDeleted(true);
        Order saved = orderRepository.save(order);
        if (wasVisible) {
            adminOrderNotificationSupport.notifyDeletion(saved);
        }
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
    public AdminBlogResponse createBlog(AdminBlogUpsertRequest request) {
        Blog blog = new Blog();
        adminWriteSupport.applyBlog(blog, request, true);
        return AdminResponseMapper.toBlogResponse(blogRepository.save(blog));
    }

    @Transactional
    public AdminBlogResponse updateBlog(Long id, AdminBlogUpsertRequest request) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        adminWriteSupport.applyBlog(blog, request, false);
        return AdminResponseMapper.toBlogResponse(blogRepository.save(blog));
    }

    @Transactional
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
        return dealerRepository.findAll().stream()
                .sorted(Comparator.comparing(Dealer::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminResponseMapper::toDealerAccountResponse)
                .toList();
    }

    @Transactional
    public AdminDealerAccountResponse createDealerAccount(AdminDealerAccountUpsertRequest request) {
        String email = requireNonBlank(request.email(), "email");
        String phone = requireNonBlank(request.phone(), "phone");
        if (accountRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("Email already exists");
        }
        if (dealerRepository.existsByPhoneAndIdNot(phone, -1L)) {
            throw new ConflictException("Phone already exists");
        }

        Dealer dealer = new Dealer();
        String name = requireNonBlank(request.name(), "name");
        dealer.setBusinessName(name);
        dealer.setContactName(name);
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPhone(phone);
        dealer.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        dealer.setDealerTier(request.tier() == null ? DealerTier.GOLD : request.tier());
        dealer.setCustomerStatus(request.status() == null ? CustomerStatus.ACTIVE : request.status());
        dealer.setRoles(new HashSet<>(List.of(resolveRole("USER", "Dealer role"))));
        return AdminResponseMapper.toDealerAccountResponse(dealerRepository.save(dealer));
    }

    @Transactional
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
        return AdminResponseMapper.toDealerAccountResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AdminStaffUserResponse> getUsers() {
        return adminRepository.findAll().stream()
                .sorted(Comparator.comparing(Admin::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminResponseMapper::toStaffUserResponse)
                .toList();
    }

    @Transactional
    public AdminStaffUserResponse createUser(AdminStaffUserUpsertRequest request) {
        String name = requireNonBlank(request.name(), "name");
        String roleTitle = requireNonBlank(request.role(), "role");
        AdminIdentitySupport.UniqueIdentity identity = adminIdentitySupport.generateUniqueIdentity(name, "staff");

        Admin admin = new Admin();
        admin.setUsername(identity.username());
        admin.setEmail(identity.email());
        admin.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        admin.setDisplayName(name);
        admin.setRoleTitle(roleTitle);
        admin.setUserStatus(request.status() == null ? StaffUserStatus.PENDING : request.status());
        admin.setRequireLoginEmailConfirmation(Boolean.TRUE);
        admin.setRoles(new HashSet<>(List.of(resolveRole("ADMIN", "Admin role"))));
        return AdminResponseMapper.toStaffUserResponse(adminRepository.save(admin));
    }

    @Transactional
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
    public AdminDiscountRuleResponse createDiscountRule(AdminDiscountRuleUpsertRequest request) {
        BulkDiscount rule = new BulkDiscount();
        rule.setLabel(requireNonBlank(request.label(), "label"));
        rule.setRangeLabel(requireNonBlank(request.range(), "range"));
        rule.setDiscountPercent(adminWriteSupport.requirePositivePercent(request.percent()));
        rule.setStatus(request.status() == null ? DiscountRuleStatus.DRAFT : request.status());
        return AdminResponseMapper.toDiscountRuleResponse(bulkDiscountRepository.save(rule));
    }

    @Transactional
    public AdminDiscountRuleResponse updateDiscountRuleStatus(Long id, UpdateAdminDiscountRuleStatusRequest request) {
        BulkDiscount rule = bulkDiscountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount rule not found"));
        rule.setStatus(request.status());
        return AdminResponseMapper.toDiscountRuleResponse(bulkDiscountRepository.save(rule));
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        return AdminDashboardSupport.buildDashboard(
                orderRepository.findAll(),
                productRepository.findAll(),
                dealerRepository.findAll(),
                adminRepository.findAll(),
                blogRepository.findAll(),
                bulkDiscountRepository.findAll()
        );
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
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String requireNonBlank(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new BadRequestException(fieldName + " must not be blank");
        }
        return normalized;
    }
}
