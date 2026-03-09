package com.devwonder.backend.config;

import lombok.RequiredArgsConstructor;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthenticationInterceptor authenticationInterceptor;
    private final WebSocketAuthorizationInterceptor authorizationInterceptor;

    @Value("${app.cors.allowed-origin-patterns:}")
    private String allowedOriginPatterns;
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for /topic and /queue destinations
        config.enableSimpleBroker("/topic", "/queue");

        // Set application destination prefix
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register SockJS endpoint with WebSocket fallback
        // Direct connection via reverse proxy (not through API Gateway)
        // Allowed origins configured from env-backed application properties
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(parseAllowedOrigins())
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add JWT authentication interceptor for STOMP CONNECT frames
        // Enforce destination-level authorization for client subscriptions
        registration.interceptors(authenticationInterceptor, authorizationInterceptor);
    }

    private String[] parseAllowedOrigins() {
        return Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toArray(String[]::new);
    }
}

