package com.devwonder.backend.config;

import com.devwonder.backend.security.JWTUtils;
import com.devwonder.backend.security.OurUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JWTUtils jwtUtils;
    private final OurUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractTokenFromHeaders(accessor);
            if (token == null || token.isBlank()) {
                throw new BadCredentialsException("Authentication required");
            }

            try {
                String username = jwtUtils.extractUsername(token);
                if (username == null || username.isBlank()) {
                    throw new BadCredentialsException("Invalid token subject");
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (!jwtUtils.isTokenValid(token, userDetails)) {
                    throw new BadCredentialsException("Invalid or expired token");
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                accessor.setUser(authentication);
            } catch (Exception ex) {
                log.debug("WebSocket CONNECT authentication failed: {}", ex.getMessage());
                throw new BadCredentialsException("Authentication failed");
            }
        }

        return message;
    }

    private String extractTokenFromHeaders(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader != null && authHeader.startsWith(BEARER_PREFIX) && authHeader.length() > BEARER_PREFIX.length()) {
                return authHeader.substring(BEARER_PREFIX.length());
            }
        }

        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            String token = tokenHeaders.get(0);
            return token == null ? null : token.trim();
        }

        return null;
    }
}
