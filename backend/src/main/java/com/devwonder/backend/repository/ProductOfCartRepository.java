package com.devwonder.backend.repository;

import com.devwonder.backend.entity.ProductOfCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductOfCartRepository extends JpaRepository<ProductOfCart, Long> {
}
