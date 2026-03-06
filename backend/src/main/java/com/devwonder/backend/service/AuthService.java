package com.devwonder.backend.service;

import com.devwonder.backend.dto.auth.AuthResponse;
import com.devwonder.backend.dto.auth.AuthUserResponse;
import com.devwonder.backend.dto.auth.LoginRequest;
import com.devwonder.backend.dto.auth.RefreshTokenRequest;
import com.devwonder.backend.dto.auth.RegisterCustomerRequest;
import com.devwonder.backend.dto.auth.RegisterDealerRequest;
import com.devwonder.backend.dto.auth.RegisterDealerResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Customer;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.CustomerRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.security.JWTUtils;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final DealerRepository dealerRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtils jwtUtils;
    private final WebSocketEventPublisher webSocketEventPublisher;

    @Value("${jwt.access-token-expiration-ms:1800000}")
    private long accessTokenExpirationMs;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        Account account = accountRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        String accessToken = jwtUtils.generateToken(account);
        String refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), account);
        AuthResponse response = buildAuthResponse(account, accessToken, refreshToken);
        webSocketEventPublisher.publishLoginConfirmed(response.user());
        return response;
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (jwtUtils.isTokenExpired(request.refreshToken())) {
            throw new BadRequestException("Refresh token expired");
        }
        String username = jwtUtils.extractUsername(request.refreshToken());
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        String accessToken = jwtUtils.generateToken(account);
        return buildAuthResponse(account, accessToken, request.refreshToken());
    }

    public RegisterDealerResponse registerDealer(RegisterDealerRequest request) {
        String username = normalize(request.username());
        if (username == null) {
            throw new BadRequestException("username is required");
        }
        if (accountRepository.existsByUsername(username)) {
            throw new ConflictException("Username already exists");
        }

        String normalizedTaxCode = normalize(request.taxCode());
        if (normalizedTaxCode != null && dealerRepository.findByTaxCode(normalizedTaxCode).isPresent()) {
            throw new ConflictException("Tax code already exists");
        }

        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setPassword(passwordEncoder.encode(request.password()));
        dealer.setBusinessName(normalize(request.businessName()));
        dealer.setTaxCode(normalizedTaxCode);
        dealer.setPhone(normalize(request.phone()));
        dealer.setAddressLine(normalize(request.addressLine()));
        dealer.setWard(normalize(request.ward()));
        dealer.setDistrict(normalize(request.district()));
        dealer.setCity(normalize(request.city()));
        dealer.setCountry(Optional.ofNullable(normalize(request.country())).orElse("Vietnam"));
        dealer.setEmail(normalize(request.email()));
        dealer.setAvatarUrl(normalize(request.avatarUrl()));
        dealer.setRoles(new HashSet<>(Set.of(resolveDefaultRole())));

        Dealer saved = dealerRepository.save(dealer);
        RegisterDealerResponse response = new RegisterDealerResponse(saved.getId(), saved.getUsername(), "created");
        webSocketEventPublisher.publishDealerRegistrationFromAuth(response);
        return response;
    }

    public AuthResponse registerCustomer(RegisterCustomerRequest request) {
        String username = normalize(request.username());
        if (username == null) {
            throw new BadRequestException("username is required");
        }
        if (accountRepository.existsByUsername(username)) {
            throw new ConflictException("Username already exists");
        }

        String normalizedPhone = normalize(request.phone());
        if (normalizedPhone == null) {
            throw new BadRequestException("phone is required");
        }
        if (!normalizedPhone.matches("^0\\d{9}$")) {
            throw new BadRequestException("phone must be a valid 10-digit Vietnam number");
        }
        if (customerRepository.existsByPhone(normalizedPhone)) {
            throw new ConflictException("Phone already exists");
        }

        Customer customer = new Customer();
        customer.setUsername(username);
        customer.setPassword(passwordEncoder.encode(request.password()));
        customer.setFullName(normalize(request.fullName()));
        customer.setPhone(normalizedPhone);
        customer.setEmail(normalize(request.email()));
        customer.setRoles(new HashSet<>(Set.of(resolveRole("CUSTOMER", "Default customer role"))));

        Customer saved = customerRepository.save(customer);
        String accessToken = jwtUtils.generateToken(saved);
        String refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), saved);
        AuthResponse response = buildAuthResponse(saved, accessToken, refreshToken);
        webSocketEventPublisher.publishLoginConfirmed(response.user());
        return response;
    }

    private AuthResponse buildAuthResponse(Account account, String accessToken, String refreshToken) {
        AuthUserResponse user = new AuthUserResponse(
                account.getId(),
                account.getUsername(),
                account.getClass().getSimpleName().toUpperCase(),
                account.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet())
        );
        return new AuthResponse(accessToken, refreshToken, "Bearer", accessTokenExpirationMs, user);
    }

    private Role resolveDefaultRole() {
        return resolveRole("USER", "Default dealer role");
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
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
