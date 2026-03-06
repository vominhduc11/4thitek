package com.devwonder.backend.service;

import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.dto.customer.CustomerProfileResponse;
import com.devwonder.backend.dto.customer.CustomerWarrantyDetailResponse;
import com.devwonder.backend.dto.customer.CustomerWarrantySummaryResponse;
import com.devwonder.backend.dto.customer.UpdateCustomerProfileRequest;
import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.entity.Customer;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.CustomerRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerPortalService {

    private final CustomerRepository customerRepository;
    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final NotificationService notificationService;
    private final NotifyRepository notifyRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public CustomerProfileResponse getProfile(String username) {
        return toProfile(requireCustomerByUsername(username));
    }

    @Transactional
    public CustomerProfileResponse updateProfile(String username, UpdateCustomerProfileRequest request) {
        Customer customer = requireCustomerByUsername(username);

        if (request.fullName() != null) {
            String fullName = normalize(request.fullName());
            if (fullName == null) {
                throw new BadRequestException("fullName must not be blank");
            }
            customer.setFullName(fullName);
        }

        if (request.phone() != null) {
            String phone = normalize(request.phone());
            if (phone == null) {
                throw new BadRequestException("phone must not be blank");
            }
            if (customerRepository.existsByPhoneAndIdNot(phone, customer.getId())) {
                throw new ConflictException("Phone already exists");
            }
            customer.setPhone(phone);
        }

        if (request.email() != null) {
            customer.setEmail(normalize(request.email()));
        }

        if (request.avatarUrl() != null) {
            String avatarUrl = normalize(request.avatarUrl());
            if (avatarUrl != null && !isValidUrl(avatarUrl)) {
                throw new BadRequestException("avatarUrl must be a valid URL");
            }
            customer.setAvatarUrl(avatarUrl);
        }

        return toProfile(customerRepository.save(customer));
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        Customer customer = requireCustomerByUsername(username);
        if (!passwordEncoder.matches(request.currentPassword(), customer.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        customer.setPassword(passwordEncoder.encode(request.newPassword()));
        customerRepository.save(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerWarrantySummaryResponse> getWarranties(String username) {
        Customer customer = requireCustomerByUsername(username);
        return warrantyRegistrationRepository.findByCustomerIdOrderByWarrantyEndDesc(customer.getId()).stream()
                .map(this::toWarrantySummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<CustomerWarrantySummaryResponse> getWarranties(String username, Pageable pageable) {
        Customer customer = requireCustomerByUsername(username);
        return warrantyRegistrationRepository.findByCustomerId(customer.getId(), pageable).map(this::toWarrantySummary);
    }

    @Transactional(readOnly = true)
    public CustomerWarrantyDetailResponse getWarrantyDetail(String username, UUID warrantyId) {
        Customer customer = requireCustomerByUsername(username);
        WarrantyRegistration registration = warrantyRegistrationRepository.findByIdAndCustomerId(warrantyId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        return toWarrantyDetail(registration);
    }

    @Transactional(readOnly = true)
    public List<NotifyResponse> getNotifications(String username) {
        Customer customer = requireCustomerByUsername(username);
        return notificationService.getByAccount(customer.getId());
    }

    @Transactional(readOnly = true)
    public Page<NotifyResponse> getNotifications(String username, Pageable pageable) {
        Customer customer = requireCustomerByUsername(username);
        return notificationService.getByAccount(customer.getId(), pageable);
    }

    @Transactional
    public NotifyResponse markNotificationRead(String username, UUID notifyId) {
        Customer customer = requireCustomerByUsername(username);
        Notify notify = notifyRepository.findByIdAndAccountId(notifyId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        return notificationService.markRead(notify.getId());
    }

    @Transactional
    public int markAllNotificationsRead(String username) {
        Customer customer = requireCustomerByUsername(username);
        return notificationService.markAllReadByAccount(customer.getId());
    }

    private Customer requireCustomerByUsername(String username) {
        return customerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    }

    private CustomerProfileResponse toProfile(Customer customer) {
        return new CustomerProfileResponse(
                customer.getId(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getAvatarUrl(),
                customer.getCreatedAt()
        );
    }

    private CustomerWarrantySummaryResponse toWarrantySummary(WarrantyRegistration registration) {
        ProductSerial productSerial = registration.getProductSerial();
        Product product = productSerial == null ? null : productSerial.getProduct();
        return new CustomerWarrantySummaryResponse(
                registration.getId(),
                product == null ? "N/A" : product.getName(),
                product == null ? null : product.getImage(),
                productSerial == null ? "N/A" : productSerial.getSerial(),
                resolveStatus(registration),
                registration.getWarrantyStart(),
                registration.getWarrantyEnd(),
                computeRemainingDays(registration.getWarrantyEnd()),
                resolveDealerName(registration.getDealer())
        );
    }

    private CustomerWarrantyDetailResponse toWarrantyDetail(WarrantyRegistration registration) {
        ProductSerial productSerial = registration.getProductSerial();
        Product product = productSerial == null ? null : productSerial.getProduct();
        Dealer dealer = registration.getDealer();
        return new CustomerWarrantyDetailResponse(
                registration.getId(),
                product == null ? null : product.getId(),
                product == null ? "N/A" : product.getName(),
                product == null ? null : product.getImage(),
                product == null ? null : product.getSku(),
                productSerial == null ? "N/A" : productSerial.getSerial(),
                resolveStatus(registration),
                registration.getWarrantyStart(),
                registration.getWarrantyEnd(),
                computeRemainingDays(registration.getWarrantyEnd()),
                dealer == null ? null : dealer.getId(),
                resolveDealerName(dealer),
                registration.getCreatedAt()
        );
    }

    private WarrantyStatus resolveStatus(WarrantyRegistration registration) {
        if (registration.getStatus() == WarrantyStatus.VOID) {
            return WarrantyStatus.VOID;
        }
        Instant warrantyEnd = registration.getWarrantyEnd();
        if (warrantyEnd != null && warrantyEnd.isBefore(Instant.now())) {
            return WarrantyStatus.EXPIRED;
        }
        if (registration.getStatus() == WarrantyStatus.EXPIRED) {
            return WarrantyStatus.EXPIRED;
        }
        return WarrantyStatus.ACTIVE;
    }

    private long computeRemainingDays(Instant warrantyEnd) {
        if (warrantyEnd == null) {
            return 0L;
        }
        long days = ChronoUnit.DAYS.between(
                Instant.now().atZone(ZoneOffset.UTC).toLocalDate(),
                warrantyEnd.atZone(ZoneOffset.UTC).toLocalDate()
        );
        return Math.max(0L, days);
    }

    private String resolveDealerName(Dealer dealer) {
        if (dealer == null || dealer.getBusinessName() == null || dealer.getBusinessName().isBlank()) {
            return "N/A";
        }
        return dealer.getBusinessName();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isValidUrl(String value) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (URISyntaxException ex) {
            return false;
        }
    }
}
