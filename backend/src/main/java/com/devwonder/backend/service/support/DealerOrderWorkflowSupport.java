package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.DealerOrderResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.dto.realtime.AdminNewOrderEvent;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.WebSocketEventPublisher;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
public class DealerOrderWorkflowSupport {

    private final OrderRepository orderRepository;
    private final OrderInventorySupport orderInventorySupport;
    private final ProductSerialOrderSupport productSerialOrderSupport;
    private final DealerOrderNotificationSupport dealerOrderNotificationSupport;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final FinancialSettlementRepository financialSettlementRepository;

    /**
     * Creates a dealer order and persists the idempotency key on the order record.
     *
     * <p>{@code idempotencyKey} SHOULD be a non-blank, caller-supplied UUID.  A null or blank
     * value is accepted for internal/test scenarios (the field is simply not set on the order),
     * but every production entry point MUST supply a key so that duplicate-request detection
     * works correctly (see BUSINESS_LOGIC.md §3.4).
     *
     * <p>The no-key convenience overload was intentionally removed to prevent silent bypasses:
     * callers that genuinely need key-less order creation must pass an explicit value or
     * generate one with {@code UUID.randomUUID().toString()}.
     */
    public DealerOrderResponse createOrder(
            Dealer dealer,
            CreateDealerOrderRequest request,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules,
            int vatPercent,
            String idempotencyKey
    ) {
        assertBankTransferOnly(request.paymentMethod());
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(DealerOrderSupport.buildOrderCode(dealer.getId()));
        order.setStatus(OrderStatus.PENDING);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            order.setIdempotencyKey(idempotencyKey);
        }
        order.setPaymentMethod(request.paymentMethod());
        order.setIsDeleted(false);
        order.setReceiverName(DealerRequestSupport.defaultIfBlank(request.receiverName(), dealer.getBusinessName()));
        order.setReceiverAddress(DealerRequestSupport.defaultIfBlank(request.receiverAddress(), dealer.getAddressLine()));
        order.setReceiverPhone(DealerRequestSupport.defaultIfBlank(request.receiverPhone(), dealer.getPhone()));
        order.setShippingFee(DealerOrderSupport.resolveDealerShippingFee(request.shippingFee()));
        order.setNote(DealerRequestSupport.normalize(request.note()));
        order.setPaidAmount(BigDecimal.ZERO);

        Map<Long, Integer> requestedQuantities = new LinkedHashMap<>();
        Map<Long, Product> lockedProducts = orderInventorySupport.lockProductsForRequests(request.items());
        Set<OrderItem> items = new LinkedHashSet<>();
        for (CreateDealerOrderItemRequest itemRequest : request.items()) {
            Product product = lockedProducts.get(itemRequest.productId());
            if (product == null) {
                throw new ResourceNotFoundException("Product not found");
            }
            requestedQuantities.merge(product.getId(), itemRequest.quantity(), Integer::sum);
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(DealerOrderSupport.resolveUnitPrice(product));
            items.add(item);
        }
        order.setOrderItems(items);
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules, vatPercent));

        Order saved = orderRepository.save(order);
        orderInventorySupport.reserveStock(requestedQuantities, lockedProducts, saved);
        webSocketEventPublisher.publishAdminNewOrder(new AdminNewOrderEvent(
                saved.getId(),
                saved.getOrderCode(),
                dealer.getId(),
                dealer.getBusinessName(),
                saved.getCreatedAt()
        ));
        dealerOrderNotificationSupport.notifyOrderCreated(dealer, saved);
        return DealerPortalResponseMapper.toOrderResponse(saved, activeDiscountRules, vatPercent);
    }

    public DealerOrderResponse updateOrderStatus(
            Order order,
            UpdateDealerOrderStatusRequest request,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules,
            int vatPercent
    ) {
        OrderStatusTransitionPolicy.assertDealerTransitionAllowed(order.getStatus(), request.status());
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(request.status());
        if (request.status() == OrderStatus.COMPLETED && previousStatus != OrderStatus.COMPLETED) {
            order.setCompletedAt(java.time.Instant.now());
        } else if (request.status() != OrderStatus.COMPLETED && previousStatus == OrderStatus.COMPLETED) {
            order.setCompletedAt(null);
        }
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED) {
            productSerialOrderSupport.releaseNonWarrantySerials(order);
            orderInventorySupport.restoreStock(order);
        }
        BigDecimal paidAmount = DealerOrderSupport.zeroIfNull(order.getPaidAmount());
        if (request.status() == OrderStatus.CANCELLED && paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            order.setPaymentStatus(PaymentStatus.CANCELLED);
        } else {
            order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules, vatPercent));
        }
        // FinancialSettlement: if cancelling with paidAmount > 0, create a CANCELLATION_REFUND record
        if (previousStatus != OrderStatus.CANCELLED
                && request.status() == OrderStatus.CANCELLED
                && paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            order.setFinancialSettlementRequired(Boolean.TRUE);
        }
        Order saved = orderRepository.save(order);
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED) {
            dealerOrderNotificationSupport.notifyAdminsDealerCancelled(saved);
            if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                FinancialSettlement settlement = new FinancialSettlement();
                settlement.setOrder(saved);
                settlement.setType(FinancialSettlementType.CANCELLATION_REFUND);
                settlement.setAmount(paidAmount);
                settlement.setStatus(com.devwonder.backend.entity.enums.FinancialSettlementStatus.PENDING);
                settlement.setCreatedBy(
                        saved.getDealer() != null ? saved.getDealer().getUsername() : "dealer"
                );
                financialSettlementRepository.save(settlement);
                BigDecimal finalPaidAmount = paidAmount;
                Order finalSaved = saved;
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        dealerOrderNotificationSupport.notifyAdminsFinancialSettlementRequired(finalSaved, finalPaidAmount);
                    }
                });
            }
        }
        return DealerPortalResponseMapper.toOrderResponse(saved, activeDiscountRules, vatPercent);
    }

    private void assertBankTransferOnly(PaymentMethod paymentMethod) {
        if (paymentMethod != PaymentMethod.BANK_TRANSFER) {
            throw new BadRequestException("Only BANK_TRANSFER is supported");
        }
    }
}
