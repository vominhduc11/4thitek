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
            log.debug("Push dispatch skipped: enabled={}, firebaseApp={}, accountPresent={}",
                    fcmProperties.enabled(), firebaseApp != null, account != null);
            return;
        }

        List<PushDeviceToken> deviceTokens = pushDeviceTokenRepository.findByAccountIdAndActiveTrue(account.getId());
        if (deviceTokens.isEmpty()) {
            log.info("Push dispatch skipped: no active tokens for account {}", account.getUsername());
            return;
        }

        FirebaseMessaging messaging = FirebaseMessaging.getInstance(firebaseApp);
        int successCount = 0;
        int failedCount = 0;
        for (PushDeviceToken deviceToken : deviceTokens) {
            try {
                messaging.send(buildMessage(deviceToken.getToken(), payload));
                successCount++;
            } catch (FirebaseMessagingException ex) {
                failedCount++;
                if (shouldDeactivateToken(ex)) {
                    deviceToken.setActive(Boolean.FALSE);
                    deviceToken.setLastSeenAt(Instant.now());
                    pushDeviceTokenRepository.save(deviceToken);
                    log.info("Push token deactivated after FCM failure: account={}, token={}, errorCode={}",
                            account.getUsername(), abbreviate(deviceToken.getToken()), ex.getMessagingErrorCode());
                }
                log.warn("Could not send FCM push to account {} token {}: {}",
                        account.getUsername(), abbreviate(deviceToken.getToken()), ex.getMessage());
            } catch (Exception ex) {
                failedCount++;
                log.warn("Unexpected FCM send failure for account {} token {}",
                        account.getUsername(), abbreviate(deviceToken.getToken()), ex);
            }
        }
        log.info(
                "Push dispatch finished: account={}, notificationId={}, successCount={}, failedCount={}",
                account.getUsername(),
                payload.id(),
                successCount,
                failedCount
        );
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
