package com.devwonder.backend.service;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.entity.Customer;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.CustomerRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerWarrantyManagementService {

    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final ProductSerialRepository productSerialRepository;
    private final DealerRepository dealerRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<WarrantyRegistrationResponse> list(Long dealerId) {
        if (dealerId != null) {
            if (!dealerRepository.existsById(dealerId)) {
                throw new ResourceNotFoundException("Dealer not found");
            }
            return warrantyRegistrationRepository.findByDealerIdOrderByCreatedAtDesc(dealerId).stream()
                    .map(this::toResponse)
                    .toList();
        }

        return warrantyRegistrationRepository.findAll().stream()
                .sorted(Comparator.comparing(WarrantyRegistration::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<WarrantyRegistrationResponse> list(Long dealerId, Pageable pageable) {
        Pageable effectivePageable = withDefaultSort(pageable, "createdAt");
        if (dealerId != null) {
            if (!dealerRepository.existsById(dealerId)) {
                throw new ResourceNotFoundException("Dealer not found");
            }
            return warrantyRegistrationRepository.findByDealerId(dealerId, effectivePageable).map(this::toResponse);
        }
        return warrantyRegistrationRepository.findAll(effectivePageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public WarrantyRegistrationResponse getById(Long id) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        return toResponse(registration);
    }

    @Transactional
    public WarrantyRegistrationResponse create(CreateWarrantyRegistrationRequest request) {
        ProductSerial productSerial = productSerialRepository.findById(request.productSerialId())
                .orElseThrow(() -> new ResourceNotFoundException("Product serial not found"));

        if (warrantyRegistrationRepository.findByProductSerialId(productSerial.getId()).isPresent()) {
            throw new ConflictException("Warranty registration already exists for this serial");
        }

        WarrantyRegistration registration = new WarrantyRegistration();
        apply(registration, request, productSerial, true);
        return toResponse(warrantyRegistrationRepository.save(registration));
    }

    @Transactional
    public WarrantyRegistrationResponse update(Long id, CreateWarrantyRegistrationRequest request) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        ProductSerial productSerial = productSerialRepository.findById(request.productSerialId())
                .orElseThrow(() -> new ResourceNotFoundException("Product serial not found"));

        warrantyRegistrationRepository.findByProductSerialId(productSerial.getId())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Warranty registration already exists for this serial");
                });

        apply(registration, request, productSerial, false);
        return toResponse(warrantyRegistrationRepository.save(registration));
    }

    @Transactional
    public void delete(Long id) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        warrantyRegistrationRepository.delete(registration);
    }

    private void apply(
            WarrantyRegistration registration,
            CreateWarrantyRegistrationRequest request,
            ProductSerial productSerial,
            boolean creating
    ) {
        WarrantyStatus previousStatus = registration.getStatus();
        Instant previousWarrantyEnd = registration.getWarrantyEnd();

        registration.setProductSerial(productSerial);

        Dealer dealer = resolveDealer(request, productSerial);
        Customer customer = resolveCustomer(request, productSerial);
        Order order = resolveOrder(request.orderId());

        registration.setDealer(dealer);
        registration.setCustomer(customer);
        registration.setOrder(order);
        registration.setCustomerName(customer == null ? registration.getCustomerName() : customer.getFullName());
        registration.setCustomerEmail(customer == null ? registration.getCustomerEmail() : customer.getEmail());
        registration.setCustomerPhone(customer == null ? registration.getCustomerPhone() : customer.getPhone());

        Instant warrantyStart = resolveWarrantyStart(request.warrantyStart(), registration.getWarrantyStart(), creating);
        registration.setWarrantyStart(warrantyStart);
        registration.setPurchaseDate(warrantyStart);
        registration.setWarrantyEnd(resolveWarrantyEnd(request.warrantyEnd(), warrantyStart, productSerial));
        registration.setWarrantyCode(buildWarrantyCode(productSerial));

        WarrantyStatus status = request.status() != null
                ? request.status()
                : (registration.getStatus() == null ? WarrantyStatus.ACTIVE : registration.getStatus());
        registration.setStatus(status);

        productSerial.setDealer(dealer);
        productSerial.setCustomer(customer);
        productSerial.setOrder(order);
        if (status == WarrantyStatus.ACTIVE) {
            productSerial.setStatus(ProductSerialStatus.WARRANTY);
        }
        productSerialRepository.save(productSerial);

        createWarrantyNotifications(registration, customer, dealer, creating, previousStatus, previousWarrantyEnd);
    }

    private Dealer resolveDealer(CreateWarrantyRegistrationRequest request, ProductSerial productSerial) {
        Long dealerId = request.dealerId();
        if (dealerId == null && productSerial.getDealer() != null) {
            dealerId = productSerial.getDealer().getId();
        }
        if (dealerId == null) {
            return null;
        }
        Long finalDealerId = dealerId;
        return dealerRepository.findById(finalDealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
    }

    private Customer resolveCustomer(CreateWarrantyRegistrationRequest request, ProductSerial productSerial) {
        Long customerId = request.customerId();
        if (customerId == null && productSerial.getCustomer() != null) {
            customerId = productSerial.getCustomer().getId();
        }
        if (customerId == null) {
            return null;
        }
        Long finalCustomerId = customerId;
        return customerRepository.findById(finalCustomerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    }

    private Order resolveOrder(Long orderId) {
        if (orderId == null) {
            return null;
        }
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private Instant resolveWarrantyStart(Instant requestedStart, Instant currentStart, boolean creating) {
        if (requestedStart != null) {
            return requestedStart;
        }
        if (!creating && currentStart != null) {
            return currentStart;
        }
        return Instant.now();
    }

    private Instant resolveWarrantyEnd(Instant requestedEnd, Instant warrantyStart, ProductSerial productSerial) {
        if (requestedEnd != null) {
            return requestedEnd;
        }
        Product product = productSerial.getProduct();
        int warrantyMonths = product == null || product.getWarrantyPeriod() == null || product.getWarrantyPeriod() <= 0
                ? 12
                : product.getWarrantyPeriod();
        return warrantyStart.atZone(ZoneOffset.UTC).plusMonths(warrantyMonths).toInstant();
    }

    private WarrantyRegistrationResponse toResponse(WarrantyRegistration registration) {
        ProductSerial productSerial = registration.getProductSerial();
        return new WarrantyRegistrationResponse(
                registration.getId(),
                productSerial == null ? null : productSerial.getId(),
                productSerial == null ? null : productSerial.getSerial(),
                registration.getDealer() == null ? null : registration.getDealer().getId(),
                registration.getCustomer() == null ? null : registration.getCustomer().getId(),
                registration.getOrder() == null ? null : registration.getOrder().getId(),
                registration.getWarrantyStart(),
                registration.getWarrantyEnd(),
                registration.getStatus(),
                registration.getCreatedAt()
        );
    }

    private Pageable withDefaultSort(Pageable pageable, String defaultSortBy) {
        if (pageable == null || pageable.isUnpaged()) {
            return PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, defaultSortBy));
        }
        if (pageable.getSort().isSorted()) {
            return pageable;
        }
        return PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, defaultSortBy)
        );
    }

    private void createWarrantyNotifications(
            WarrantyRegistration registration,
            Customer customer,
            Dealer dealer,
            boolean creating,
            WarrantyStatus previousStatus,
            Instant previousWarrantyEnd
    ) {
        if (customer == null) {
            return;
        }

        WarrantyStatus currentStatus = registration.getStatus();
        if (currentStatus != WarrantyStatus.ACTIVE) {
            return;
        }

        ProductSerial productSerial = registration.getProductSerial();
        Product product = productSerial == null ? null : productSerial.getProduct();
        String productName = product == null || product.getName() == null || product.getName().isBlank()
                ? "San pham"
                : product.getName();

        boolean justActivated = creating || previousStatus != WarrantyStatus.ACTIVE;
        if (justActivated) {
            String serial = productSerial == null ? "" : productSerial.getSerial();
            String dealerName = dealer == null ? "dai ly" : dealer.getBusinessName();
            notificationService.create(new CreateNotifyRequest(
                    customer.getId(),
                    "Bảo hành đã được kích hoạt",
                    String.format("Bảo hành cho %s (serial: %s) đã được kích hoạt bởi %s.", productName, serial, dealerName),
                    NotifyType.WARRANTY,
                    "/my-warranties"
            ));
        }

        Instant warrantyEnd = registration.getWarrantyEnd();
        long currentRemainingDays = computeRemainingDays(warrantyEnd);
        long previousRemainingDays = computeRemainingDays(previousWarrantyEnd);
        boolean shouldNotifyExpiringSoon = currentRemainingDays > 0
                && currentRemainingDays <= 30
                && (creating || previousRemainingDays > 30 || previousStatus != WarrantyStatus.ACTIVE);

        if (shouldNotifyExpiringSoon) {
            notificationService.create(new CreateNotifyRequest(
                    customer.getId(),
                    "Bảo hành sắp hết hạn",
                    String.format("Bảo hành của %s sẽ hết hạn trong %d ngày.", productName, currentRemainingDays),
                    NotifyType.SYSTEM,
                    "/my-warranties"
            ));
        }
    }

    private long computeRemainingDays(Instant warrantyEnd) {
        if (warrantyEnd == null) {
            return Long.MAX_VALUE;
        }
        long days = ChronoUnit.DAYS.between(Instant.now(), warrantyEnd);
        return Math.max(0L, days);
    }

    private String buildWarrantyCode(ProductSerial productSerial) {
        String serial = productSerial.getSerial() == null ? "UNKNOWN" : productSerial.getSerial().replaceAll("[^A-Za-z0-9]", "");
        String suffix = serial.length() <= 8 ? serial : serial.substring(serial.length() - 8);
        return "WAR-" + suffix.toUpperCase();
    }
}
