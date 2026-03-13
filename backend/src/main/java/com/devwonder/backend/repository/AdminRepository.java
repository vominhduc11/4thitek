package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Admin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.devwonder.backend.entity.enums.StaffUserStatus;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsername(String username);

    boolean existsByRoles_Name(String roleName);
    long countByUserStatus(StaffUserStatus userStatus);
}
