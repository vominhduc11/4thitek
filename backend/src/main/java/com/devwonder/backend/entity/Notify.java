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

@Entity
@Table(name = "notifies")
@Getter
@Setter
@NoArgsConstructor
public class Notify {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title")
    private String title;

    @Column(name = "message", columnDefinition = "text")
    private String message;

    @Column(name = "time")
    private Instant time;

    @Column(name = "read")
    private Boolean isRead;

    @Column(name = "type")
    private String type;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
