package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.devwonder.backend.security.JWTUtils;
import com.devwonder.backend.service.AdminSettingsService;
import java.util.HashMap;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class JWTUtilsTests {

    @Test
    void shortJwtSecretIsDerivedIntoAValidSigningKey() {
        JWTUtils jwtUtils = new JWTUtils("short-secret", 1_800_000L, 6_048_000L, false, adminSettingsService());
        UserDetails user = User.withUsername("tester").password("ignored").authorities("ROLE_USER").build();

        String accessToken = jwtUtils.generateToken(user);
        String refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), user);

        assertThat(jwtUtils.extractUsername(accessToken)).isEqualTo("tester");
        assertThat(jwtUtils.extractUsername(refreshToken)).isEqualTo("tester");
        assertThat(jwtUtils.extractTokenType(accessToken)).isEqualTo("access");
        assertThat(jwtUtils.extractTokenType(refreshToken)).isEqualTo("refresh");
        assertThat(jwtUtils.isTokenValid(accessToken, user)).isTrue();
        assertThat(jwtUtils.isTokenValid(refreshToken, user, JWTUtils.TokenType.REFRESH)).isTrue();
        assertThat(jwtUtils.isTokenValid(refreshToken, user)).isFalse();
    }

    @Test
    void blankJwtSecretStillFailsFast() {
        assertThatThrownBy(() -> new JWTUtils("   ", 1_800_000L, 6_048_000L, true, adminSettingsService()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Missing JWT secret. Set environment variable JWT_SECRET.");
    }

    @Test
    void shortJwtSecretFailsFastWhenStrongSecretsAreRequired() {
        assertThatThrownBy(() -> new JWTUtils("short-secret", 1_800_000L, 6_048_000L, true, adminSettingsService()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT secret must be at least");
    }

    private AdminSettingsService adminSettingsService() {
        AdminSettingsService settingsService = mock(AdminSettingsService.class);
        when(settingsService.getEffectiveSettings()).thenReturn(new AdminSettingsService.EffectiveAdminSettings(
                true,
                30,
                true,
                true,
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
