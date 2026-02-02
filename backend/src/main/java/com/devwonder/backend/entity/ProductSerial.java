package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.ProductSerialStatus;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_serials")
@Getter
@Setter
@NoArgsConstructor
public class ProductSerial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "serial", unique = true)
    private String serial;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ProductSerialStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product")
    private Product product;

    @OneToOne(mappedBy = "productSerial", fetch = FetchType.LAZY)
    private Warranty warranty;
}
