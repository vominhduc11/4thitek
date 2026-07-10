package com.devwonder.backend.security;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Resolves account role names out of the granted-authority set.
 * <p>
 * Since granular RBAC, an authenticated principal carries BOTH role names
 * (e.g. {@code SALES}) and fine-grained permission codes (e.g. {@code orders.approve})
 * as authorities. Audit logging and any "primary role" derivation must look only at
 * the role names — otherwise {@code audit_logs.actor_role} (varchar 255) overflows and
 * a random permission code may be picked as "the role".
 */
public final class AdminActorRoleSupport {

    /** Known account role names, ordered by descending precedence. */
    private static final List<String> ROLE_PRECEDENCE = List.of(
            "SUPER_ADMIN", "ADMIN", "SALES", "ACCOUNTANT", "WAREHOUSE", "CONTENT_EDITOR", "DEALER"
    );

    private static final Set<String> ROLE_NAMES = Set.copyOf(ROLE_PRECEDENCE);

    private AdminActorRoleSupport() {
    }

    public static boolean isRoleName(String authority) {
        return authority != null && ROLE_NAMES.contains(authority);
    }

    /** Highest-precedence role name held by the principal, or {@code "ADMIN"} as a safe default. */
    public static String resolvePrimaryRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "ADMIN";
        }
        Set<String> held = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(ROLE_NAMES::contains)
                .collect(Collectors.toSet());
        for (String role : ROLE_PRECEDENCE) {
            if (held.contains(role)) {
                return role;
            }
        }
        return "ADMIN";
    }

    /** Comma-joined, sorted role names only (permission codes excluded). */
    public static String resolveRoleNames(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return null;
        }
        Set<String> roleNames = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(ROLE_NAMES::contains)
                .collect(Collectors.toCollection(TreeSet::new));
        return roleNames.isEmpty() ? null : String.join(",", roleNames);
    }
}
