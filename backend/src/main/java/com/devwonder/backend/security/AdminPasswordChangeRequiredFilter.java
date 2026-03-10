package com.devwonder.backend.security;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.entity.Admin;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class AdminPasswordChangeRequiredFilter extends OncePerRequestFilter {

    private static final String CHANGE_PASSWORD_PATH = "/api/admin/password";
    private static final String VERSIONED_CHANGE_PASSWORD_PATH = "/api/v1/admin/password";
    private static final String LEGACY_CHANGE_PASSWORD_PATH = "/admin/password";

    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (HttpMethod.OPTIONS.matches(request.getMethod()) || isAllowedPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();
        if (!(principal instanceof Admin admin)
                || !Boolean.TRUE.equals(admin.getRequireLoginEmailConfirmation())) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(
                response.getWriter(),
                ApiResponse.failure("Password change required before accessing admin resources")
        );
    }

    private boolean isAllowedPath(String requestUri) {
        if (requestUri == null) {
            return false;
        }
        return requestUri.startsWith("/api/auth/")
                || requestUri.startsWith("/api/v1/auth/")
                || requestUri.startsWith("/auth/")
                || CHANGE_PASSWORD_PATH.equals(requestUri)
                || VERSIONED_CHANGE_PASSWORD_PATH.equals(requestUri)
                || LEGACY_CHANGE_PASSWORD_PATH.equals(requestUri);
    }
}
