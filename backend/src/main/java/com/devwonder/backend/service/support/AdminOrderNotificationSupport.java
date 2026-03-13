package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.service.MailService;
import com.devwonder.backend.service.NotificationService;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminOrderNotificationSupport {

    private static final Logger log = LoggerFactory.getLogger(AdminOrderNotificationSupport.class);

    private final NotificationService notificationService;
    private final MailService mailService;
    private final AppMessageSupport appMessageSupport;

    public void notifyStatusChange(Order order, OrderStatus previousStatus) {
        Dealer dealer = order.getDealer();
        OrderStatus currentStatus = order.getStatus();
        if (dealer == null || currentStatus == null || currentStatus == previousStatus) {
            return;
        }

        String title = buildOrderStatusNotificationTitle(currentStatus);
        String content = buildOrderStatusNotificationContent(order, currentStatus);
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                title,
                content,
                NotifyType.ORDER,
                "/orders/" + firstNonBlank(order.getOrderCode(), String.valueOf(order.getId()))
        ));
        sendStatusEmailIfPossible(dealer, order, currentStatus);
    }

    public void notifyDeletion(Order order) {
        Dealer dealer = order.getDealer();
        if (dealer == null) {
            return;
        }

        String orderCode = firstNonBlank(order.getOrderCode(), "đơn hàng #" + order.getId());
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                appMessageSupport.get("notification.order.deleted.title"),
                appMessageSupport.get("notification.order.deleted.content", orderCode),
                NotifyType.ORDER,
                "/orders"
        ));
    }

    private String buildOrderStatusNotificationTitle(OrderStatus status) {
        return appMessageSupport.get("notification.order.status.%s.title".formatted(status.name().toLowerCase(Locale.ROOT)));
    }

    private String buildOrderStatusNotificationContent(Order order, OrderStatus status) {
        String orderCode = firstNonBlank(order.getOrderCode(), "đơn hàng #" + order.getId());
        return appMessageSupport.get(
                "notification.order.status.%s.content".formatted(status.name().toLowerCase(Locale.ROOT)),
                orderCode
        );
    }

    private void sendStatusEmailIfPossible(Dealer dealer, Order order, OrderStatus status) {
        String recipient = normalize(dealer.getEmail());
        if (recipient == null || !mailService.isEnabled()) {
            return;
        }

        try {
            mailService.sendText(
                    recipient,
                    buildOrderStatusEmailSubject(order, status),
                    buildOrderStatusEmailBody(dealer, order, status)
            );
        } catch (RuntimeException ex) {
            log.warn("Could not send order status email to {}", recipient, ex);
        }
    }

    private String buildOrderStatusEmailSubject(Order order, OrderStatus status) {
        String orderCode = firstNonBlank(order.getOrderCode(), "#" + order.getId());
        return "4ThiTek cập nhật đơn hàng " + orderCode + ": " + buildOrderStatusLabel(status);
    }

    private String buildOrderStatusEmailBody(Dealer dealer, Order order, OrderStatus status) {
        String orderCode = firstNonBlank(order.getOrderCode(), "#" + order.getId());
        return """
                Xin chào %s,

                Đơn hàng %s của bạn vừa được cập nhật.
                Trạng thái hiện tại: %s.

                %s

                Trân trọng,
                4ThiTek
                """.formatted(
                resolveDisplayName(dealer),
                orderCode,
                buildOrderStatusLabel(status),
                buildOrderStatusNotificationContent(order, status)
        );
    }

    private String buildOrderStatusLabel(OrderStatus status) {
        return switch (status) {
            case PENDING -> "Chờ xử lý";
            case CONFIRMED -> "Đã xác nhận";
            case SHIPPING -> "Đang giao";
            case COMPLETED -> "Hoàn tất";
            case CANCELLED -> "Đã hủy";
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

    private String resolveDisplayName(Dealer dealer) {
        String contactName = normalize(dealer.getContactName());
        if (contactName != null) {
            return contactName;
        }
        String businessName = normalize(dealer.getBusinessName());
        if (businessName != null) {
            return businessName;
        }
        String email = normalize(dealer.getEmail());
        if (email != null) {
            return email;
        }
        return "đối tác";
    }
}
