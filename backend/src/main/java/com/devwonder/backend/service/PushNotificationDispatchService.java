package com.devwonder.backend.service;

import com.devwonder.backend.config.FcmProperties;
import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.PushDeviceToken;
import com.devwonder.backend.repository.PushDeviceTokenRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PushNotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationDispatchService.class);

    private final PushDeviceTokenRepository pushDeviceTokenRepository;
    private final ObjectProvider<FirebaseApp> firebaseAppProvider;
    private final FcmProperties fcmProperties;

    public void sendNotificationCreated(Account account, NotifyResponse payload) {
        FirebaseApp firebaseApp = firebaseAppProvider.getIfAvailable();
        if (!fcmProperties.enabled() || firebaseApp == null || account == null || account.getId() == null) {
            return;
        }

        List<PushDeviceToken> deviceTokens = pushDeviceTokenRepository.findByAccountIdAndActiveTrue(account.getId());
        if (deviceTokens.isEmpty()) {
            return;
        }

        FirebaseMessaging messaging = FirebaseMessaging.getInstance(firebaseApp);
        for (PushDeviceToken deviceToken : deviceTokens) {
            try {
                messaging.send(buildMessage(deviceToken.getToken(), payload));
            } catch (FirebaseMessagingException ex) {
                if (shouldDeactivateToken(ex)) {
                    deviceToken.setActive(Boolean.FALSE);
                    deviceToken.setLastSeenAt(Instant.now());
                    pushDeviceTokenRepository.save(deviceToken);
                }
                log.warn("Could not send FCM push to account {} token {}: {}",
                        account.getUsername(), abbreviate(deviceToken.getToken()), ex.getMessage());
            } catch (Exception ex) {
                log.warn("Unexpected FCM send failure for account {} token {}",
                        account.getUsername(), abbreviate(deviceToken.getToken()), ex);
            }
        }
    }

    private Message buildMessage(String token, NotifyResponse payload) {
        Message.Builder builder = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(nullToEmpty(payload.title()))
                        .setBody(nullToEmpty(payload.body()))
                        .build())
                .putData("noticeId", payload.id() == null ? "" : payload.id().toString())
                .putData("type", payload.type() == null ? "SYSTEM" : payload.type().name())
                .putData("title", nullToEmpty(payload.title()))
                .putData("body", nullToEmpty(payload.body()))
                .putData("link", nullToEmpty(payload.link()))
                .putData("deepLink", nullToEmpty(payload.deepLink()))
                .setAndroidConfig(AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .build())
                .setApnsConfig(ApnsConfig.builder()
                        .putHeader("apns-priority", "10")
                        .setAps(Aps.builder().setSound("default").build())
                        .build());
        return builder.build();
    }

    private boolean shouldDeactivateToken(FirebaseMessagingException ex) {
        MessagingErrorCode errorCode = ex.getMessagingErrorCode();
        return errorCode == MessagingErrorCode.UNREGISTERED
                || errorCode == MessagingErrorCode.INVALID_ARGUMENT
                || errorCode == MessagingErrorCode.SENDER_ID_MISMATCH;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String abbreviate(String token) {
        if (token == null || token.isBlank()) {
            return "(empty)";
        }
        if (token.length() <= 12) {
            return token;
        }
        return token.substring(0, 8) + "..." + token.substring(token.length() - 4);
    }
}
