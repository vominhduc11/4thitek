package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.service.NotificationService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerOrderNotificationSupport {

    private final NotificationService notificationService;

    public void notifyOrderCreated(Dealer dealer, Order order) {
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                "Don hang moi da duoc tao",
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
}
