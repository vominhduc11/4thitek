package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.PublishStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsDeletedFalseAndPublishStatusOrderByNameAsc(PublishStatus publishStatus);
    List<Product> findTop6ByIsDeletedFalseAndShowOnHomepageTrueAndPublishStatusOrderByUpdatedAtDesc(PublishStatus publishStatus);
    Optional<Product> findByIdAndIsDeletedFalseAndPublishStatus(Long id, PublishStatus publishStatus);
    boolean existsBySkuAndIdNot(String sku, Long id);
}
