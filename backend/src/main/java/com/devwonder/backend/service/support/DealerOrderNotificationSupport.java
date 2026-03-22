package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.service.AdminSettingsService;
import com.devwonder.backend.service.MailService;
import com.devwonder.backend.service.NotificationService;
import java.util.Locale;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerOrderNotificationSupport {

    private static final Logger log = LoggerFactory.getLogger(DealerOrderNotificationSupport.class);

    private final AdminRepository adminRepository;
    private final NotificationService notificationService;
    private final AppMessageSupport appMessageSupport;
    private final MailService mailService;
    private final AdminSettingsService adminSettingsService;

    public void notifyOrderCreated(Dealer dealer, Order order) {
        if (!adminSettingsService.getEffectiveSettings().orderAlerts()) {
            return;
        }
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                appMessageSupport.get("notification.dealer.order.created.title"),
                appMessageSupport.get("notification.dealer.order.created.content", order.getOrderCode()),
                NotifyType.ORDER,
                "/orders/" + order.getOrderCode(),
                null
        ));
        sendOrderConfirmationEmailIfPossible(dealer, order);
    }

    private void sendOrderConfirmationEmailIfPossible(Dealer dealer, Order order) {
        String recipient = normalize(dealer.getEmail());
        if (recipient == null || !mailService.isEnabled()) {
            return;
        }
        try {
            String orderCode = firstNonBlank(order.getOrderCode(), "#" + order.getId());
            String subject = "4ThiTek xác nhận đơn hàng " + orderCode;
            String body = """
                    Xin chào %s,

                    Đơn hàng %s của bạn đã được tiếp nhận thành công.
                    Chúng tôi sẽ xử lý và thông báo cho bạn khi có cập nhật mới.

                    Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của 4ThiTek.

                    Trân trọng,
                    4ThiTek
                    """.formatted(resolveDisplayName(dealer), orderCode);
            mailService.sendText(recipient, subject, body);
        } catch (RuntimeException ex) {
            log.warn("Could not send order confirmation email to {}", normalize(dealer.getEmail()), ex);
        }
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
        return "đối tác";
    }

    public void notifyPaymentRecorded(Dealer dealer, Order order, BigDecimal amount) {
        if (!adminSettingsService.getEffectiveSettings().orderAlerts()) {
            return;
        }
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                appMessageSupport.get("notification.dealer.payment.recorded.title"),
                appMessageSupport.get(
                        "notification.dealer.payment.recorded.content",
                        amount.toPlainString(),
                        order.getOrderCode()
                ),
                NotifyType.ORDER,
                "/orders/" + order.getOrderCode(),
                null
        ));
    }

    public void notifyAdminsDealerCancelled(Order order) {
        if (!adminSettingsService.getEffectiveSettings().orderAlerts()) {
            return;
        }
        if (order == null || order.getId() == null) {
            return;
        }
        Dealer dealer = order.getDealer();
        String dealerName = dealer == null
                ? "Đại lý"
                : firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername(), "Đại lý");
        String orderCode = firstNonBlank(order.getOrderCode(), String.valueOf(order.getId()));
        for (Admin admin : adminRepository.findAll()) {
            if (admin == null || admin.getId() == null) {
                continue;
            }
            if (admin.getUserStatus() != null && admin.getUserStatus() != StaffUserStatus.ACTIVE) {
                continue;
            }
            notificationService.create(new CreateNotifyRequest(
                    admin.getId(),
                    appMessageSupport.get("notification.admin.dealer-cancelled.title"),
                    appMessageSupport.get("notification.admin.dealer-cancelled.content", dealerName, orderCode),
                    NotifyType.ORDER,
                    "/orders/" + order.getId(),
                    null
            ));
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value == null) {
                continue;
            }
            String trimmed = value.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
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
