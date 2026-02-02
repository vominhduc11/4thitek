package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DealerCartItemId implements Serializable {

    @Column(name = "id_dealer")
    private Long idDealer;

    @Column(name = "id_product_of_cart")
    private Long idProductOfCart;
}
