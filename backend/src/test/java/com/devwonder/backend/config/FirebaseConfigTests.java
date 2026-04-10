package com.devwonder.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.google.firebase.FirebaseApp;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class FirebaseConfigTests {

    private final FirebaseConfig firebaseConfig = new FirebaseConfig();

    @AfterEach
    void deleteApps() {
        for (FirebaseApp app : FirebaseApp.getApps()) {
            app.delete();
        }
    }

    @Test
    void initializesNamedFirebaseAppFromBase64Credentials() throws IOException {
        FirebaseApp app = firebaseConfig.firebaseApp(new FcmProperties(
                true,
                "4thitek-staging",
                null,
                encodedAuthorizedUserCredentials()
        ));

        assertThat(app.getName()).isEqualTo("4thitek-fcm");
        assertThat(app.getOptions().getProjectId()).isEqualTo("4thitek-staging");
    }

    @Test
    void initializesNamedFirebaseAppFromCredentialsPath(@TempDir Path tempDir) throws IOException {
        Path credentialsFile = tempDir.resolve("firebase-authorized-user.json");
        Files.writeString(credentialsFile, authorizedUserCredentials(), StandardCharsets.UTF_8);

        FirebaseApp app = firebaseConfig.firebaseApp(new FcmProperties(
                true,
                "4thitek-prod",
                credentialsFile.toString(),
                null
        ));

        assertThat(app.getName()).isEqualTo("4thitek-fcm");
        assertThat(app.getOptions().getProjectId()).isEqualTo("4thitek-prod");
    }

    @Test
    void rejectsMissingCredentialsConfiguration() {
        assertThatThrownBy(() -> firebaseConfig.firebaseApp(new FcmProperties(
                true,
                "4thitek-prod",
                null,
                null
        )))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("FCM credentials are not configured");
    }

    private String encodedAuthorizedUserCredentials() {
        return Base64.getEncoder().encodeToString(
                authorizedUserCredentials().getBytes(StandardCharsets.UTF_8)
        );
    }

    private String authorizedUserCredentials() {
        return """
                {
                  "type": "authorized_user",
                  "client_id": "test-client-id.apps.googleusercontent.com",
                  "client_secret": "test-client-secret",
                  "refresh_token": "test-refresh-token"
                }
                """;
    }
}
