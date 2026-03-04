package com.devwonder.backend.config;

import com.devwonder.backend.security.JWTUtils;
import com.devwonder.backend.security.OurUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthorizationInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JWTUtils jwtUtils;
    private final OurUserDetailsService userDetailsService;

    @Override
    public @Nullable Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
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
        String destination = accessor.getDestination();
        List<String> userRoles = getUserRoles(accessor);
        boolean isAdmin = userRoles.stream().anyMatch("ADMIN"::equalsIgnoreCase);

        if ("/app/broadcast".equals(destination)) {
            if (!isAdmin) {
                throw new AccessDeniedException("Access denied: Only ADMIN can send broadcast messages");
            }
            return;
        }

        if (destination != null && destination.startsWith("/app/private/")) {
            if (!isAdmin) {
                throw new AccessDeniedException("Access denied: Only ADMIN can send private messages");
            }
            return;
        }

        throw new AccessDeniedException("Access denied to unknown destination: " + destination);
    }

    private void handleSubscribeCommand(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        List<String> userRoles = getUserRoles(accessor);
        boolean isAdmin = userRoles.stream().anyMatch("ADMIN"::equalsIgnoreCase);

        if ("/topic/notifications".equals(destination)) {
            return;
        }

        if (destination != null && (destination.startsWith("/user/queue/private") || destination.contains("/queue/private"))) {
            return;
        }

        if (destination != null && (destination.startsWith("/user/queue/login-confirmed") || destination.contains("/queue/login-confirmed"))) {
            if (!isAdmin) {
                throw new AccessDeniedException("Access denied: Only ADMIN can subscribe to login confirmation queue");
            }
            return;
        }

        if ("/topic/dealer-registrations".equals(destination)) {
            if (!isAdmin) {
                throw new AccessDeniedException("Access denied: Only ADMIN can subscribe to dealer registrations");
            }
            return;
        }

        if ("/topic/order-notifications".equals(destination)) {
            if (!isAdmin) {
                throw new AccessDeniedException("Access denied: Only ADMIN can subscribe to order notifications");
            }
            return;
        }

        throw new AccessDeniedException("Access denied to unknown subscription destination: " + destination);
    }

    private String extractTokenFromHeaders(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader != null && authHeader.startsWith(BEARER_PREFIX) && authHeader.length() > BEARER_PREFIX.length()) {
                return authHeader.substring(BEARER_PREFIX.length());
            }
        }

        return null;
    }

    private List<String> getUserRoles(StompHeaderAccessor accessor) {
        String token = extractTokenFromHeaders(accessor);

        if (token != null && !token.isBlank()) {
            try {
                String username = jwtUtils.extractUsername(token);
                if (username != null && !username.isBlank()) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (jwtUtils.isTokenValid(token, userDetails)) {
                        return userDetails.getAuthorities().stream().map(granted -> granted.getAuthority()).toList();
                    }
                }
            } catch (Exception ex) {
                log.debug("WebSocket role extraction from token failed: {}", ex.getMessage());
            }
        }

        if (accessor.getUser() instanceof Authentication authentication) {
            return authentication.getAuthorities().stream().map(granted -> granted.getAuthority()).toList();
        }

        return List.of();
    }
}
