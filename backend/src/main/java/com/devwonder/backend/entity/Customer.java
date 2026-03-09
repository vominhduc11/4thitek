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
@Table(name = "customers")
@PrimaryKeyJoinColumn(name = "id_account")
@Getter
@Setter
@NoArgsConstructor
public class Customer extends Account {

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone", unique = true)
    private String phone;

    @Column(name = "avatar_url", length = 2000)
    private String avatarUrl;

    @OneToMany(mappedBy = "customer")
    private Set<ProductSerial> productSerials = new HashSet<>();

    @OneToMany(mappedBy = "customer")
    private Set<WarrantyRegistration> warrantyRegistrations = new HashSet<>();
}
