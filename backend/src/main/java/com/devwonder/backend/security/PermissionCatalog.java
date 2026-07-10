package com.devwonder.backend.security;

import java.util.Set;

/**
 * Canonical catalog of granular permission codes (kept in sync with migration V42).
 * <p>
 * {@code ADMIN} and {@code SUPER_ADMIN} are full-access roles: rather than depending on
 * the {@code role_permissions} seed being present, {@link com.devwonder.backend.entity.Account}
 * synthesizes every code in this catalog for any account holding one of those roles. This
 * keeps the two top roles working even where the data seed has not run.
 */
public final class PermissionCatalog {

    public static final Set<String> ALL_CODES = Set.of(
            "orders.read", "orders.approve", "orders.process", "orders.cancel.review",
            "orders.payment.confirm", "serials.read", "serials.write", "serials.assign",
            "warranties.read", "warranties.write", "returns.read", "returns.write",
            "dealers.read", "dealers.write", "support.read", "support.write",
            "products.write", "blogs.write", "content.write", "media.write",
            "discounts.write", "reports.read", "notifications.read", "dashboard.read"
    );

    /** Roles that implicitly hold every permission code. */
    public static final Set<String> FULL_ACCESS_ROLES = Set.of("ADMIN", "SUPER_ADMIN");

    private PermissionCatalog() {
    }
}
