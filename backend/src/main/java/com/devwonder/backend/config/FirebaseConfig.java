package com.devwonder.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class FirebaseConfig {

    @Bean
    @ConditionalOnProperty(prefix = "app.fcm", name = "enabled", havingValue = "true")
    FirebaseApp firebaseApp(FcmProperties properties) throws IOException {
        GoogleCredentials credentials = readCredentials(properties);
        FirebaseOptions.Builder builder = FirebaseOptions.builder().setCredentials(credentials);
        if (StringUtils.hasText(properties.projectId())) {
            builder.setProjectId(properties.projectId().trim());
        }
        FirebaseOptions options = builder.build();
        for (FirebaseApp existingApp : FirebaseApp.getApps()) {
            if ("4thitek-fcm".equals(existingApp.getName())) {
                return existingApp;
            }
            if (FirebaseApp.DEFAULT_APP_NAME.equals(existingApp.getName()) && !StringUtils.hasText(properties.projectId())) {
                return existingApp;
            }
        }
        if (FirebaseApp.getApps().isEmpty() && !StringUtils.hasText(properties.projectId())) {
            return FirebaseApp.initializeApp(options);
        }
        return FirebaseApp.initializeApp(options, "4thitek-fcm");
    }

    private GoogleCredentials readCredentials(FcmProperties properties) throws IOException {
        if (StringUtils.hasText(properties.credentialsPath())) {
            try (InputStream inputStream = Files.newInputStream(Path.of(properties.credentialsPath().trim()))) {
                return GoogleCredentials.fromStream(inputStream);
            }
        }
        if (StringUtils.hasText(properties.credentialsJsonBase64())) {
            byte[] decoded = Base64.getDecoder().decode(properties.credentialsJsonBase64().trim());
            try (InputStream inputStream = new ByteArrayInputStream(decoded)) {
                return GoogleCredentials.fromStream(inputStream);
            }
        }
        throw new IllegalStateException("FCM credentials are not configured");
    }
}
