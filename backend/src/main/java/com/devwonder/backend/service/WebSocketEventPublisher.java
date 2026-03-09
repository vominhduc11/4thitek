package com.devwonder.backend.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishNotificationCreated(String username, Object payload) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
    }

    public void publishLoginConfirmed(String username, Object payload) {
        messagingTemplate.convertAndSendToUser(username, "/queue/login-confirmed", payload);
    }

    public void publishDealerRegistrationFromAuth(Object payload) {
        messagingTemplate.convertAndSend("/topic/dealer-registrations", payload);
    }
}
