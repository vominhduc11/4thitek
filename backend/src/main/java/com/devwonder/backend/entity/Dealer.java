package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dealers")
@PrimaryKeyJoinColumn(name = "id_account")
@Getter
@Setter
@NoArgsConstructor
public class Dealer extends Account {

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "address")
    private String address;

    @Column(name = "phone", unique = true)
    private String phone;

    @OneToMany(mappedBy = "dealer")
    private Set<DealerCartItem> cartItems = new HashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<Order> orders = new HashSet<>();
}
