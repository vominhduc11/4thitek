package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
import com.devwonder.backend.dto.dealer.DealerCartItemResponse;
import com.devwonder.backend.dto.dealer.DealerDiscountRuleResponse;
import com.devwonder.backend.dto.dealer.DealerOrderResponse;
import com.devwonder.backend.dto.dealer.DealerPaymentResponse;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.DealerProfileResponse;
import com.devwonder.backend.dto.dealer.RegisterPushTokenRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerProfileRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.dto.dealer.UpsertDealerCartItemRequest;
import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.dto.serial.SerialImportSummaryResponse;
import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.support.DealerAccountSupport;
import com.devwonder.backend.service.support.DealerCartSupport;
import com.devwonder.backend.service.support.DealerNotificationSupport;
import com.devwonder.backend.service.support.DealerPaymentSupport;
import com.devwonder.backend.service.support.DealerPortalLookupSupport;
import com.devwonder.backend.service.support.DealerPortalResponseMapper;
import com.devwonder.backend.service.support.DealerProfileWriteSupport;
import com.devwonder.backend.service.support.DealerOrderWorkflowSupport;
import com.devwonder.backend.service.support.DealerSerialSupport;
import com.devwonder.backend.service.support.DealerWarrantySupport;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerPortalService {

    private final OrderRepository orderRepository;
    private final BulkDiscountRepository bulkDiscountRepository;
    private final DealerAccountSupport dealerAccountSupport;
    private final DealerPortalLookupSupport dealerPortalLookupSupport;
    private final DealerProfileWriteSupport dealerProfileWriteSupport;
    private final DealerCartSupport dealerCartSupport;
    private final DealerSerialSupport dealerSerialSupport;
    private final DealerPaymentSupport dealerPaymentSupport;
    private final DealerWarrantySupport dealerWarrantySupport;
    private final DealerNotificationSupport dealerNotificationSupport;
    private final DealerOrderWorkflowSupport dealerOrderWorkflowSupport;
    private final PushTokenRegistrationService pushTokenRegistrationService;

    @Transactional(readOnly = true)
    public DealerProfileResponse getProfile(String username) {
        return DealerPortalResponseMapper.toProfile(dealerPortalLookupSupport.requireDealerByUsername(username));
    }

    @Transactional(readOnly = true)
    public List<DealerDiscountRuleResponse> getDiscountRules(String username) {
        dealerPortalLookupSupport.requireDealerByUsername(username);
        return bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE).stream()
                .sorted(
                        java.util.Comparator
                                .comparing(
                                        (BulkDiscount rule) -> rule.getProduct() != null && rule.getProduct().getId() != null
                                )
                                .reversed()
                                .thenComparing(
                                        (BulkDiscount rule) -> rule.getMinQuantity() == null ? 0 : rule.getMinQuantity(),
                                        java.util.Comparator.reverseOrder()
                                )
                                .thenComparing(
                                        (BulkDiscount rule) -> rule.getDiscountPercent() == null
                                                ? java.math.BigDecimal.ZERO
                                                : rule.getDiscountPercent(),
                                        java.util.Comparator.reverseOrder()
                                )
                                .thenComparing(BulkDiscount::getUpdatedAt, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()))
                )
                .map(rule -> new DealerDiscountRuleResponse(
                        rule.getProduct() == null ? null : rule.getProduct().getId(),
                        rule.getMinQuantity(),
                        rule.getMaxQuantity(),
                        rule.getDiscountPercent() == null
                                ? 0
                                : rule.getDiscountPercent().setScale(0, java.math.RoundingMode.HALF_UP).intValue(),
                        rule.getRangeLabel()
                ))
                .toList();
    }

    @Transactional
    public DealerProfileResponse updateProfile(String username, UpdateDealerProfileRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        dealerProfileWriteSupport.applyProfileUpdate(dealer, request);
        return DealerPortalResponseMapper.toProfile(dealerProfileWriteSupport.saveProfile(dealer));
    }

    @Transactional(readOnly = true)
    public List<DealerOrderResponse> getOrders(String username) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        var activeDiscountRules = bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
        return orderRepository.findVisibleByDealerIdOrderByCreatedAtDesc(dealer.getId()).stream()
                .map(order -> DealerPortalResponseMapper.toOrderResponse(order, activeDiscountRules))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DealerOrderResponse> getOrders(String username, Pageable pageable) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        var activeDiscountRules = bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
        return orderRepository.findVisibleByDealerId(dealer.getId(), pageable)
                .map(order -> DealerPortalResponseMapper.toOrderResponse(order, activeDiscountRules));
    }

    @Transactional(readOnly = true)
    public DealerOrderResponse getOrder(String username, Long orderId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        return DealerPortalResponseMapper.toOrderResponse(
                order,
                bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE)
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public DealerOrderResponse createOrder(String username, CreateDealerOrderRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsernameForUpdate(username);
        return dealerOrderWorkflowSupport.createOrder(dealer, request, activeDiscountRules());
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public DealerOrderResponse updateOrderStatus(String username, Long orderId, UpdateDealerOrderStatusRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        return dealerOrderWorkflowSupport.updateOrderStatus(order, request, activeDiscountRules());
    }

    @Transactional(readOnly = true)
    public List<DealerPaymentResponse> getPayments(String username, Long orderId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        return dealerPaymentSupport.getPayments(orderId);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public DealerPaymentResponse recordPayment(String username, Long orderId, RecordPaymentRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrderForUpdate(dealer.getId(), orderId);
        return dealerPaymentSupport.recordPayment(dealer, order, request, activeDiscountRules());
    }

    @Transactional(readOnly = true)
    public List<DealerCartItemResponse> getCart(String username) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerCartSupport.getCart(dealer.getId());
    }

    @Transactional
    public DealerCartItemResponse upsertCartItem(String username, UpsertDealerCartItemRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerCartSupport.upsertCartItem(dealer, request);
    }

    @Transactional
    public void removeCartItem(String username, Long productId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        dealerCartSupport.removeCartItem(dealer.getId(), productId);
    }

    @Transactional
    public void clearCart(String username) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        dealerCartSupport.clearCart(dealer.getId());
    }

    @Transactional(readOnly = true)
    public List<NotifyResponse> getNotifications(String username) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerNotificationSupport.getNotifications(dealer.getId());
    }

    @Transactional(readOnly = true)
    public Page<NotifyResponse> getNotifications(String username, Pageable pageable) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerNotificationSupport.getNotifications(dealer.getId(), pageable);
    }

    @Transactional
    public NotifyResponse markNotificationRead(String username, Long notifyId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerNotificationSupport.markNotificationRead(dealer.getId(), notifyId);
    }

    @Transactional
    public NotifyResponse markNotificationUnread(String username, Long notifyId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerNotificationSupport.markNotificationUnread(dealer.getId(), notifyId);
    }

    @Transactional
    public int markAllNotificationsRead(String username) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerNotificationSupport.markAllNotificationsRead(dealer.getId());
    }

    @Transactional
    public void registerPushToken(String username, RegisterPushTokenRequest request) {
        dealerPortalLookupSupport.requireDealerByUsername(username);
        pushTokenRegistrationService.register(username, request);
    }

    @Transactional
    public void unregisterPushToken(String username, String token) {
        dealerPortalLookupSupport.requireDealerByUsername(username);
        pushTokenRegistrationService.unregister(username, token);
    }

    @Transactional(readOnly = true)
    public List<WarrantyRegistrationResponse> getWarranties(String username) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerWarrantySupport.getWarranties(dealer.getId());
    }

    @Transactional(readOnly = true)
    public Page<WarrantyRegistrationResponse> getWarranties(String username, Pageable pageable) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerWarrantySupport.getWarranties(dealer.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public WarrantyRegistrationResponse getWarranty(String username, Long id) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerWarrantySupport.getWarranty(dealer.getId(), id);
    }

    @Transactional
    public WarrantyRegistrationResponse createWarranty(String username, CreateWarrantyRegistrationRequest request) {
        return activateWarranty(username, request);
    }

    @Transactional
    public WarrantyRegistrationResponse activateWarranty(String username, CreateWarrantyRegistrationRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerWarrantySupport.activateWarranty(dealer.getId(), request);
    }

    @Transactional
    public WarrantyRegistrationResponse updateWarranty(String username, Long id, CreateWarrantyRegistrationRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerWarrantySupport.updateWarranty(dealer.getId(), id, request);
    }

    @Transactional
    public void deleteWarranty(String username, Long id) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        dealerWarrantySupport.deleteWarranty(dealer.getId(), id);
    }

    @Transactional(readOnly = true)
    public List<DealerProductSerialResponse> getSerials(String username) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerSerialSupport.getSerials(dealer.getId());
    }

    @Transactional
    public SerialImportSummaryResponse<DealerProductSerialResponse> importSerials(
            String username,
            CreateDealerSerialBatchRequest request
    ) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerSerialSupport.importSerials(dealer.getId(), request);
    }

    @Transactional
    public DealerProductSerialResponse updateSerialStatus(
            String username,
            Long serialId,
            UpdateDealerSerialStatusRequest request
    ) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerSerialSupport.updateSerialStatus(dealer.getId(), serialId, request);
    }

    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        dealerAccountSupport.changePassword(dealer, currentPassword, newPassword);
    }

    private List<BulkDiscount> activeDiscountRules() {
        return bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
    }

}
