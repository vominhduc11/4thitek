package com.devwonder.backend.repository;

import com.devwonder.backend.entity.ProductSerial;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSerialRepository extends JpaRepository<ProductSerial, Long> {
    Optional<ProductSerial> findBySerialIgnoreCase(String serial);

    Optional<ProductSerial> findByIdAndDealerId(Long id, Long dealerId);

    @EntityGraph(attributePaths = {"product", "dealer", "customer", "order"})
    List<ProductSerial> findByDealerIdOrderByImportedAtDesc(Long dealerId);

    @EntityGraph(attributePaths = {"product", "dealer", "customer", "order", "warranty"})
    Page<ProductSerial> findAllByOrderByImportedAtDesc(Pageable pageable);
}
