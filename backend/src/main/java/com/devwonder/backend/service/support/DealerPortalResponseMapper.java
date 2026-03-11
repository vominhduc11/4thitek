package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.DealerCartItemResponse;
import com.devwonder.backend.dto.dealer.DealerOrderItemResponse;
import com.devwonder.backend.dto.dealer.DealerOrderResponse;
import com.devwonder.backend.dto.dealer.DealerPaymentResponse;
import com.devwonder.backend.dto.dealer.DealerProfileResponse;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.DealerCartItem;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductOfCart;
import java.math.BigDecimal;
import java.util.List;

public final class DealerPortalResponseMapper {

    private static final int VAT_PERCENT = 10;

    private DealerPortalResponseMapper() {
    }

    public static DealerProfileResponse toProfile(Dealer dealer) {
        return new DealerProfileResponse(
                dealer.getId(),
                dealer.getBusinessName(),
                dealer.getContactName(),
                dealer.getTaxCode(),
                dealer.getPhone(),
                dealer.getAddressLine(),
                dealer.getWard(),
                dealer.getDistrict(),
                dealer.getCity(),
                dealer.getCountry(),
                dealer.getEmail(),
                dealer.getAvatarUrl(),
                dealer.getSalesPolicy(),
                dealer.getCreditLimit(),
                dealer.getCreatedAt(),
                dealer.getUpdatedAt()
        );
    }

    public static DealerOrderResponse toOrderResponse(Order order) {
        return toOrderResponse(order, List.of());
    }

    public static DealerOrderResponse toOrderResponse(Order order, List<BulkDiscount> rules) {
        List<DealerOrderItemResponse> items = order.getOrderItems() == null
                ? List.of()
                : order.getOrderItems().stream().map(DealerPortalResponseMapper::toOrderItemResponse).toList();
        OrderPricingSupport.PricingBreakdown pricing = OrderPricingSupport.computePricing(order, rules);
        int shippingFee = DealerOrderSupport.safeShippingFee(order.getShippingFee());
        BigDecimal paidAmount = DealerOrderSupport.zeroIfNull(order.getPaidAmount());
        return new DealerOrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getStatus(),
                DealerOrderSupport.defaultPaymentMethod(order),
                order.getPaymentStatus(),
                paidAmount,
                pricing.subtotal(),
                pricing.discountPercent(),
                pricing.discountAmount(),
                VAT_PERCENT,
                pricing.vatAmount(),
                shippingFee,
                pricing.totalAmount(),
                pricing.totalAmount().subtract(paidAmount).max(BigDecimal.ZERO),
                order.getReceiverName(),
                order.getReceiverAddress(),
                order.getReceiverPhone(),
                order.getNote(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                items
        );
    }

    public static DealerPaymentResponse toPaymentResponse(Payment payment) {
        return new DealerPaymentResponse(
                payment.getId(),
                payment.getOrder() == null ? null : payment.getOrder().getId(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getChannel(),
                payment.getTransactionCode(),
                payment.getNote(),
                payment.getProofFileName(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }

    public static DealerCartItemResponse toCartResponse(DealerCartItem item) {
        ProductOfCart productOfCart = item.getProductOfCart();
        Product product = productOfCart == null ? null : productOfCart.getProduct();
        return new DealerCartItemResponse(
                productOfCart == null ? null : productOfCart.getId(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                extractImage(product),
                item.getQuantity(),
                product == null ? null : product.getRetailPrice(),
                productOfCart == null ? null : productOfCart.getPriceSnapshot(),
                productOfCart == null ? null : productOfCart.getNote(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }

    private static DealerOrderItemResponse toOrderItemResponse(OrderItem item) {
        Product product = item.getProduct();
        BigDecimal unitPrice = DealerOrderSupport.zeroIfNull(item.getUnitPrice());
        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
        return new DealerOrderItemResponse(
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                quantity,
                unitPrice,
                unitPrice.multiply(BigDecimal.valueOf(quantity))
        );
    }

    private static String extractImage(Product product) {
        if (product == null || product.getImage() == null || product.getImage().isEmpty()) {
            return null;
        }
        Object imageUrl = product.getImage().get("imageUrl");
        return imageUrl == null ? null : imageUrl.toString();
    }
}
