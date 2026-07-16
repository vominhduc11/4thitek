package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Permission;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.PermissionRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Verifies the granular RBAC contract: each internal staff role can only reach the admin
 * endpoints covered by its permission codes. Tests run with Flyway disabled (schema from
 * JPA), so the role/permission catalog of V42 is mirrored here in {@link #seedRbac()}.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rbac_authz;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class RolePermissionAuthorizationTests {

    private static final String PASSWORD = "StaffPass#123";

    private static final List<String> ALL_PERMISSIONS = List.of(
            "orders.read", "orders.approve", "orders.process", "orders.cancel.review",
            "orders.payment.confirm", "serials.read", "serials.write", "serials.assign",
            "warranties.read", "warranties.write", "returns.read", "returns.write",
            "dealers.read", "dealers.write", "support.read", "support.write",
            "products.write", "blogs.write", "content.write", "media.write",
            "discounts.write", "reports.read", "notifications.read", "notifications.write",
            "dashboard.read");

    private static final Map<String, List<String>> ROLE_PERMISSIONS = buildRolePermissions();

    private static Map<String, List<String>> buildRolePermissions() {
        Map<String, List<String>> map = new LinkedHashMap<>();
        map.put("ADMIN", ALL_PERMISSIONS);
        map.put("SALES", List.of(
                "orders.read", "orders.approve", "orders.process", "orders.cancel.review",
                "dealers.read", "dealers.write", "returns.read", "returns.write",
                "support.read", "support.write", "discounts.write",
                "reports.read", "dashboard.read", "notifications.read"));
        map.put("WAREHOUSE", List.of(
                "serials.read", "serials.write", "serials.assign",
                "warranties.read", "warranties.write", "returns.read", "returns.write",
                "orders.read", "orders.process", "dashboard.read", "notifications.read"));
        map.put("ACCOUNTANT", List.of(
                "orders.read", "orders.payment.confirm",
                "reports.read", "dashboard.read", "notifications.read"));
        map.put("CONTENT_EDITOR", List.of(
                "products.write", "blogs.write", "content.write", "media.write",
                "dashboard.read", "notifications.read"));
        return map;
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void seedRbac() {
        Map<String, Permission> permissionsByCode = new LinkedHashMap<>();
        for (String code : ALL_PERMISSIONS) {
            Permission permission = permissionRepository.findByCode(code).orElseGet(() -> {
                Permission created = new Permission();
                created.setCode(code);
                created.setDescription(code);
                return permissionRepository.save(created);
            });
            permissionsByCode.put(code, permission);
        }
        ROLE_PERMISSIONS.forEach((roleName, codes) -> {
            if (roleRepository.findByName(roleName).isPresent()) {
                return;
            }
            Role role = new Role();
            role.setName(roleName);
            role.setDescription(roleName + " role");
            Set<Permission> grants = new HashSet<>();
            for (String code : codes) {
                grants.add(permissionsByCode.get(code));
            }
            role.setPermissions(grants);
            roleRepository.save(role);
        });
    }

    @Test
    void salesCanReadOrdersButNotSerials() throws Exception {
        String token = staffToken("sales.user@example.com", "SALES");

        mockMvc.perform(get("/api/v1/admin/orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/serials")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void warehouseCanReadSerialsButNotDealers() throws Exception {
        String token = staffToken("warehouse.user@example.com", "WAREHOUSE");

        mockMvc.perform(get("/api/v1/admin/serials")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/dealers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void accountantCanReadRecentPaymentsButNotSerials() throws Exception {
        String token = staffToken("accountant.user@example.com", "ACCOUNTANT");

        mockMvc.perform(get("/api/v1/admin/payments/recent")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/serials")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void contentEditorCanReadDashboardButNotOrders() throws Exception {
        String token = staffToken("content.user@example.com", "CONTENT_EDITOR");

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRoleRetainsFullOperationalAccess() throws Exception {
        String token = staffToken("admin.user@example.com", "ADMIN");

        mockMvc.perform(get("/api/v1/admin/orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/serials")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/dealers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void notificationComposeRequiresNotificationsWriteCode() throws Exception {
        String payload = """
                {
                  "audience": "DEALERS",
                  "title": "Thông báo kiểm thử",
                  "body": "Nội dung kiểm thử phân quyền.",
                  "type": "SYSTEM"
                }
                """;

        // SALES có notifications.read nhưng không có notifications.write → 403
        String salesToken = staffToken("sales.notify@example.com", "SALES");
        mockMvc.perform(post("/api/v1/admin/notifications")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());

        // ADMIN synthesize đủ code (gồm notifications.write) → không 403
        String adminToken = staffToken("admin.notify@example.com", "ADMIN");
        mockMvc.perform(post("/api/v1/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status == 403) {
                        throw new AssertionError("ADMIN không được nhận 403 khi POST /notifications, thực tế: " + status);
                    }
                });
    }

    @Test
    void nonAdminRoleCannotReachSuperAdminOnlyAuditLogs() throws Exception {
        String token = staffToken("sales.audit@example.com", "SALES");

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private String staffToken(String email, String roleName) throws Exception {
        Role role = roleRepository.findByName(roleName).orElseThrow(
                () -> new IllegalStateException("Role not seeded: " + roleName));
        Admin admin = new Admin();
        admin.setUsername(email);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(PASSWORD));
        admin.setEmailVerified(Boolean.TRUE);
        admin.setEmailVerifiedAt(Instant.now());
        admin.setDisplayName("Staff " + roleName);
        admin.setRoleTitle(roleName);
        admin.setUserStatus(StaffUserStatus.ACTIVE);
        admin.setRequirePasswordChange(Boolean.FALSE);
        admin.setRoles(new HashSet<>(Set.of(role)));
        adminRepository.save(admin);
        return login(email, PASSWORD);
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode payload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }
}
