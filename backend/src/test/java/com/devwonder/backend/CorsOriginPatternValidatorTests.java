package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.config.CorsOriginPatternValidator;
import java.util.List;
import org.junit.jupiter.api.Test;

class CorsOriginPatternValidatorTests {

    @Test
    void allowsExplicitAndLocalDevPatternsForCredentialedCors() {
        assertThatCode(() -> CorsOriginPatternValidator.validateCredentialedOriginPatterns(
                List.of(
                        "https://admin.4thitek.vn",
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "https://*.4thitek.vn"
                ),
                true
        )).doesNotThrowAnyException();
    }

    @Test
    void rejectsClearlyUnsafeWildcardPatternWhenCredentialsAreEnabled() {
        assertThatThrownBy(() -> CorsOriginPatternValidator.validateCredentialedOriginPatterns(
                List.of("*"),
                true
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Unsafe credentialed CORS origin pattern");

        assertThatThrownBy(() -> CorsOriginPatternValidator.validateCredentialedOriginPatterns(
                List.of("https://*:*"),
                true
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Unsafe credentialed CORS origin pattern");
    }

    @Test
    void skipsUnsafePatternValidationWhenCredentialsAreDisabled() {
        assertThatCode(() -> CorsOriginPatternValidator.validateCredentialedOriginPatterns(
                List.of("*"),
                false
        )).doesNotThrowAnyException();
    }

    @Test
    void parsesCommaSeparatedOriginPatterns() {
        assertThat(CorsOriginPatternValidator.parseAllowedOriginPatterns(
                " https://admin.4thitek.vn, http://localhost:* , "
        )).containsExactly("https://admin.4thitek.vn", "http://localhost:*");
    }
}
