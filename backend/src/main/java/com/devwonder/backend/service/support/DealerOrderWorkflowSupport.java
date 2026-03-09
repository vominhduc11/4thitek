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
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerOrderWorkflowSupport {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final DealerOrderNotificationSupport dealerOrderNotificationSupport;

    public DealerOrderResponse createOrder(Dealer dealer, CreateDealerOrderRequest request) {
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

        Set<OrderItem> items = new LinkedHashSet<>();
        for (CreateDealerOrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(DealerOrderSupport.resolveUnitPrice(itemRequest.unitPrice(), product));
            items.add(item);
        }
        order.setOrderItems(items);
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order));

        Order saved = orderRepository.save(order);
        dealerOrderNotificationSupport.notifyOrderCreated(dealer, saved);
        return DealerPortalResponseMapper.toOrderResponse(saved);
    }

    public DealerOrderResponse updateOrderStatus(Order order, UpdateDealerOrderStatusRequest request) {
        OrderStatusTransitionPolicy.assertDealerTransitionAllowed(order.getStatus(), request.status());
        order.setStatus(request.status());
        if (request.status() == OrderStatus.CANCELLED
                && DealerOrderSupport.zeroIfNull(order.getPaidAmount()).compareTo(BigDecimal.ZERO) <= 0) {
            order.setPaymentStatus(PaymentStatus.CANCELLED);
        } else {
            order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order));
        }
        return DealerPortalResponseMapper.toOrderResponse(orderRepository.save(order));
    }
}
