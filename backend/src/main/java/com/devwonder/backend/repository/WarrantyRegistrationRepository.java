package com.devwonder.backend.repository;

import com.devwonder.backend.entity.WarrantyRegistration;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WarrantyRegistrationRepository extends JpaRepository<WarrantyRegistration, Long> {
    Optional<WarrantyRegistration> findByProductSerialSerialIgnoreCase(String serial);
    Optional<WarrantyRegistration> findByProductSerialId(Long productSerialId);
    List<WarrantyRegistration> findByDealerIdOrderByCreatedAtDesc(Long dealerId);
    Page<WarrantyRegistration> findByDealerId(Long dealerId, Pageable pageable);

    @EntityGraph(attributePaths = {"productSerial", "productSerial.product", "dealer"})
    List<WarrantyRegistration> findByCustomerIdOrderByWarrantyEndDesc(Long customerId);

    @EntityGraph(attributePaths = {"productSerial", "productSerial.product", "dealer"})
    Page<WarrantyRegistration> findByCustomerId(Long customerId, Pageable pageable);

    @EntityGraph(attributePaths = {"productSerial", "productSerial.product", "dealer"})
    Optional<WarrantyRegistration> findByIdAndCustomerId(Long id, Long customerId);

    @EntityGraph(attributePaths = {"productSerial", "productSerial.product", "customer", "order"})
    Optional<WarrantyRegistration> findByIdAndDealerId(Long id, Long dealerId);
}
