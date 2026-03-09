package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.security.JWTUtils;
import java.util.HashMap;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class JWTUtilsTests {

    @Test
    void shortJwtSecretIsDerivedIntoAValidSigningKey() {
        JWTUtils jwtUtils = new JWTUtils("short-secret", 1_800_000L, 6_048_000L);
        UserDetails user = User.withUsername("tester").password("ignored").authorities("ROLE_USER").build();

        String accessToken = jwtUtils.generateToken(user);
        String refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), user);

        assertThat(jwtUtils.extractUsername(accessToken)).isEqualTo("tester");
        assertThat(jwtUtils.extractUsername(refreshToken)).isEqualTo("tester");
        assertThat(jwtUtils.isTokenValid(accessToken, user)).isTrue();
    }

    @Test
    void blankJwtSecretStillFailsFast() {
        assertThatThrownBy(() -> new JWTUtils("   ", 1_800_000L, 6_048_000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Missing JWT secret. Set environment variable JWT_SECRET.");
    }
}
