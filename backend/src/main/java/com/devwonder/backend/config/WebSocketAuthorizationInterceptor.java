package com.devwonder.backend.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthorizationInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == null || StompCommand.CONNECT.equals(command) || StompCommand.DISCONNECT.equals(command)) {
            return message;
        }

        if (StompCommand.SEND.equals(command)) {
            handleSendCommand(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribeCommand(accessor);
        }

        return message;
    }

    private void handleSendCommand(StompHeaderAccessor accessor) {
        requireAuthenticated(accessor);
        throw new AccessDeniedException("Client SEND destinations are not enabled");
    }

    private void handleSubscribeCommand(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        Authentication authentication = requireAuthenticated(accessor);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(granted -> "ADMIN".equalsIgnoreCase(granted.getAuthority()));

        if (isUserQueueDestination(destination, "/queue/notifications")) {
            return;
        }

        if (isUserQueueDestination(destination, "/queue/order-status")) {
            return;
        }

        if (isUserQueueDestination(destination, "/queue/login-confirmed")) {
            return;
        }

        if ("/topic/dealer-registrations".equals(destination)) {
            if (!isAdmin) {
                throw new AccessDeniedException("Access denied: Only ADMIN can subscribe to dealer registrations");
            }
            return;
        }

        throw new AccessDeniedException("Access denied to unknown subscription destination: " + destination);
    }

    private Authentication requireAuthenticated(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof Authentication authentication && authentication.isAuthenticated()) {
            return authentication;
        }
        throw new AccessDeniedException("Authentication required");
    }

    private boolean isUserQueueDestination(String destination, String queuePath) {
        if (destination == null) {
            return false;
        }
        return destination.equals("/user" + queuePath)
                || destination.startsWith(queuePath + "-user");
    }
}
