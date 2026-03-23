package com.devwonder.backend.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class WebSocketEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishNotificationCreated(String username, Object payload) {
        afterCommitOrNow(() -> messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload));
    }

    public void publishOrderStatusChanged(String username, Object payload) {
        afterCommitOrNow(() -> messagingTemplate.convertAndSendToUser(username, "/queue/order-status", payload));
    }

    public void publishLoginConfirmed(String username, Object payload) {
        afterCommitOrNow(() -> messagingTemplate.convertAndSendToUser(username, "/queue/login-confirmed", payload));
    }

    public void publishDealerRegistrationFromAuth(Object payload) {
        afterCommitOrNow(() -> messagingTemplate.convertAndSend("/topic/dealer-registrations", payload));
    }

    public void publishAdminNewOrder(Object payload) {
        afterCommitOrNow(() -> messagingTemplate.convertAndSend("/topic/admin/new-orders", payload));
    }

    public void publishAdminNewSupportTicket(Object payload) {
        afterCommitOrNow(() -> messagingTemplate.convertAndSend("/topic/admin/support-tickets", payload));
    }

    private void afterCommitOrNow(Runnable task) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            task.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                task.run();
            }
        });
    }
}
