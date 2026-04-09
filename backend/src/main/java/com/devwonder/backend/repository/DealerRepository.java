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

    List<Dealer> findAllByCustomerStatusOrderByCreatedAtDesc(CustomerStatus status);
    Page<Dealer> findAllByCustomerStatus(CustomerStatus status, Pageable pageable);

    @Query(
            value = """
                    select d
                    from Dealer d
                    where (:status is null or d.customerStatus = :status)
                      and (
                        :query is null
                        or lower(coalesce(d.businessName, '')) like :query
                        or lower(coalesce(d.contactName, '')) like :query
                        or lower(coalesce(d.username, '')) like :query
                        or lower(coalesce(d.email, '')) like :query
                        or lower(coalesce(d.phone, '')) like :query
                        or lower(str(d.id)) like :query
                      )
                    order by d.createdAt desc
                    """,
            countQuery = """
                    select count(d)
                    from Dealer d
                    where (:status is null or d.customerStatus = :status)
                      and (
                        :query is null
                        or lower(coalesce(d.businessName, '')) like :query
                        or lower(coalesce(d.contactName, '')) like :query
                        or lower(coalesce(d.username, '')) like :query
                        or lower(coalesce(d.email, '')) like :query
                        or lower(coalesce(d.phone, '')) like :query
                        or lower(str(d.id)) like :query
                      )
                    """
    )
    Page<Dealer> findAllByCustomerStatusAndQueryOrderByCreatedAtDesc(
            CustomerStatus status,
            String query,
            Pageable pageable
    );

    @Query("select d.id from Dealer d")
    List<Long> findAllIds();
}
