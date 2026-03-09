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

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
