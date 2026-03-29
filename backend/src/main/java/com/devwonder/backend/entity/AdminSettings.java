package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "admin_settings")
@Getter
@Setter
@NoArgsConstructor
public class AdminSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_confirmation", nullable = false)
    private Boolean emailConfirmation;

    @Column(name = "session_timeout_minutes", nullable = false)
    private Integer sessionTimeoutMinutes;

    @Column(name = "order_alerts", nullable = false)
    private Boolean orderAlerts;

    @Column(name = "inventory_alerts", nullable = false)
    private Boolean inventoryAlerts;

    @Column(name = "vat_percent", nullable = false)
    private Integer vatPercent;

    @Column(name = "sepay_enabled")
    private Boolean sepayEnabled;

    @Column(name = "sepay_webhook_token")
    private String sepayWebhookToken;

    @Column(name = "sepay_bank_name")
    private String sepayBankName;

    @Column(name = "sepay_account_number")
    private String sepayAccountNumber;

    @Column(name = "sepay_account_holder")
    private String sepayAccountHolder;

    @Column(name = "mail_enabled")
    private Boolean mailEnabled;

    @Column(name = "mail_from")
    private String mailFrom;

    @Column(name = "mail_from_name")
    private String mailFromName;

    @Column(name = "rate_limit_enabled")
    private Boolean rateLimitEnabled;

    @Column(name = "rate_limit_auth_requests")
    private Integer rateLimitAuthRequests;

    @Column(name = "rate_limit_auth_window_seconds")
    private Long rateLimitAuthWindowSeconds;

    @Column(name = "rate_limit_password_reset_requests")
    private Integer rateLimitPasswordResetRequests;

    @Column(name = "rate_limit_password_reset_window_seconds")
    private Long rateLimitPasswordResetWindowSeconds;

    @Column(name = "rate_limit_warranty_lookup_requests")
    private Integer rateLimitWarrantyLookupRequests;

    @Column(name = "rate_limit_warranty_lookup_window_seconds")
    private Long rateLimitWarrantyLookupWindowSeconds;

    @Column(name = "rate_limit_upload_requests")
    private Integer rateLimitUploadRequests;

    @Column(name = "rate_limit_upload_window_seconds")
    private Long rateLimitUploadWindowSeconds;

    @Column(name = "rate_limit_webhook_requests")
    private Integer rateLimitWebhookRequests;

    @Column(name = "rate_limit_webhook_window_seconds")
    private Long rateLimitWebhookWindowSeconds;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
