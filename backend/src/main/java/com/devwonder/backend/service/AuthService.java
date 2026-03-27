package com.devwonder.backend.service;

import com.devwonder.backend.dto.auth.AuthResponse;
import com.devwonder.backend.dto.auth.AuthUserResponse;
import com.devwonder.backend.dto.auth.LoginRequest;
import com.devwonder.backend.dto.auth.RefreshTokenRequest;
import com.devwonder.backend.dto.auth.RegisterDealerRequest;
import com.devwonder.backend.dto.auth.RegisterDealerResponse;
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.RefreshTokenSession;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.RefreshTokenSessionRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.security.JWTUtils;
import com.devwonder.backend.service.support.AccountValidationSupport;
import java.util.HashMap;
import java.util.HashSet;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AccountRepository accountRepository;
    private final DealerRepository dealerRepository;
    private final RefreshTokenSessionRepository refreshTokenSessionRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtils jwtUtils;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final DealerAccountLifecycleService dealerAccountLifecycleService;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identity = normalizeLoginIdentity(request.username());
        if (identity == null) {
            throw new BadCredentialsException("Invalid credentials");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identity, request.password())
            );
        } catch (BadCredentialsException | DisabledException ex) {
            throw new BadCredentialsException("Invalid credentials");
        }

        Account account = accountRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identity, identity)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        assertDealerPortalAccessIfRequired(account);

        String accessToken = jwtUtils.generateToken(account);
        String refreshToken = issueRefreshToken(account);
        AuthResponse response = buildAuthResponse(account, accessToken, refreshToken);
        webSocketEventPublisher.publishLoginConfirmed(account.getUsername(), response.user());
        return response;
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        return refreshToken(request == null ? null : request.refreshToken());
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        try {
            if (refreshToken == null || refreshToken.isBlank()) {
                throw new UnauthorizedException("Refresh token is invalid");
            }
            if (jwtUtils.isTokenExpired(refreshToken)) {
                throw new UnauthorizedException("Refresh token expired");
            }
            if (!jwtUtils.hasTokenType(refreshToken, JWTUtils.TokenType.REFRESH)) {
                throw new UnauthorizedException("Refresh token is invalid");
            }

            String username = jwtUtils.extractUsername(refreshToken);
            Account account = accountRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(username, username)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
            if (!account.isEnabled()) {
                throw new UnauthorizedException("Account is not active");
            }
            assertDealerPortalAccessIfRequired(account);
            if (!jwtUtils.isTokenValid(refreshToken, account, JWTUtils.TokenType.REFRESH)) {
                throw new UnauthorizedException("Refresh token is invalid");
            }

            RefreshTokenSession currentSession = requireActiveRefreshSession(refreshToken, account);
            String nextRefreshToken = issueRefreshToken(account);
            String nextTokenId = normalize(jwtUtils.extractTokenId(nextRefreshToken));
            revokeRefreshSession(currentSession, nextTokenId);
            String accessToken = jwtUtils.generateToken(account);
            return buildAuthResponse(account, accessToken, nextRefreshToken);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new UnauthorizedException("Refresh token is invalid");
        }
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        try {
            if (!jwtUtils.hasTokenType(refreshToken, JWTUtils.TokenType.REFRESH)) {
                return;
            }
            String tokenId = normalize(jwtUtils.extractTokenId(refreshToken));
            if (tokenId == null) {
                return;
            }
            refreshTokenSessionRepository.findByTokenIdForUpdate(tokenId)
                    .ifPresent(session -> revokeRefreshSession(session, null));
        } catch (JwtException | IllegalArgumentException ignored) {
            // Logout remains idempotent even if the client presents an invalid token.
        }
    }

    @CacheEvict(cacheNames = CacheNames.ADMIN_DASHBOARD, allEntries = true)
    public RegisterDealerResponse registerDealer(RegisterDealerRequest request) {
        String username = normalizeLoginIdentity(request.username());
        AccountValidationSupport.assertUsernameLength(username, "username");
        if (accountRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("Username already exists");
        }
        AccountValidationSupport.assertStrongPassword(request.password(), "password");

        String normalizedEmail = AccountValidationSupport.normalizeEmail(request.email());
        if (normalizedEmail != null && accountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("Email already exists");
        }

        String normalizedTaxCode = normalize(request.taxCode());
        if (normalizedTaxCode != null && dealerRepository.findByTaxCode(normalizedTaxCode).isPresent()) {
            throw new ConflictException("Tax code already exists");
        }
        String normalizedPhone = normalize(request.phone());
        AccountValidationSupport.assertOptionalVietnamPhone(normalizedPhone, "phone");
        if (normalizedPhone != null && dealerRepository.existsByPhoneAndIdNot(normalizedPhone, -1L)) {
            throw new ConflictException("Phone already exists");
        }

        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(normalizedEmail);
        dealer.setPassword(passwordEncoder.encode(request.password()));
        dealer.setBusinessName(normalize(request.businessName()));
        dealer.setContactName(normalize(request.contactName()));
        dealer.setTaxCode(normalizedTaxCode);
        dealer.setPhone(normalizedPhone);
        dealer.setAddressLine(normalize(request.addressLine()));
        dealer.setWard(normalize(request.ward()));
        dealer.setDistrict(normalize(request.district()));
        dealer.setCity(normalize(request.city()));
        dealer.setCountry(normalize(request.country()));
        dealer.setAvatarUrl(normalize(request.avatarUrl()));
        dealer.setCustomerStatus(CustomerStatus.UNDER_REVIEW);
        dealer.setRoles(new HashSet<>(Set.of(resolveRole("DEALER", "Default dealer role"))));

        Dealer saved = dealerRepository.save(dealer);
        dealerAccountLifecycleService.sendApplicationReceivedEmail(saved);
        RegisterDealerResponse response = new RegisterDealerResponse(saved.getId(), saved.getUsername(), "created");
        webSocketEventPublisher.publishDealerRegistrationFromAuth(response);
        return response;
    }

    private AuthResponse buildAuthResponse(Account account, String accessToken, String refreshToken) {
        AuthUserResponse user = new AuthUserResponse(
                account.getId(),
                account.getUsername(),
                account.getClass().getSimpleName().toUpperCase(),
                account.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet()),
                account instanceof Admin admin && Boolean.TRUE.equals(admin.getRequirePasswordChange())
        );
        return new AuthResponse(accessToken, refreshToken, "Bearer", jwtUtils.getAccessTokenExpirationMs(), user);
    }

    private void assertDealerPortalAccessIfRequired(Account account) {
        if (account instanceof Dealer) {
            dealerAccountLifecycleService.assertDealerPortalAccess(account);
        }
    }

    private Role resolveRole(String roleName, String description) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(roleName);
                    role.setDescription(description);
                    return roleRepository.save(role);
                });
    }

    private String normalize(String value) {
        return AccountValidationSupport.normalize(value);
    }

    private String normalizeLoginIdentity(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String issueRefreshToken(Account account) {
        String tokenId = UUID.randomUUID().toString();
        RefreshTokenSession session = new RefreshTokenSession();
        session.setAccount(account);
        session.setTokenId(tokenId);
        session.setExpiresAt(Instant.now().plusMillis(jwtUtils.getRefreshTokenExpirationMs()));
        refreshTokenSessionRepository.save(session);
        return jwtUtils.generateRefreshToken(tokenId, account);
    }

    private RefreshTokenSession requireActiveRefreshSession(String refreshToken, Account account) {
        String tokenId = normalize(jwtUtils.extractTokenId(refreshToken));
        if (tokenId == null) {
            throw new UnauthorizedException("Refresh token is invalid");
        }
        RefreshTokenSession session = refreshTokenSessionRepository.findByTokenIdForUpdate(tokenId)
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid"));
        if (session.getAccount() == null
                || session.getAccount().getId() == null
                || account.getId() == null
                || !account.getId().equals(session.getAccount().getId())) {
            throw new UnauthorizedException("Refresh token is invalid");
        }
        if (session.getRevokedAt() != null) {
            throw new UnauthorizedException("Refresh token is invalid");
        }
        if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }
        return session;
    }

    private void revokeRefreshSession(RefreshTokenSession session, String replacementTokenId) {
        if (session == null || session.getRevokedAt() != null) {
            return;
        }
        session.setRevokedAt(Instant.now());
        session.setReplacedByTokenId(normalize(replacementTokenId));
        refreshTokenSessionRepository.save(session);
    }
}
