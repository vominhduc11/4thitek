package com.devwonder.backend.repository;

import com.devwonder.backend.entity.OrderAdjustment;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderAdjustmentRepository extends JpaRepository<OrderAdjustment, Long> {

    List<OrderAdjustment> findByOrderIdOrderByCreatedAtAsc(Long orderId);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM OrderAdjustment a WHERE a.order.id = :orderId")
    BigDecimal sumAmountByOrderId(@Param("orderId") Long orderId);
}
