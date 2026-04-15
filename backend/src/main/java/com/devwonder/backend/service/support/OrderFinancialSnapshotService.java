package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.repository.OrderRepository;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OrderFinancialSnapshotService {

    private final OrderRepository orderRepository;

    public OrderFinancialSnapshotService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public OrderPricingSupport.PricingBreakdown ensureSnapshot(
            Order order,
            List<BulkDiscount> activeDiscountRules,
            int vatPercent
    ) {
        if (order == null) {
            return OrderPricingSupport.computePricing(order, activeDiscountRules, vatPercent);
        }
        if (OrderPricingSupport.hasPricingSnapshot(order)) {
            return OrderPricingSupport.computePricing(order, activeDiscountRules, vatPercent);
        }
        OrderPricingSupport.PricingBreakdown computed =
                OrderPricingSupport.computePricingWithoutSnapshot(order, activeDiscountRules, vatPercent);
        OrderPricingSupport.applyPricingSnapshot(order, computed);
        if (order.getId() != null) {
            orderRepository.save(order);
        }
        return computed;
    }

    public void ensureSnapshots(
            Iterable<Order> orders,
            List<BulkDiscount> activeDiscountRules,
            int vatPercent
    ) {
        if (orders == null) {
            return;
        }
        for (Order order : orders) {
            ensureSnapshot(order, activeDiscountRules, vatPercent);
        }
    }
}
