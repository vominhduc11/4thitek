package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
import com.devwonder.backend.dto.dealer.DealerCartItemResponse;
import com.devwonder.backend.dto.dealer.DealerOrderResponse;
import com.devwonder.backend.dto.dealer.DealerPaymentResponse;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.DealerProfileResponse;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerProfileRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.dto.dealer.UpsertDealerCartItemRequest;
import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerPortalService {

    private final OrderRepository orderRepository;
    private final DealerAccountSupport dealerAccountSupport;
    private final DealerPortalLookupSupport dealerPortalLookupSupport;
    private final DealerProfileWriteSupport dealerProfileWriteSupport;
    private final DealerCartSupport dealerCartSupport;
    private final DealerSerialSupport dealerSerialSupport;
    private final DealerPaymentSupport dealerPaymentSupport;
    private final DealerWarrantySupport dealerWarrantySupport;
    private final DealerNotificationSupport dealerNotificationSupport;
    private final DealerOrderWorkflowSupport dealerOrderWorkflowSupport;

    @Transactional(readOnly = true)
    public DealerProfileResponse getProfile(String username) {
        return DealerPortalResponseMapper.toProfile(dealerPortalLookupSupport.requireDealerByUsername(username));
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
        return orderRepository.findVisibleByDealerIdOrderByCreatedAtDesc(dealer.getId()).stream()
                .map(DealerPortalResponseMapper::toOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DealerOrderResponse> getOrders(String username, Pageable pageable) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return orderRepository.findVisibleByDealerId(dealer.getId(), pageable).map(DealerPortalResponseMapper::toOrderResponse);
    }

    @Transactional(readOnly = true)
    public DealerOrderResponse getOrder(String username, Long orderId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        return DealerPortalResponseMapper.toOrderResponse(order);
    }

    @Transactional
    public DealerOrderResponse createOrder(String username, CreateDealerOrderRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerOrderWorkflowSupport.createOrder(dealer, request);
    }

    @Transactional
    public DealerOrderResponse updateOrderStatus(String username, Long orderId, UpdateDealerOrderStatusRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        return dealerOrderWorkflowSupport.updateOrderStatus(order, request);
    }

    @Transactional(readOnly = true)
    public List<DealerPaymentResponse> getPayments(String username, Long orderId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        return dealerPaymentSupport.getPayments(orderId);
    }

    @Transactional
    public DealerPaymentResponse recordPayment(String username, Long orderId, RecordPaymentRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        return dealerPaymentSupport.recordPayment(dealer, order, request);
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
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        return dealerWarrantySupport.createWarranty(dealer.getId(), request);
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
    public List<DealerProductSerialResponse> importSerials(String username, CreateDealerSerialBatchRequest request) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.resolveDealerOrder(dealer.getId(), request.orderId());
        return dealerSerialSupport.importSerials(
                dealer,
                order,
                dealerPortalLookupSupport.resolveCustomer(request.customerId()),
                request
        );
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

}
