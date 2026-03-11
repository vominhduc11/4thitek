package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.DealerOrderResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerOrderWorkflowSupport {

    private final OrderRepository orderRepository;
    private final OrderInventorySupport orderInventorySupport;
    private final DealerOrderNotificationSupport dealerOrderNotificationSupport;

    public DealerOrderResponse createOrder(
            Dealer dealer,
            CreateDealerOrderRequest request,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(DealerOrderSupport.buildOrderCode(dealer.getId()));
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(request.paymentMethod());
        order.setIsDeleted(false);
        order.setReceiverName(DealerRequestSupport.defaultIfBlank(request.receiverName(), dealer.getBusinessName()));
        order.setReceiverAddress(DealerRequestSupport.defaultIfBlank(request.receiverAddress(), dealer.getAddressLine()));
        order.setReceiverPhone(DealerRequestSupport.defaultIfBlank(request.receiverPhone(), dealer.getPhone()));
        order.setShippingFee(DealerOrderSupport.safeShippingFee(request.shippingFee()));
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
            item.setUnitPrice(DealerOrderSupport.resolveUnitPrice(itemRequest.unitPrice(), product));
            items.add(item);
        }
        orderInventorySupport.reserveStock(requestedQuantities, lockedProducts);
        order.setOrderItems(items);
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules));
        assertCreditLimitAvailable(dealer, order, activeDiscountRules);

        Order saved = orderRepository.save(order);
        dealerOrderNotificationSupport.notifyOrderCreated(dealer, saved);
        return DealerPortalResponseMapper.toOrderResponse(saved, activeDiscountRules);
    }

    public DealerOrderResponse updateOrderStatus(
            Order order,
            UpdateDealerOrderStatusRequest request,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        OrderStatusTransitionPolicy.assertDealerTransitionAllowed(order.getStatus(), request.status());
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(request.status());
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED) {
            orderInventorySupport.restoreStock(order);
        }
        if (request.status() == OrderStatus.CANCELLED
                && DealerOrderSupport.zeroIfNull(order.getPaidAmount()).compareTo(BigDecimal.ZERO) <= 0) {
            order.setPaymentStatus(PaymentStatus.CANCELLED);
        } else {
            order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order, activeDiscountRules));
        }
        Order saved = orderRepository.save(order);
        if (previousStatus != OrderStatus.CANCELLED && request.status() == OrderStatus.CANCELLED) {
            dealerOrderNotificationSupport.notifyAdminsDealerCancelled(saved);
        }
        return DealerPortalResponseMapper.toOrderResponse(saved, activeDiscountRules);
    }

    private void assertCreditLimitAvailable(
            Dealer dealer,
            Order draftOrder,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        if (draftOrder.getPaymentMethod() != PaymentMethod.DEBT) {
            return;
        }
        BigDecimal creditLimit = zeroIfNull(dealer.getCreditLimit());
        if (creditLimit.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal currentOutstandingDebt = orderRepository
                .findVisibleByDealerIdAndStatusNotAndPaymentMethodOrderByCreatedAtDesc(
                        dealer.getId(),
                        OrderStatus.CANCELLED,
                        PaymentMethod.DEBT
                )
                .stream()
                .map(order -> outstandingAmount(order, activeDiscountRules))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal projectedOutstandingDebt = currentOutstandingDebt.add(outstandingAmount(draftOrder, activeDiscountRules));
        if (projectedOutstandingDebt.compareTo(creditLimit) > 0) {
            throw new BadRequestException("Credit limit exceeded");
        }
    }

    private BigDecimal outstandingAmount(
            Order order,
            List<com.devwonder.backend.entity.BulkDiscount> activeDiscountRules
    ) {
        return OrderPricingSupport.computeTotalAmount(order, activeDiscountRules)
                .subtract(DealerOrderSupport.zeroIfNull(order.getPaidAmount()))
                .max(BigDecimal.ZERO);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
