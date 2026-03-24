package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Guards the JSON field names and structure of auth API responses consumed by
 * all three clients: admin-fe, dealer app, and (indirectly) main-fe.
 *
 * <p>Every client reads accessToken, refreshToken, tokenType, expiresIn, and
 * nested user fields after login and refresh. A field rename or removal is an
 * instant breakage for all of them, and it would not be caught by behaviour
 * tests that only check whether login succeeds or fails.
 *
 * <p>Tests use the bootstrap super-admin feature so that a real user with a
 * properly BCrypt-hashed password is available without manual DB setup.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth_response_shape;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=auth.shape@example.com",
        "app.bootstrap-super-admin.password=TestPass#Shape99",
        "app.bootstrap-super-admin.name=Auth Shape Admin"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AuthResponseShapeTests {

    @Autowired
    private MockMvc mockMvc;

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/auth/login — verifies all fields of AuthResponse and the
     * nested AuthUserResponse that every client depends on.
     *
     * <p>Fields checked:
     * <ul>
     *   <li>{@code data.accessToken} — JWT used in Authorization header</li>
     *   <li>{@code data.refreshToken} — used to renew the session</li>
     *   <li>{@code data.tokenType} — must be exactly "Bearer" for header construction</li>
     *   <li>{@code data.expiresIn} — TTL used by clients to schedule proactive refresh</li>
     *   <li>{@code data.user.id} — referenced in admin-fe for user identity</li>
     *   <li>{@code data.user.username} — displayed in UI, used for logging</li>
     *   <li>{@code data.user.accountType} — used to distinguish admin vs dealer</li>
     *   <li>{@code data.user.roles} — used by admin-fe for permission checks</li>
     *   <li>{@code data.user.requirePasswordChange} — triggers forced-change flow</li>
     * </ul>
     * Set-Cookie must include the refresh token cookie used by the cookie-based
     * refresh flow that dealer app and admin-fe rely on.
     */
    @Test
    void loginResponseContainsAllRequiredAuthFields() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "auth.shape@example.com",
                                  "password": "TestPass#Shape99"
                                }
                                """))
                .andExpect(status().isOk())
                // Top-level AuthResponse fields
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.expiresIn").isNumber())
                // Nested AuthUserResponse fields
                .andExpect(jsonPath("$.data.user").exists())
                .andExpect(jsonPath("$.data.user.id").isNumber())
                .andExpect(jsonPath("$.data.user.username").isString())
                .andExpect(jsonPath("$.data.user.accountType").isString())
                .andExpect(jsonPath("$.data.user.roles").isArray())
                .andExpect(jsonPath("$.data.user.requirePasswordChange").isBoolean())
                // Cookie-based refresh token must be set
                .andExpect(cookie().exists("fourthitek_refresh"));
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/auth/refresh — response must be the same shape as login.
     *
     * <p>Clients store the token pair after login, then use refresh to obtain a
     * new pair. The shape must be identical — if refresh ever returns fewer
     * fields than login, clients that rely on e.g. {@code user.roles} after
     * refresh will break silently.
     */
    @Test
    void refreshResponseContainsSameFieldsAsLogin() throws Exception {
        // Step 1: perform login and extract refresh token from response body
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "auth.shape@example.com",
                                  "password": "TestPass#Shape99"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String loginBody = loginResult.getResponse().getContentAsString();
        String refreshToken = JsonPath.read(loginBody, "$.data.refreshToken");

        // Step 2: use the refresh token and verify the response shape is identical
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(APPLICATION_JSON)
                        .content("{\"refreshToken\": \"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.expiresIn").isNumber())
                .andExpect(jsonPath("$.data.user.id").isNumber())
                .andExpect(jsonPath("$.data.user.username").isString())
                .andExpect(jsonPath("$.data.user.accountType").isString())
                .andExpect(jsonPath("$.data.user.roles").isArray())
                .andExpect(jsonPath("$.data.user.requirePasswordChange").isBoolean());
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/auth/logout — verifies the status field that clients check
     * to confirm session termination.
     */
    @Test
    void logoutResponseContainsStatusField() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("logged_out"));
    }
}
