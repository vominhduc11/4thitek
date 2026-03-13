package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "warranties")
@Getter
@Setter
@NoArgsConstructor
public class WarrantyRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product_serial", unique = true)
    private ProductSerial productSerial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_dealer")
    private Dealer dealer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_order")
    private Order order;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_address")
    private String customerAddress;

    @Column(name = "warranty_code", unique = true)
    private String warrantyCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private WarrantyStatus status;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_start")
    private Instant warrantyStart;

    @Column(name = "warranty_end")
    private Instant warrantyEnd;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
