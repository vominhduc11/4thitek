package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Dealer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DealerRepository extends JpaRepository<Dealer, Long> {
    Optional<Dealer> findByUsername(String username);
    Optional<Dealer> findByTaxCode(String taxCode);
    boolean existsById(Long id);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByTaxCodeAndIdNot(String taxCode, Long id);

    @Query("select d.id from Dealer d")
    List<Long> findAllIds();
}
