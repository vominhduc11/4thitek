package com.devwonder.backend.repository;

import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSerialRepository extends JpaRepository<ProductSerial, Long> {
    Optional<ProductSerial> findBySerialIgnoreCase(String serial);

    Optional<ProductSerial> findByIdAndDealerId(Long id, Long dealerId);

    @EntityGraph(attributePaths = {"product", "dealer", "order"})
    List<ProductSerial> findByDealerIdOrderByImportedAtDesc(Long dealerId);

    @EntityGraph(attributePaths = {"product", "dealer", "order"})
    @Query("SELECT ps FROM ProductSerial ps WHERE ps.dealer.id = :dealerId AND (ps.order IS NULL OR ps.order.status = com.devwonder.backend.entity.enums.OrderStatus.COMPLETED) ORDER BY ps.importedAt DESC")
    List<ProductSerial> findDealerInventorySerials(@Param("dealerId") Long dealerId);

    @EntityGraph(attributePaths = {"product", "dealer", "order", "warranty"})
    Page<ProductSerial> findAllByOrderByImportedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"product", "dealer", "order", "warranty"})
    List<ProductSerial> findByOrderId(Long orderId);

    long countByOrderIdAndProductId(Long orderId, Long productId);

    List<ProductSerial> findByOrderIdAndStatus(Long orderId, ProductSerialStatus status);

    long countByProductIdAndDealerIsNullAndStatus(Long productId, ProductSerialStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ps FROM ProductSerial ps WHERE ps.product.id = :productId AND ps.dealer IS NULL AND ps.status = :status ORDER BY ps.importedAt ASC")
    List<ProductSerial> findAvailableForAssignment(
            @Param("productId") Long productId,
            @Param("status") ProductSerialStatus status,
            Pageable pageable
    );

    @Query("SELECT ps.product.id, COUNT(ps) FROM ProductSerial ps WHERE ps.dealer IS NULL AND ps.status = :status GROUP BY ps.product.id")
    List<Object[]> countAvailableGroupByProduct(@Param("status") ProductSerialStatus status);

}
