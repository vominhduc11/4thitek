package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerNotificationSupport {

    private final NotificationService notificationService;
    private final NotifyRepository notifyRepository;

    public java.util.List<NotifyResponse> getNotifications(Long dealerId) {
        return notificationService.getByAccount(dealerId);
    }

    public Page<NotifyResponse> getNotifications(Long dealerId, Pageable pageable) {
        return notificationService.getByAccount(dealerId, pageable);
    }

    public NotifyResponse markNotificationRead(Long dealerId, Long notifyId) {
        Notify notify = requireDealerNotification(dealerId, notifyId);
        return notificationService.markRead(notify.getId());
    }

    public NotifyResponse markNotificationUnread(Long dealerId, Long notifyId) {
        Notify notify = requireDealerNotification(dealerId, notifyId);
        return notificationService.markUnread(notify.getId());
    }

    public int markAllNotificationsRead(Long dealerId) {
        return notificationService.markAllReadByAccount(dealerId);
    }

    private Notify requireDealerNotification(Long dealerId, Long notifyId) {
        return notifyRepository.findByIdAndAccountId(notifyId, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }
}
