package com.devwonder.backend.repository;

import com.devwonder.backend.entity.BulkDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BulkDiscountRepository extends JpaRepository<BulkDiscount, Long> {
}
