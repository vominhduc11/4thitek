package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "warranties")
@Getter
@Setter
@NoArgsConstructor
public class Warranty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_address")
    private String customerAddress;

    @Column(name = "warranty_code")
    private String warrantyCode;

    @Column(name = "status")
    private String status;

    @Column(name = "puchase_date")
    private Instant purchaseDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product_serial")
    private ProductSerial productSerial;
}
