package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import com.devwonder.backend.entity.enums.CustomerStatus;
import java.math.BigDecimal;
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

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "tax_code", unique = true)
    private String taxCode;

    @Column(name = "phone", unique = true)
    private String phone;

    @Column(name = "address_line")
    private String addressLine;

    @Column(name = "ward")
    private String ward;

    @Column(name = "district")
    private String district;

    @Column(name = "city")
    private String city;

    @Column(name = "country")
    private String country;

    @Column(name = "avatar_url", length = 2000)
    private String avatarUrl;

    @Column(name = "sales_policy", length = 4000)
    private String salesPolicy;

    @Column(name = "credit_limit")
    private BigDecimal creditLimit;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_status")
    private CustomerStatus customerStatus;

    @OneToMany(mappedBy = "dealer")
    private Set<DealerCartItem> cartItems = new HashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<Order> orders = new HashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<ProductSerial> productSerials = new HashSet<>();

    @OneToMany(mappedBy = "dealer")
    private Set<WarrantyRegistration> warrantyRegistrations = new HashSet<>();

    public String getCompanyName() {
        return businessName;
    }

    public void setCompanyName(String companyName) {
        this.businessName = companyName;
    }

    public String getAddress() {
        return addressLine;
    }

    public void setAddress(String address) {
        this.addressLine = address;
    }
}
