package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.config.WebSocketAuthorizationInterceptor;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class WebSocketAuthorizationInterceptorTests {

    private final WebSocketAuthorizationInterceptor interceptor = new WebSocketAuthorizationInterceptor();

    @Test
    void allowsAuthenticatedUserSubscriptionsToOwnQueues() {
        Authentication user = authenticatedUser("dealer@example.com", "DEALER");

        assertThatCode(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/user/queue/notifications", user), null
        )).doesNotThrowAnyException();

        assertThatCode(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/user/queue/order-status", user), null
        )).doesNotThrowAnyException();

        assertThatCode(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/user/queue/login-confirmed", user), null
        )).doesNotThrowAnyException();
    }

    @Test
    void deniesAnonymousSubscriptionsToProtectedQueues() {
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/user/queue/notifications", null), null
        ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");
    }

    @Test
    void deniesLegacyPhysicalQueueSubscriptions() {
        Authentication user = authenticatedUser("dealer@example.com", "DEALER");

        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/queue/notifications-userdealer", user), null
        ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("unknown subscription destination");
    }

    @Test
    void allowsOnlyAdminOrSuperAdminToSubscribeDealerRegistrationTopic() {
        assertThatCode(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/topic/dealer-registrations", authenticatedUser("admin", "ADMIN")),
                null
        )).doesNotThrowAnyException();

        assertThatCode(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/topic/dealer-registrations", authenticatedUser("owner", "SUPER_ADMIN")),
                null
        )).doesNotThrowAnyException();

        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/topic/dealer-registrations", authenticatedUser("dealer", "DEALER")),
                null
        ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only ADMIN or SUPER_ADMIN");
    }

    @Test
    void deniesClientSendFramesEvenForAuthenticatedUsers() {
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SEND, "/app/broadcast", authenticatedUser("admin", "ADMIN")), null
        ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("SEND destinations are not enabled");
    }

    private Message<byte[]> message(StompCommand command, String destination, Authentication authentication) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setSessionId("test-session");
        accessor.setDestination(destination);
        accessor.setUser(authentication);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Authentication authenticatedUser(String username, String... roles) {
        return new UsernamePasswordAuthenticationToken(
                username,
                "n/a",
                Arrays.stream(roles)
                        .map(SimpleGrantedAuthority::new)
                        .toList()
        );
    }
}
