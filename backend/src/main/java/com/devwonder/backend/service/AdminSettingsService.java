package com.devwonder.backend.service;

import com.devwonder.backend.config.AppMailProperties;
import com.devwonder.backend.config.RateLimitProperties;
import com.devwonder.backend.config.SepayProperties;
import com.devwonder.backend.dto.admin.AdminSettingsResponse;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.entity.AdminSettings;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.FieldValidationException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.devwonder.backend.repository.AdminSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminSettingsService {

    private static final Logger log = LoggerFactory.getLogger(AdminSettingsService.class);
    private static final int DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
    private static final int MIN_SESSION_TIMEOUT_MINUTES = 5;
    private static final int MAX_SESSION_TIMEOUT_MINUTES = 480;
    private static final int DEFAULT_AUTH_REQUESTS = 10;
    private static final long DEFAULT_AUTH_WINDOW_SECONDS = 60L;
    private static final int DEFAULT_PASSWORD_RESET_REQUESTS = 5;
    private static final long DEFAULT_PASSWORD_RESET_WINDOW_SECONDS = 300L;
    private static final int DEFAULT_WARRANTY_LOOKUP_REQUESTS = 30;
    private static final long DEFAULT_WARRANTY_LOOKUP_WINDOW_SECONDS = 60L;
    private static final int DEFAULT_UPLOAD_REQUESTS = 20;
    private static final long DEFAULT_UPLOAD_WINDOW_SECONDS = 60L;
    private static final int DEFAULT_WEBHOOK_REQUESTS = 120;
    private static final long DEFAULT_WEBHOOK_WINDOW_SECONDS = 60L;

    private final AdminSettingsRepository adminSettingsRepository;
    private final SepayProperties sepayProperties;
    private final AppMailProperties appMailProperties;
    private final RateLimitProperties rateLimitProperties;

    private volatile EffectiveAdminSettings cachedEffectiveSettings;

    @Transactional
    public AdminSettingsResponse getSettings() {
        AdminSettings settings = getOrCreateSettings();
        EffectiveAdminSettings effectiveSettings = toEffectiveSettings(settings);
        cachedEffectiveSettings = effectiveSettings;
        return toResponse(settings, effectiveSettings);
    }

    @Transactional
    public AdminSettingsResponse updateSettings(UpdateAdminSettingsRequest request) {
        AdminSettings settings = getOrCreateSettings();
        if (request.emailConfirmation() != null) {
            settings.setEmailConfirmation(request.emailConfirmation());
        }
        if (request.sessionTimeoutMinutes() != null) {
            int timeout = request.sessionTimeoutMinutes();
            if (timeout < MIN_SESSION_TIMEOUT_MINUTES || timeout > MAX_SESSION_TIMEOUT_MINUTES) {
                throw new BadRequestException("sessionTimeoutMinutes must be between 5 and 480");
            }
            settings.setSessionTimeoutMinutes(timeout);
        }
        if (request.orderAlerts() != null) {
            settings.setOrderAlerts(request.orderAlerts());
        }
        if (request.inventoryAlerts() != null) {
            settings.setInventoryAlerts(request.inventoryAlerts());
        }
        applySepaySettings(settings, request.sepay());
        applyEmailSettings(settings, request.emailSettings());
        applyRateLimitSettings(settings, request.rateLimitOverrides());
        validateDependentSettings(settings);
        AdminSettings savedSettings = adminSettingsRepository.save(settings);
        EffectiveAdminSettings effectiveSettings = toEffectiveSettings(savedSettings);
        cachedEffectiveSettings = effectiveSettings;
        return toResponse(savedSettings, effectiveSettings);
    }

    public EffectiveAdminSettings getEffectiveSettings() {
        EffectiveAdminSettings cached = cachedEffectiveSettings;
        if (cached != null) {
            return cached;
        }
        synchronized (this) {
            if (cachedEffectiveSettings == null) {
                cachedEffectiveSettings = toEffectiveSettings(adminSettingsRepository.findFirstByOrderByIdAsc().orElse(null));
            }
            return cachedEffectiveSettings;
        }
    }

    /**
     * Fails fast at startup if SePay is enabled at the environment level but any required
     * environment variable is missing. This prevents silent use of unconfigured bank details.
     *
     * <p>Required when {@code SEPAY_ENABLED=true}:
     * {@code SEPAY_WEBHOOK_TOKEN}, {@code SEPAY_BANK_NAME},
     * {@code SEPAY_ACCOUNT_NUMBER}, {@code SEPAY_ACCOUNT_HOLDER}.
     */
    @EventListener(ApplicationReadyEvent.class)
    void validateSepayConfigOnStartup() {
        if (!sepayProperties.enabled()) {
            return;
        }
        List<String> missing = new ArrayList<>();
        if (normalize(sepayProperties.webhookToken()) == null) missing.add("SEPAY_WEBHOOK_TOKEN");
        if (normalize(sepayProperties.bankName()) == null)    missing.add("SEPAY_BANK_NAME");
        if (normalize(sepayProperties.accountNumber()) == null) missing.add("SEPAY_ACCOUNT_NUMBER");
        if (normalize(sepayProperties.accountHolder()) == null) missing.add("SEPAY_ACCOUNT_HOLDER");
        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "SEPAY_ENABLED=true but required environment variables are not configured: "
                    + String.join(", ", missing)
                    + ". Set these variables or set SEPAY_ENABLED=false."
            );
        }
        log.info("SePay configuration validated successfully.");
    }

    public SepayRuntimeSettings getSepaySettings() {
        return getEffectiveSettings().sepay();
    }

    public EmailRuntimeSettings getEmailSettings() {
        return getEffectiveSettings().emailSettings();
    }

    public RateLimitRuntimeSettings getRateLimitSettings() {
        return getEffectiveSettings().rateLimitOverrides();
    }

    private AdminSettings getOrCreateSettings() {
        return adminSettingsRepository.findFirstByOrderByIdAsc().orElseGet(() -> adminSettingsRepository.save(defaultSettings()));
    }

    private AdminSettings defaultSettings() {
        AdminSettings settings = new AdminSettings();
        settings.setEmailConfirmation(true);
        settings.setSessionTimeoutMinutes(DEFAULT_SESSION_TIMEOUT_MINUTES);
        settings.setOrderAlerts(true);
        settings.setInventoryAlerts(true);
        settings.setSepayEnabled(sepayProperties.enabled());
        settings.setSepayWebhookToken(normalize(sepayProperties.webhookToken()));
        settings.setSepayBankName(normalize(sepayProperties.bankName()));
        settings.setSepayAccountNumber(normalize(sepayProperties.accountNumber()));
        settings.setSepayAccountHolder(normalize(sepayProperties.accountHolder()));
        settings.setMailEnabled(appMailProperties.enabled());
        settings.setMailFrom(normalize(appMailProperties.from()));
        settings.setMailFromName(normalize(appMailProperties.fromName()));
        settings.setRateLimitEnabled(rateLimitProperties.enabled());
        settings.setRateLimitAuthRequests(configuredIntOrDefault(rateLimitProperties.authRequests(), DEFAULT_AUTH_REQUESTS));
        settings.setRateLimitAuthWindowSeconds(configuredLongOrDefault(rateLimitProperties.authWindowSeconds(), DEFAULT_AUTH_WINDOW_SECONDS));
        settings.setRateLimitPasswordResetRequests(configuredIntOrDefault(
                rateLimitProperties.passwordResetRequests(),
                DEFAULT_PASSWORD_RESET_REQUESTS
        ));
        settings.setRateLimitPasswordResetWindowSeconds(configuredLongOrDefault(
                rateLimitProperties.passwordResetWindowSeconds(),
                DEFAULT_PASSWORD_RESET_WINDOW_SECONDS
        ));
        settings.setRateLimitWarrantyLookupRequests(configuredIntOrDefault(
                rateLimitProperties.warrantyLookupRequests(),
                DEFAULT_WARRANTY_LOOKUP_REQUESTS
        ));
        settings.setRateLimitWarrantyLookupWindowSeconds(configuredLongOrDefault(
                rateLimitProperties.warrantyLookupWindowSeconds(),
                DEFAULT_WARRANTY_LOOKUP_WINDOW_SECONDS
        ));
        settings.setRateLimitUploadRequests(configuredIntOrDefault(rateLimitProperties.uploadRequests(), DEFAULT_UPLOAD_REQUESTS));
        settings.setRateLimitUploadWindowSeconds(configuredLongOrDefault(
                rateLimitProperties.uploadWindowSeconds(),
                DEFAULT_UPLOAD_WINDOW_SECONDS
        ));
        settings.setRateLimitWebhookRequests(configuredIntOrDefault(rateLimitProperties.webhookRequests(), DEFAULT_WEBHOOK_REQUESTS));
        settings.setRateLimitWebhookWindowSeconds(configuredLongOrDefault(
                rateLimitProperties.webhookWindowSeconds(),
                DEFAULT_WEBHOOK_WINDOW_SECONDS
        ));
        return settings;
    }

    private void applySepaySettings(AdminSettings settings, UpdateAdminSettingsRequest.SepaySettings request) {
        if (request == null) {
            return;
        }
        if (request.enabled() != null) {
            settings.setSepayEnabled(request.enabled());
        }
        if (request.webhookToken() != null) {
            settings.setSepayWebhookToken(normalize(request.webhookToken()));
        }
        if (request.bankName() != null) {
            settings.setSepayBankName(normalize(request.bankName()));
        }
        if (request.accountNumber() != null) {
            settings.setSepayAccountNumber(normalize(request.accountNumber()));
        }
        if (request.accountHolder() != null) {
            settings.setSepayAccountHolder(normalize(request.accountHolder()));
        }
    }

    private void applyEmailSettings(AdminSettings settings, UpdateAdminSettingsRequest.EmailSettings request) {
        if (request == null) {
            return;
        }
        if (request.enabled() != null) {
            settings.setMailEnabled(request.enabled());
        }
        if (request.from() != null) {
            settings.setMailFrom(normalize(request.from()));
        }
        if (request.fromName() != null) {
            settings.setMailFromName(normalize(request.fromName()));
        }
    }

    private void applyRateLimitSettings(AdminSettings settings, UpdateAdminSettingsRequest.RateLimitSettings request) {
        if (request == null) {
            return;
        }
        if (request.enabled() != null) {
            settings.setRateLimitEnabled(request.enabled());
        }
        applyRateLimitBucket(
                settings,
                request.auth(),
                "rateLimitOverrides.auth",
                AdminSettings::setRateLimitAuthRequests,
                AdminSettings::setRateLimitAuthWindowSeconds
        );
        applyRateLimitBucket(
                settings,
                request.passwordReset(),
                "rateLimitOverrides.passwordReset",
                AdminSettings::setRateLimitPasswordResetRequests,
                AdminSettings::setRateLimitPasswordResetWindowSeconds
        );
        applyRateLimitBucket(
                settings,
                request.warrantyLookup(),
                "rateLimitOverrides.warrantyLookup",
                AdminSettings::setRateLimitWarrantyLookupRequests,
                AdminSettings::setRateLimitWarrantyLookupWindowSeconds
        );
        applyRateLimitBucket(
                settings,
                request.upload(),
                "rateLimitOverrides.upload",
                AdminSettings::setRateLimitUploadRequests,
                AdminSettings::setRateLimitUploadWindowSeconds
        );
        applyRateLimitBucket(
                settings,
                request.webhook(),
                "rateLimitOverrides.webhook",
                AdminSettings::setRateLimitWebhookRequests,
                AdminSettings::setRateLimitWebhookWindowSeconds
        );
    }

    private void applyRateLimitBucket(
            AdminSettings settings,
            UpdateAdminSettingsRequest.RateLimitBucket bucket,
            String fieldPrefix,
            java.util.function.BiConsumer<AdminSettings, Integer> requestsSetter,
            java.util.function.BiConsumer<AdminSettings, Long> windowSetter
    ) {
        if (bucket == null) {
            return;
        }
        if (bucket.requests() != null) {
            validatePositive(bucket.requests(), fieldPrefix + ".requests");
            requestsSetter.accept(settings, bucket.requests());
        }
        if (bucket.windowSeconds() != null) {
            validatePositive(bucket.windowSeconds(), fieldPrefix + ".windowSeconds");
            windowSetter.accept(settings, bucket.windowSeconds());
        }
    }

    private void validateDependentSettings(AdminSettings settings) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (Boolean.TRUE.equals(settings.getSepayEnabled())) {
            requireConfigured(settings.getSepayWebhookToken(), "sepay.webhookToken", errors);
            requireConfigured(settings.getSepayBankName(), "sepay.bankName", errors);
            requireConfigured(settings.getSepayAccountNumber(), "sepay.accountNumber", errors);
            requireConfigured(settings.getSepayAccountHolder(), "sepay.accountHolder", errors);
        }
        if (Boolean.TRUE.equals(settings.getMailEnabled())) {
            requireConfigured(settings.getMailFrom(), "emailSettings.from", errors);
            requireConfigured(settings.getMailFromName(), "emailSettings.fromName", errors);
        }
        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }
    }

    private void requireConfigured(String value, String field, Map<String, String> errors) {
        if (normalize(value) == null) {
            errors.put(field, field + " is required when enabled");
        }
    }

    private EffectiveAdminSettings toEffectiveSettings(AdminSettings settings) {
        return new EffectiveAdminSettings(
                booleanOrDefault(settings == null ? null : settings.getEmailConfirmation(), true),
                intOrDefault(settings == null ? null : settings.getSessionTimeoutMinutes(), DEFAULT_SESSION_TIMEOUT_MINUTES),
                booleanOrDefault(settings == null ? null : settings.getOrderAlerts(), true),
                booleanOrDefault(settings == null ? null : settings.getInventoryAlerts(), true),
                new SepayRuntimeSettings(
                        booleanOrDefault(settings == null ? null : settings.getSepayEnabled(), sepayProperties.enabled()),
                        stringOrDefault(settings == null ? null : settings.getSepayWebhookToken(), normalize(sepayProperties.webhookToken())),
                        stringOrDefault(settings == null ? null : settings.getSepayBankName(), normalize(sepayProperties.bankName())),
                        stringOrDefault(settings == null ? null : settings.getSepayAccountNumber(), normalize(sepayProperties.accountNumber())),
                        stringOrDefault(settings == null ? null : settings.getSepayAccountHolder(), normalize(sepayProperties.accountHolder()))
                ),
                new EmailRuntimeSettings(
                        booleanOrDefault(settings == null ? null : settings.getMailEnabled(), appMailProperties.enabled()),
                        stringOrDefault(settings == null ? null : settings.getMailFrom(), normalize(appMailProperties.from())),
                        stringOrDefault(settings == null ? null : settings.getMailFromName(), normalize(appMailProperties.fromName()))
                ),
                new RateLimitRuntimeSettings(
                        booleanOrDefault(settings == null ? null : settings.getRateLimitEnabled(), rateLimitProperties.enabled()),
                        rateLimitBucket(
                                settings == null ? null : settings.getRateLimitAuthRequests(),
                                settings == null ? null : settings.getRateLimitAuthWindowSeconds(),
                                configuredIntOrDefault(rateLimitProperties.authRequests(), DEFAULT_AUTH_REQUESTS),
                                configuredLongOrDefault(rateLimitProperties.authWindowSeconds(), DEFAULT_AUTH_WINDOW_SECONDS)
                        ),
                        rateLimitBucket(
                                settings == null ? null : settings.getRateLimitPasswordResetRequests(),
                                settings == null ? null : settings.getRateLimitPasswordResetWindowSeconds(),
                                configuredIntOrDefault(
                                        rateLimitProperties.passwordResetRequests(),
                                        DEFAULT_PASSWORD_RESET_REQUESTS
                                ),
                                configuredLongOrDefault(
                                        rateLimitProperties.passwordResetWindowSeconds(),
                                        DEFAULT_PASSWORD_RESET_WINDOW_SECONDS
                                )
                        ),
                        rateLimitBucket(
                                settings == null ? null : settings.getRateLimitWarrantyLookupRequests(),
                                settings == null ? null : settings.getRateLimitWarrantyLookupWindowSeconds(),
                                configuredIntOrDefault(
                                        rateLimitProperties.warrantyLookupRequests(),
                                        DEFAULT_WARRANTY_LOOKUP_REQUESTS
                                ),
                                configuredLongOrDefault(
                                        rateLimitProperties.warrantyLookupWindowSeconds(),
                                        DEFAULT_WARRANTY_LOOKUP_WINDOW_SECONDS
                                )
                        ),
                        rateLimitBucket(
                                settings == null ? null : settings.getRateLimitUploadRequests(),
                                settings == null ? null : settings.getRateLimitUploadWindowSeconds(),
                                configuredIntOrDefault(rateLimitProperties.uploadRequests(), DEFAULT_UPLOAD_REQUESTS),
                                configuredLongOrDefault(rateLimitProperties.uploadWindowSeconds(), DEFAULT_UPLOAD_WINDOW_SECONDS)
                        ),
                        rateLimitBucket(
                                settings == null ? null : settings.getRateLimitWebhookRequests(),
                                settings == null ? null : settings.getRateLimitWebhookWindowSeconds(),
                                configuredIntOrDefault(rateLimitProperties.webhookRequests(), DEFAULT_WEBHOOK_REQUESTS),
                                configuredLongOrDefault(rateLimitProperties.webhookWindowSeconds(), DEFAULT_WEBHOOK_WINDOW_SECONDS)
                        )
                )
        );
    }

    private RateLimitBucketRuntimeSettings rateLimitBucket(
            Integer requests,
            Long windowSeconds,
            int defaultRequests,
            long defaultWindowSeconds
    ) {
        return new RateLimitBucketRuntimeSettings(
                requests != null && requests > 0 ? requests : defaultRequests,
                windowSeconds != null && windowSeconds > 0 ? windowSeconds : defaultWindowSeconds
        );
    }

    private AdminSettingsResponse toResponse(AdminSettings settings, EffectiveAdminSettings effectiveSettings) {
        return new AdminSettingsResponse(
                settings.getId(),
                effectiveSettings.emailConfirmation(),
                effectiveSettings.sessionTimeoutMinutes(),
                effectiveSettings.orderAlerts(),
                effectiveSettings.inventoryAlerts(),
                new AdminSettingsResponse.SepaySettings(
                        effectiveSettings.sepay().enabled(),
                        effectiveSettings.sepay().webhookToken(),
                        effectiveSettings.sepay().bankName(),
                        effectiveSettings.sepay().accountNumber(),
                        effectiveSettings.sepay().accountHolder()
                ),
                new AdminSettingsResponse.EmailSettings(
                        effectiveSettings.emailSettings().enabled(),
                        effectiveSettings.emailSettings().from(),
                        effectiveSettings.emailSettings().fromName()
                ),
                new AdminSettingsResponse.RateLimitSettings(
                        effectiveSettings.rateLimitOverrides().enabled(),
                        toResponseBucket(effectiveSettings.rateLimitOverrides().auth()),
                        toResponseBucket(effectiveSettings.rateLimitOverrides().passwordReset()),
                        toResponseBucket(effectiveSettings.rateLimitOverrides().warrantyLookup()),
                        toResponseBucket(effectiveSettings.rateLimitOverrides().upload()),
                        toResponseBucket(effectiveSettings.rateLimitOverrides().webhook())
                ),
                settings.getCreatedAt(),
                settings.getUpdatedAt()
        );
    }

    private AdminSettingsResponse.RateLimitBucket toResponseBucket(RateLimitBucketRuntimeSettings bucket) {
        return new AdminSettingsResponse.RateLimitBucket(bucket.requests(), bucket.windowSeconds());
    }

    private boolean booleanOrDefault(Boolean value, boolean defaultValue) {
        return value != null ? value : defaultValue;
    }

    private int intOrDefault(Integer value, int defaultValue) {
        return value != null ? value : defaultValue;
    }

    private String stringOrDefault(String value, String defaultValue) {
        String normalized = normalize(value);
        return normalized != null ? normalized : defaultValue;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validatePositive(int value, String fieldName) {
        if (value <= 0) {
            throw new BadRequestException(fieldName + " must be greater than 0");
        }
    }

    private void validatePositive(long value, String fieldName) {
        if (value <= 0) {
            throw new BadRequestException(fieldName + " must be greater than 0");
        }
    }

    private int configuredIntOrDefault(int configuredValue, int defaultValue) {
        return configuredValue > 0 ? configuredValue : defaultValue;
    }

    private long configuredLongOrDefault(long configuredValue, long defaultValue) {
        return configuredValue > 0 ? configuredValue : defaultValue;
    }

    public record EffectiveAdminSettings(
            boolean emailConfirmation,
            int sessionTimeoutMinutes,
            boolean orderAlerts,
            boolean inventoryAlerts,
            SepayRuntimeSettings sepay,
            EmailRuntimeSettings emailSettings,
            RateLimitRuntimeSettings rateLimitOverrides
    ) {
    }

    public record SepayRuntimeSettings(
            boolean enabled,
            String webhookToken,
            String bankName,
            String accountNumber,
            String accountHolder
    ) {
    }

    public record EmailRuntimeSettings(
            boolean enabled,
            String from,
            String fromName
    ) {
    }

    public record RateLimitRuntimeSettings(
            boolean enabled,
            RateLimitBucketRuntimeSettings auth,
            RateLimitBucketRuntimeSettings passwordReset,
            RateLimitBucketRuntimeSettings warrantyLookup,
            RateLimitBucketRuntimeSettings upload,
            RateLimitBucketRuntimeSettings webhook
    ) {
    }

    public record RateLimitBucketRuntimeSettings(
            int requests,
            long windowSeconds
    ) {
    }
}
