package com.devwonder.backend.repository;

import com.devwonder.backend.entity.OrderAdjustment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderAdjustmentRepository extends JpaRepository<OrderAdjustment, Long> {

    List<OrderAdjustment> findByOrderIdOrderByCreatedAtAsc(Long orderId);
}
