package com.devwonder.backend.service;

import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.support.AccountValidationSupport;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerWarrantyManagementService {

    private static final Logger log = LoggerFactory.getLogger(DealerWarrantyManagementService.class);
    private static final DateTimeFormatter WARRANTY_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final ProductSerialRepository productSerialRepository;
    private final DealerRepository dealerRepository;
    private final AsyncMailService asyncMailService;

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
        return create(null, request);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, allEntries = true)
    public WarrantyRegistrationResponse create(Long forcedDealerId, CreateWarrantyRegistrationRequest request) {
        ProductSerial productSerial = productSerialRepository.findById(request.productSerialId())
                .orElseThrow(() -> new ResourceNotFoundException("Product serial not found"));

        if (warrantyRegistrationRepository.findByProductSerialId(productSerial.getId()).isPresent()) {
            throw new ConflictException("Warranty registration already exists for this serial");
        }

        WarrantyRegistration registration = new WarrantyRegistration();
        apply(registration, request, productSerial, forcedDealerId);
        WarrantyRegistration saved = warrantyRegistrationRepository.save(registration);
        sendWarrantyConfirmationEmailIfPossible(saved, productSerial);
        return toResponse(saved);
    }

    @Transactional
    public WarrantyRegistrationResponse update(Long id, CreateWarrantyRegistrationRequest request) {
        return update(id, null, request);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, allEntries = true)
    public WarrantyRegistrationResponse update(Long id, Long forcedDealerId, CreateWarrantyRegistrationRequest request) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        ProductSerial productSerial = productSerialRepository.findById(request.productSerialId())
                .orElseThrow(() -> new ResourceNotFoundException("Product serial not found"));

        warrantyRegistrationRepository.findByProductSerialId(productSerial.getId())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Warranty registration already exists for this serial");
                });

        apply(registration, request, productSerial, forcedDealerId);
        WarrantyRegistration saved = warrantyRegistrationRepository.save(registration);
        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, allEntries = true)
    public void delete(Long id) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        ProductSerial productSerial = registration.getProductSerial();
        if (productSerial != null) {
            productSerial.setWarranty(null);
        }
        registration.setProductSerial(null);
        warrantyRegistrationRepository.delete(registration);
        if (productSerial != null) {
            productSerial.setStatus(resolveStatusAfterWarrantyDeletion(productSerial));
            productSerialRepository.save(productSerial);
        }
    }

    private void apply(
            WarrantyRegistration registration,
            CreateWarrantyRegistrationRequest request,
            ProductSerial productSerial,
            Long forcedDealerId
    ) {
        Dealer dealer = resolveDealer(forcedDealerId, productSerial);
        assertWarrantyEligibleOrder(productSerial.getOrder());
        if (productSerial.getStatus() == ProductSerialStatus.DEFECTIVE) {
            throw new BadRequestException("Defective serial cannot be activated for warranty");
        }
        LocalDate purchaseDate = request.purchaseDate();
        if (purchaseDate == null) {
            throw new BadRequestException("purchaseDate is required");
        }
        LocalDate today = LocalDate.now(WarrantyDateSupport.APP_ZONE);
        if (purchaseDate.isAfter(today)) {
            throw new BadRequestException("purchaseDate cannot be in the future");
        }
        if (productSerial.getOrder() != null && productSerial.getOrder().getCreatedAt() != null) {
            LocalDate orderDate = productSerial.getOrder().getCreatedAt()
                    .atZone(WarrantyDateSupport.APP_ZONE)
                    .toLocalDate();
            if (purchaseDate.isBefore(orderDate)) {
                throw new BadRequestException("purchaseDate cannot be earlier than order date");
            }
        }

        String customerName = normalize(request.customerName());
        String customerEmail = normalize(request.customerEmail());
        String customerPhone = normalize(request.customerPhone());
        String customerAddress = normalize(request.customerAddress());

        if (customerName == null) {
            throw new BadRequestException("customerName is required");
        }
        if (customerEmail == null) {
            throw new BadRequestException("customerEmail is required");
        }
        if (customerPhone == null) {
            throw new BadRequestException("customerPhone is required");
        }
        if (customerAddress == null) {
            throw new BadRequestException("customerAddress is required");
        }
        AccountValidationSupport.assertOptionalVietnamPhone(customerPhone, "customerPhone");

        Instant warrantyStart = purchaseDate.atStartOfDay(WarrantyDateSupport.APP_ZONE).toInstant();
        Instant warrantyEnd = purchaseDate.plusMonths(resolveWarrantyMonths(productSerial))
                .atStartOfDay(WarrantyDateSupport.APP_ZONE)
                .toInstant();

        registration.setProductSerial(productSerial);
        registration.setDealer(dealer);
        registration.setOrder(productSerial.getOrder());
        registration.setCustomerName(customerName);
        registration.setCustomerEmail(customerEmail);
        registration.setCustomerPhone(customerPhone);
        registration.setCustomerAddress(customerAddress);
        registration.setPurchaseDate(purchaseDate);
        registration.setWarrantyStart(warrantyStart);
        registration.setWarrantyEnd(warrantyEnd);
        if (registration.getWarrantyCode() == null || registration.getWarrantyCode().isBlank()) {
            registration.setWarrantyCode(buildWarrantyCode(productSerial));
        }

        WarrantyStatus nextStatus = registration.getStatus() == WarrantyStatus.VOID
                ? WarrantyStatus.VOID
                : resolveWarrantyStatus(warrantyEnd);
        registration.setStatus(nextStatus);

        productSerial.setDealer(dealer);
        productSerial.setStatus(resolveSerialStatus(nextStatus));
        productSerialRepository.save(productSerial);
    }

    private void assertWarrantyEligibleOrder(Order order) {
        if (order == null) {
            throw new BadRequestException("Warranty activation requires a shipping or completed order");
        }
        OrderStatus status = order.getStatus();
        if (status != OrderStatus.SHIPPING && status != OrderStatus.COMPLETED) {
            throw new BadRequestException("Warranty activation requires a shipping or completed order");
        }
    }

    private Dealer resolveDealer(Long forcedDealerId, ProductSerial productSerial) {
        Long productDealerId = productSerial.getDealer() == null ? null : productSerial.getDealer().getId();
        if (forcedDealerId != null && productDealerId == null) {
            throw new ResourceNotFoundException("Product serial is not assigned to this dealer");
        }
        if (forcedDealerId != null && productDealerId != null && !forcedDealerId.equals(productDealerId)) {
            throw new ResourceNotFoundException("Product serial is not assigned to this dealer");
        }

        Long effectiveDealerId = forcedDealerId != null ? forcedDealerId : productDealerId;
        if (effectiveDealerId == null) {
            throw new BadRequestException("Product serial is not assigned to a dealer");
        }

        return dealerRepository.findById(effectiveDealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
    }

    private int resolveWarrantyMonths(ProductSerial productSerial) {
        Product product = productSerial.getProduct();
        if (product == null || product.getWarrantyPeriod() == null || product.getWarrantyPeriod() <= 0) {
            return 12;
        }
        return product.getWarrantyPeriod();
    }

    private WarrantyStatus resolveWarrantyStatus(Instant warrantyEnd) {
        return WarrantyDateSupport.isExpired(warrantyEnd) ? WarrantyStatus.EXPIRED : WarrantyStatus.ACTIVE;
    }

    private ProductSerialStatus resolveSerialStatus(WarrantyStatus warrantyStatus) {
        return warrantyStatus == WarrantyStatus.ACTIVE
                ? ProductSerialStatus.WARRANTY
                : ProductSerialStatus.ASSIGNED;
    }

    private ProductSerialStatus resolveStatusAfterWarrantyDeletion(ProductSerial productSerial) {
        return productSerial.getOrder() == null
                ? ProductSerialStatus.AVAILABLE
                : ProductSerialStatus.ASSIGNED;
    }

    private WarrantyRegistrationResponse toResponse(WarrantyRegistration registration) {
        ProductSerial productSerial = registration.getProductSerial();
        return new WarrantyRegistrationResponse(
                registration.getId(),
                productSerial == null ? null : productSerial.getId(),
                productSerial == null ? null : productSerial.getSerial(),
                registration.getDealer() == null ? null : registration.getDealer().getId(),
                registration.getOrder() == null ? null : registration.getOrder().getId(),
                registration.getCustomerName(),
                registration.getCustomerEmail(),
                registration.getCustomerPhone(),
                registration.getCustomerAddress(),
                registration.getPurchaseDate(),
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

    private String buildWarrantyCode(ProductSerial productSerial) {
        String serial = productSerial.getSerial() == null
                ? "UNKNOWN"
                : productSerial.getSerial().replaceAll("[^A-Za-z0-9]", "");
        String suffix = serial.length() <= 4 ? serial : serial.substring(serial.length() - 4);
        Long productSerialId = productSerial.getId();
        if (productSerialId == null) {
            return "WAR-" + (serial.isBlank() ? suffix.toUpperCase() : serial.toUpperCase());
        }
        return "WAR-" + suffix.toUpperCase() + "-" + productSerialId;
    }

    private void sendWarrantyConfirmationEmailIfPossible(WarrantyRegistration saved, ProductSerial productSerial) {
        String recipient = normalize(saved.getCustomerEmail());
        if (recipient == null || !asyncMailService.isEnabled()) {
            return;
        }
        String customerName = saved.getCustomerName() != null ? saved.getCustomerName() : "Quý khách";
        String warrantyCode = saved.getWarrantyCode() != null ? saved.getWarrantyCode() : "";
        String productName = productSerial.getProduct() != null && productSerial.getProduct().getName() != null
                ? productSerial.getProduct().getName()
                : productSerial.getSerial();
        String startDate = formatInstant(saved.getWarrantyStart());
        String endDate = formatInstant(saved.getWarrantyEnd());
        String subject = "4ThiTek — Xác nhận đăng ký bảo hành " + warrantyCode;
        String body = """
                Xin chào %s,

                Sản phẩm của bạn đã được đăng ký bảo hành thành công.

                Sản phẩm: %s
                Mã bảo hành: %s
                Ngày bắt đầu: %s
                Ngày hết hạn: %s

                Vui lòng lưu giữ thông tin này để được hỗ trợ khi cần thiết.

                Trân trọng,
                4ThiTek
                """.formatted(customerName, productName, warrantyCode, startDate, endDate);
        asyncMailService.sendText(recipient, subject, body);
    }

    private String formatInstant(Instant instant) {
        if (instant == null) {
            return "";
        }
        return WARRANTY_DATE_FMT.format(instant.atZone(WarrantyDateSupport.APP_ZONE).toLocalDate());
    }

    private String normalize(String value) {
        return AccountValidationSupport.normalize(value);
    }
}
