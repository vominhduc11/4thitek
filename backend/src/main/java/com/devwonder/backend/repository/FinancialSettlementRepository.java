package com.devwonder.backend.repository;

import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FinancialSettlementRepository extends JpaRepository<FinancialSettlement, Long> {

    List<FinancialSettlement> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<FinancialSettlement> findByStatusOrderByCreatedAtDesc(FinancialSettlementStatus status);

    boolean existsByOrderIdAndStatus(Long orderId, FinancialSettlementStatus status);

    long countByStatus(FinancialSettlementStatus status);
}
