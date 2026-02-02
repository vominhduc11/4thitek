package com.devwonder.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
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
}
