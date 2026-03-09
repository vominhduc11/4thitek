package com.devwonder.backend.repository;

import com.devwonder.backend.entity.DealerCartItem;
import com.devwonder.backend.entity.DealerCartItemId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DealerCartItemRepository extends JpaRepository<DealerCartItem, DealerCartItemId> {
    @EntityGraph(attributePaths = {"productOfCart", "productOfCart.product"})
    List<DealerCartItem> findByDealerIdOrderByUpdatedAtDesc(Long dealerId);

    @EntityGraph(attributePaths = {"productOfCart", "productOfCart.product"})
    Optional<DealerCartItem> findByDealerIdAndProductOfCartProductId(Long dealerId, Long productId);

    void deleteByDealerIdAndProductOfCartProductId(Long dealerId, Long productId);

    void deleteByDealerId(Long dealerId);
}
