package com.devwonder.backend.repository;

import com.devwonder.backend.entity.WarrantyRegistration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WarrantyRegistrationRepository extends JpaRepository<WarrantyRegistration, UUID> {
    Optional<WarrantyRegistration> findByProductSerialSerialIgnoreCase(String serial);
    Optional<WarrantyRegistration> findByProductSerialId(UUID productSerialId);
    List<WarrantyRegistration> findByDealerIdOrderByCreatedAtDesc(UUID dealerId);
    Page<WarrantyRegistration> findByDealerId(UUID dealerId, Pageable pageable);

    @EntityGraph(attributePaths = {"productSerial", "productSerial.product", "dealer"})
    List<WarrantyRegistration> findByCustomerIdOrderByWarrantyEndDesc(UUID customerId);

    @EntityGraph(attributePaths = {"productSerial", "productSerial.product", "dealer"})
    Page<WarrantyRegistration> findByCustomerId(UUID customerId, Pageable pageable);

    @EntityGraph(attributePaths = {"productSerial", "productSerial.product", "dealer"})
    Optional<WarrantyRegistration> findByIdAndCustomerId(UUID id, UUID customerId);
}
