package com.devwonder.backend.repository;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BulkDiscountRepository extends JpaRepository<BulkDiscount, Long> {

    List<BulkDiscount> findByStatus(DiscountRuleStatus status);
    long countByStatus(DiscountRuleStatus status);
}
