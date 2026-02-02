package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.PublishStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sku", unique = true)
    private String sku;

    @Column(name = "name")
    private String name;

    @Column(name = "short_description")
    private String shortDescription;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "image", columnDefinition = "jsonb")
    private Map<String, Object> image;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "descriptions", columnDefinition = "jsonb")
    private Map<String, Object> descriptions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "videos", columnDefinition = "jsonb")
    private Map<String, Object> videos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "specifications", columnDefinition = "jsonb")
    private Map<String, Object> specifications;

    @Column(name = "retail_price")
    private BigDecimal retailPrice;

    @Column(name = "show_on_homepage")
    private Boolean showOnHomepage;

    @Column(name = "is_featured")
    private Boolean isFeatured;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Enumerated(EnumType.STRING)
    @Column(name = "publish_status")
    private PublishStatus publishStatus;

    @Column(name = "stock")
    private Integer stock;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "product")
    private Set<ProductSerial> productSerials = new HashSet<>();

    @OneToMany(mappedBy = "product")
    private Set<OrderItem> orderItems = new HashSet<>();

    @OneToMany(mappedBy = "product")
    private Set<ProductOfCart> productOfCarts = new HashSet<>();

    @OneToMany(mappedBy = "product")
    private Set<BulkDiscount> bulkDiscounts = new HashSet<>();
}
