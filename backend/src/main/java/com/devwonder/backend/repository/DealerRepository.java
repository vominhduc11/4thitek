package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Dealer;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.devwonder.backend.entity.enums.CustomerStatus;

@Repository
public interface DealerRepository extends JpaRepository<Dealer, Long> {
    Optional<Dealer> findByUsername(String username);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select d
            from Dealer d
            where d.username = :username
            """)
    Optional<Dealer> findByUsernameForUpdate(String username);
    Optional<Dealer> findByTaxCode(String taxCode);
    boolean existsById(Long id);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByTaxCodeAndIdNot(String taxCode, Long id);
    long countByCustomerStatus(CustomerStatus status);
    Page<Dealer> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Dealer> findAllByOrderByCreatedAtDesc();

    @Query("select d.id from Dealer d")
    List<Long> findAllIds();
}
