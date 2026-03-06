package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Customer;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByUsername(String username);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, UUID id);
}
