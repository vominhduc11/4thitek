package com.devwonder.backend.repository;

import java.util.Optional;

import com.devwonder.backend.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUsername(String username);
    Optional<Account> findByEmail(String email);
    Optional<Account> findByEmailIgnoreCase(String email);
    Optional<Account> findByUsernameOrEmail(String username, String email);
    boolean existsByUsername(String username);
    boolean existsByEmailAndIdNot(String email, Long id);
}
