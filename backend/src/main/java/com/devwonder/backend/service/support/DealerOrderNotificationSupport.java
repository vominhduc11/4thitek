package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.service.NotificationService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerOrderNotificationSupport {

    private final AdminRepository adminRepository;
    private final NotificationService notificationService;

    public void notifyOrderCreated(Dealer dealer, Order order) {
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                "Đơn hàng mới đã được tạo",
                "Don " + order.getOrderCode() + " da duoc ghi nhan tren he thong.",
                NotifyType.ORDER,
                "/orders/" + order.getOrderCode()
        ));
    }

    public void notifyPaymentRecorded(Dealer dealer, Order order, BigDecimal amount) {
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                "Da ghi nhan thanh toan",
                "He thong da ghi nhan thanh toan " + amount.toPlainString() + " cho don " + order.getOrderCode() + ".",
                NotifyType.ORDER,
                "/orders/" + order.getOrderCode()
        ));
    }

    public void notifyAdminsDealerCancelled(Order order) {
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
                    "Dealer đã hủy đơn hàng",
                    dealerName + " vừa hủy đơn " + orderCode + ".",
                    NotifyType.ORDER,
                    "/orders/" + order.getId()
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
}
