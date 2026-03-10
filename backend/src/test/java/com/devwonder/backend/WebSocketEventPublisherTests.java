package com.devwonder.backend;

import static org.mockito.Mockito.verify;

import com.devwonder.backend.service.WebSocketEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class WebSocketEventPublisherTests {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private WebSocketEventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new WebSocketEventPublisher(messagingTemplate);
    }

    @Test
    void publishesNotificationsToPerUserQueue() {
        Object payload = new Object();

        publisher.publishNotificationCreated("dealer@example.com", payload);

        verify(messagingTemplate).convertAndSendToUser("dealer@example.com", "/queue/notifications", payload);
    }

    @Test
    void publishesOrderStatusToPerUserQueue() {
        Object payload = new Object();

        publisher.publishOrderStatusChanged("dealer@example.com", payload);

        verify(messagingTemplate).convertAndSendToUser("dealer@example.com", "/queue/order-status", payload);
    }

    @Test
    void publishesLoginConfirmedToPerUserQueue() {
        Object payload = new Object();

        publisher.publishLoginConfirmed("dealer@example.com", payload);

        verify(messagingTemplate).convertAndSendToUser("dealer@example.com", "/queue/login-confirmed", payload);
    }

    @Test
    void keepsDealerRegistrationBroadcastAdminTopic() {
        Object payload = new Object();

        publisher.publishDealerRegistrationFromAuth(payload);

        verify(messagingTemplate).convertAndSend("/topic/dealer-registrations", payload);
    }
}
