package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.PublishStatus;
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
              and (select count(ps) from ProductSerial ps
                   where ps.product = p
                     and ps.dealer is null
                     and ps.status = com.devwonder.backend.entity.enums.ProductSerialStatus.AVAILABLE) < :threshold
            """)
    long countActiveProductsBelowStock(@Param("threshold") int threshold);

    @Query("""
            select count(p)
            from Product p
            where (p.isDeleted = false or p.isDeleted is null)
              and p.publishStatus = :publishStatus
            """)
    long countActiveProductsByPublishStatus(@Param("publishStatus") PublishStatus publishStatus);

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
