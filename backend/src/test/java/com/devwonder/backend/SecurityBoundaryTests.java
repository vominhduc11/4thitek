package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:security_boundaries;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=security.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Security Admin"
})
@AutoConfigureMockMvc
class SecurityBoundaryTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RequestMappingHandlerMapping requestMappingHandlerMapping;

    @Test
    void malformedBearerTokenReturnsUnauthorizedInsteadOfServerError() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", "Bearer definitely-not-a-jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid or expired token"));
    }

    @Test
    void removedCustomerEndpointsAreNotExposed() {
        boolean exposed = requestMappingHandlerMapping.getHandlerMethods().keySet().stream()
                .flatMap(info -> info.getPatternValues().stream())
                .anyMatch(pattern -> "/api/v1/auth/register-customer".equals(pattern)
                        || "/api/v1/admin/customers".equals(pattern)
                        || "/api/v1/admin/customers/{id}".equals(pattern)
                        || "/api/v1/admin/customers/{id}/status".equals(pattern));

        assertThat(exposed).isFalse();
    }
}
