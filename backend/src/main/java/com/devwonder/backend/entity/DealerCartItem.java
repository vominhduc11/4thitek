package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "dealer_cart_items")
@Getter
@Setter
@NoArgsConstructor
public class DealerCartItem {

    @EmbeddedId
    private DealerCartItemId id = new DealerCartItemId();

    @MapsId("idDealer")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_dealer")
    private Dealer dealer;

    @MapsId("idProductOfCart")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product_of_cart")
    private ProductOfCart productOfCart;

    @Column(name = "quantity")
    private Integer quantity;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
