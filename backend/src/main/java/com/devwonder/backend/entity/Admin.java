package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "admins")
@PrimaryKeyJoinColumn(name = "id_account")
@Getter
@Setter
@NoArgsConstructor
public class Admin extends Account {

    @Column(name = "require_login_email_confirmation")
    private Boolean requireLoginEmailConfirmation;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "role_title")
    private String roleTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_status")
    private StaffUserStatus userStatus;
}
