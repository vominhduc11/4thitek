package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminOrderNotificationSupport {

    private final NotificationService notificationService;

    public void notifyStatusChange(Order order, OrderStatus previousStatus) {
        Dealer dealer = order.getDealer();
        OrderStatus currentStatus = order.getStatus();
        if (dealer == null || currentStatus == null || currentStatus == previousStatus) {
            return;
        }

        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                buildOrderStatusNotificationTitle(currentStatus),
                buildOrderStatusNotificationContent(order, currentStatus),
                NotifyType.ORDER,
                "/orders/" + firstNonBlank(order.getOrderCode(), String.valueOf(order.getId()))
        ));
    }

    public void notifyDeletion(Order order) {
        Dealer dealer = order.getDealer();
        if (dealer == null) {
            return;
        }

        String orderCode = firstNonBlank(order.getOrderCode(), "đơn hàng #" + order.getId());
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                "Đơn hàng đã được gỡ khỏi hệ thống",
                "Don " + orderCode + " không còn hiển thị trên hệ thống. Vui lòng liên hệ admin nếu cần hỗ trợ thêm.",
                NotifyType.ORDER,
                "/orders"
        ));
    }

    private String buildOrderStatusNotificationTitle(OrderStatus status) {
        return switch (status) {
            case PENDING -> "Đơn hàng đang chờ xử lý";
            case CONFIRMED -> "Đơn hàng đã được xác nhận";
            case SHIPPING -> "Đơn hàng đang được giao";
            case COMPLETED -> "Đơn hàng đã hoàn tất";
            case CANCELLED -> "Đơn hàng đã bị hủy";
        };
    }

    private String buildOrderStatusNotificationContent(Order order, OrderStatus status) {
        String orderCode = firstNonBlank(order.getOrderCode(), "đơn hàng #" + order.getId());
        return switch (status) {
            case PENDING -> "Don " + orderCode + " đang chờ admin xử lý.";
            case CONFIRMED -> "Don " + orderCode + " da duoc admin xac nhan va dang duoc chuan bi.";
            case SHIPPING -> "Don " + orderCode + " dang tren duong giao den dai ly.";
            case COMPLETED -> "Don " + orderCode + " da hoan tat. Cam on ban da dat hang.";
            case CANCELLED -> "Don " + orderCode + " đã bị hủy. Vui lòng liên hệ admin nếu cần hỗ trợ thêm.";
        };
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return "";
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
