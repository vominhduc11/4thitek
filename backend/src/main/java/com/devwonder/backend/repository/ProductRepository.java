package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.PublishStatus;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsDeletedFalseAndPublishStatusOrderByNameAsc(PublishStatus publishStatus);
    Page<Product> findByIsDeletedFalseAndPublishStatusOrderByNameAsc(PublishStatus publishStatus, Pageable pageable);
    List<Product> findTop6ByIsDeletedFalseAndShowOnHomepageTrueAndPublishStatusOrderByUpdatedAtDesc(PublishStatus publishStatus);
    List<Product> findTop6ByIsDeletedFalseAndIsFeaturedTrueAndPublishStatusOrderByUpdatedAtDesc(PublishStatus publishStatus);
    Optional<Product> findByIdAndIsDeletedFalseAndPublishStatus(Long id, PublishStatus publishStatus);
    List<Product> findByIsDeletedFalseOrderByUpdatedAtDesc();
    Page<Product> findByIsDeletedFalse(Pageable pageable);
    boolean existsBySkuAndIdNot(String sku, Long id);
    @Query("""
            select count(p)
            from Product p
            where p.isDeleted = false or p.isDeleted is null
            """)
    long countActiveProducts();

    @Query("""
            select count(p)
            from Product p
            where (p.isDeleted = false or p.isDeleted is null)
              and coalesce(p.stock, 0) < :threshold
            """)
    long countActiveProductsBelowStock(@Param("threshold") int threshold);

    @Query("""
            select p
            from Product p
            where (p.isDeleted = false or p.isDeleted is null)
              and coalesce(p.stock, 0) < :threshold
            order by coalesce(p.stock, 0) asc, p.updatedAt asc nulls last, p.id asc
            """)
    List<Product> findAllActiveBelowStock(@Param("threshold") int threshold);

    @Query("""
            select count(p)
            from Product p
            where (p.isDeleted = false or p.isDeleted is null)
              and p.publishStatus = :publishStatus
            """)
    long countActiveProductsByPublishStatus(@Param("publishStatus") PublishStatus publishStatus);

    /**
     * Filters published products at the database level.
     *
     * Rules preserved from the previous in-memory implementation:
     *   - Text match is a case-insensitive substring on name, sku, or shortDescription.
     *   - null {@code query} skips text filtering entirely.
     *   - null {@code retailPrice} is treated as 0 for price-range checks (COALESCE).
     *   - Results are ordered case-insensitively by name ascending; null names sort last.
     */
    @Query("""
            select p from Product p
            where p.isDeleted = false
              and p.publishStatus = :publishStatus
              and (:query is null
                   or lower(p.name) like lower(concat('%', :query, '%'))
                   or lower(p.sku) like lower(concat('%', :query, '%'))
                   or lower(p.shortDescription) like lower(concat('%', :query, '%')))
              and (:minPrice is null or coalesce(p.retailPrice, 0) >= :minPrice)
              and (:maxPrice is null or coalesce(p.retailPrice, 0) <= :maxPrice)
            order by lower(p.name) asc nulls last
            """)
    List<Product> searchPublished(
            @Param("publishStatus") PublishStatus publishStatus,
            @Param("query") String query,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice
    );

    @Query("""
            select p
            from Product p
            where p.isDeleted = false
              and p.publishStatus = :publishStatus
              and p.id <> :productId
            order by
              case when p.isFeatured = true then 0 else 1 end,
              case when p.showOnHomepage = true then 0 else 1 end,
              p.updatedAt desc
            """)
    List<Product> findRelatedPublished(
            @Param("publishStatus") PublishStatus publishStatus,
            @Param("productId") Long productId,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from Product p
            where p.id in :ids
              and (p.isDeleted = false or p.isDeleted is null)
            order by p.id asc
            """)
    List<Product> findAllActiveByIdInForUpdate(@Param("ids") Collection<Long> ids);
}
