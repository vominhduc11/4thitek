package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.devwonder.backend.config.WebSocketAuthenticationInterceptor;
import com.devwonder.backend.security.JWTUtils;
import com.devwonder.backend.security.OurUserDetailsService;
import com.devwonder.backend.service.AdminSettingsService;
import java.util.HashMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class WebSocketAuthenticationInterceptorTokenTypeTests {

    private static final String TEST_SECRET = "0123456789abcdef0123456789abcdef";

    private WebSocketAuthenticationInterceptor interceptor;
    private JWTUtils jwtUtils;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtUtils = new JWTUtils(TEST_SECRET, 1_800_000L, 6_048_000L, true, adminSettingsService());
        userDetails = User.withUsername("dealer@example.com")
                .password("ignored")
                .authorities("DEALER")
                .build();

        OurUserDetailsService userDetailsService = mock(OurUserDetailsService.class);
        when(userDetailsService.loadUserByUsername("dealer@example.com")).thenReturn(userDetails);

        interceptor = new WebSocketAuthenticationInterceptor(jwtUtils, userDetailsService);
    }

    @Test
    void stompConnectAcceptsAccessTokens() {
        Message<?> message = connectMessage("Bearer " + jwtUtils.generateToken(userDetails));

        Message<?> intercepted = interceptor.preSend(message, null);
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(intercepted);

        assertThat(accessor.getUser()).isNotNull();
        assertThat(accessor.getUser().getName()).isEqualTo("dealer@example.com");
    }

    @Test
    void stompConnectRejectsRefreshTokens() {
        String refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), userDetails);

        assertThatThrownBy(() -> interceptor.preSend(connectMessage("Bearer " + refreshToken), null))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Authentication failed");
    }

    private Message<byte[]> connectMessage(String authorizationHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setSessionId("test-session");
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", authorizationHeader);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private AdminSettingsService adminSettingsService() {
        AdminSettingsService settingsService = mock(AdminSettingsService.class);
        when(settingsService.getEffectiveSettings()).thenReturn(new AdminSettingsService.EffectiveAdminSettings(
                true,
                30,
                true,
                true,
                10,
                new AdminSettingsService.SepayRuntimeSettings(false, null, null, null, null),
                new AdminSettingsService.EmailRuntimeSettings(false, null, null),
                new AdminSettingsService.RateLimitRuntimeSettings(
                        false,
                        new AdminSettingsService.RateLimitBucketRuntimeSettings(10, 60),
                        new AdminSettingsService.RateLimitBucketRuntimeSettings(5, 300),
                        new AdminSettingsService.RateLimitBucketRuntimeSettings(30, 60),
                        new AdminSettingsService.RateLimitBucketRuntimeSettings(20, 60),
                        new AdminSettingsService.RateLimitBucketRuntimeSettings(120, 60)
                )
        ));
        return settingsService;
    }
}
