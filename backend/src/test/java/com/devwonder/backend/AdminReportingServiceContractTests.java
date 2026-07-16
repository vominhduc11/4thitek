package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.admin.AdminReportExportResponse;
import com.devwonder.backend.dto.admin.AdminReportExportType;
import com.devwonder.backend.dto.admin.AdminReportFormat;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.AdminReportingService;
import com.devwonder.backend.service.AdminSettingsService;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:admin_reporting_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=false",
        "app.mail.enabled=false"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AdminReportingServiceContractTests {

    @Autowired
    private AdminReportingService adminReportingService;

    @Autowired
    private AdminSettingsService adminSettingsService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BulkDiscountRepository bulkDiscountRepository;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        bulkDiscountRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    void ordersReportUsesOrderPricingContractIncludingDiscountAndVat() throws Exception {
        createDiscountedOrder();

        AdminReportExportResponse report = adminReportingService.export(
                AdminReportExportType.ORDERS,
                AdminReportFormat.XLSX
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(report.content()))) {
            var row = workbook.getSheetAt(0).getRow(4);
            assertThat(row.getCell(0).getStringCellValue()).isEqualTo("RPT-001");
            assertThat(row.getCell(4).getStringCellValue()).isEqualTo("109000.00");
            assertThat(row.getCell(5).getStringCellValue()).isEqualTo("0.00");
        }
    }

    @Test
    void revenueReportUsesOrderPricingContractIncludingDiscountAndVat() throws Exception {
        createDiscountedOrder();

        AdminReportExportResponse report = adminReportingService.export(
                AdminReportExportType.REVENUE,
                AdminReportFormat.XLSX
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(report.content()))) {
            var row = workbook.getSheetAt(0).getRow(4);
            assertThat(row.getCell(0).getStringCellValue()).isEqualTo("VAT Dealer");
            assertThat(row.getCell(2).getStringCellValue()).isEqualTo("109000.00");
            assertThat(row.getCell(3).getStringCellValue()).isEqualTo("0.00");
            assertThat(row.getCell(4).getStringCellValue()).isEqualTo("109000.00");
        }
    }

    @Test
    void ordersReportUsesConfiguredVatPercentFromAdminSettings() throws Exception {
        adminSettingsService.updateSettings(new UpdateAdminSettingsRequest(
                null,
                null,
                null,
                null,
                8,
                null,
                null,
                null
        ));
        createDiscountedOrder();

        AdminReportExportResponse report = adminReportingService.export(
                AdminReportExportType.ORDERS,
                AdminReportFormat.XLSX
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(report.content()))) {
            var row = workbook.getSheetAt(0).getRow(4);
            assertThat(row.getCell(4).getStringCellValue()).isEqualTo("107200.00");
        }
    }

    @Test
    void ordersReportExcludesSoftDeletedOrders() throws Exception {
        createDiscountedOrder();
        createDiscountedOrder("RPT-DELETED", true);

        AdminReportExportResponse report = adminReportingService.export(
                AdminReportExportType.ORDERS,
                AdminReportFormat.XLSX
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(report.content()))) {
            var sheet = workbook.getSheetAt(0);
            assertThat(sheet.getLastRowNum()).isEqualTo(4);
            assertThat(sheet.getRow(4).getCell(0).getStringCellValue()).isEqualTo("RPT-001");
        }
    }

    @Test
    void warrantiesReportAppliesFromToDateRange() throws Exception {
        createWarrantyAt("WR-OLD", Instant.parse("2026-01-05T00:00:00Z"));
        createWarrantyAt("WR-NEW", Instant.parse("2026-06-10T00:00:00Z"));

        List<String> narrowed = firstColumnDataValues(adminReportingService.export(
                AdminReportExportType.WARRANTIES,
                AdminReportFormat.XLSX,
                Instant.parse("2026-06-01T00:00:00Z"),
                Instant.parse("2026-06-30T00:00:00Z")
        ));
        assertThat(narrowed).containsExactly("WR-NEW");

        List<String> unfiltered = firstColumnDataValues(adminReportingService.export(
                AdminReportExportType.WARRANTIES,
                AdminReportFormat.XLSX
        ));
        assertThat(unfiltered).containsExactlyInAnyOrder("WR-OLD", "WR-NEW");

        List<String> inverted = firstColumnDataValues(adminReportingService.export(
                AdminReportExportType.WARRANTIES,
                AdminReportFormat.XLSX,
                Instant.parse("2026-07-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z")
        ));
        assertThat(inverted).isEmpty();
    }

    @Test
    void serialsReportAppliesFromToDateRangeOnImportedAt() throws Exception {
        createSerialImportedAt("SN-OLD-001", Instant.parse("2026-02-01T00:00:00Z"));
        createSerialImportedAt("SN-NEW-001", Instant.parse("2026-06-15T00:00:00Z"));

        List<String> narrowed = firstColumnDataValues(adminReportingService.export(
                AdminReportExportType.SERIALS,
                AdminReportFormat.XLSX,
                Instant.parse("2026-06-01T00:00:00Z"),
                Instant.parse("2026-06-30T00:00:00Z")
        ));
        assertThat(narrowed).containsExactly("SN-NEW-001");

        List<String> unfiltered = firstColumnDataValues(adminReportingService.export(
                AdminReportExportType.SERIALS,
                AdminReportFormat.XLSX
        ));
        assertThat(unfiltered).containsExactlyInAnyOrder("SN-OLD-001", "SN-NEW-001");

        List<String> inverted = firstColumnDataValues(adminReportingService.export(
                AdminReportExportType.SERIALS,
                AdminReportFormat.XLSX,
                Instant.parse("2026-07-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z")
        ));
        assertThat(inverted).isEmpty();
    }

    private void createWarrantyAt(String warrantyCode, Instant createdAt) {
        WarrantyRegistration registration = new WarrantyRegistration();
        registration.setWarrantyCode(warrantyCode);
        registration.setCustomerName("Khách hàng " + warrantyCode);
        registration.setWarrantyStart(createdAt);
        registration.setWarrantyEnd(createdAt.plusSeconds(365L * 24 * 3600));
        warrantyRegistrationRepository.saveAndFlush(registration);
        // created_at là @CreationTimestamp — ghi đè trực tiếp để dựng fixture theo ngày đăng ký
        jdbcTemplate.update(
                "update warranties set created_at = ? where warranty_code = ?",
                java.sql.Timestamp.from(createdAt),
                warrantyCode
        );
    }

    private void createSerialImportedAt(String serialNumber, Instant importedAt) {
        ProductSerial serial = new ProductSerial();
        serial.setSerial(serialNumber);
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        productSerialRepository.saveAndFlush(serial);
        // imported_at là @CreationTimestamp updatable=false — ghi đè trực tiếp để dựng fixture
        jdbcTemplate.update(
                "update product_serials set imported_at = ? where serial = ?",
                java.sql.Timestamp.from(importedAt),
                serialNumber
        );
    }

    /** Đọc cột đầu của các dòng dữ liệu (bỏ các dòng tiêu đề, dữ liệu bắt đầu từ row 4). */
    private List<String> firstColumnDataValues(AdminReportExportResponse report) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(report.content()))) {
            var sheet = workbook.getSheetAt(0);
            List<String> values = new ArrayList<>();
            for (int rowIndex = 4; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                var row = sheet.getRow(rowIndex);
                if (row == null || row.getCell(0) == null) {
                    continue;
                }
                String value = row.getCell(0).getStringCellValue();
                if (value != null && !value.isBlank()) {
                    values.add(value);
                }
            }
            return values;
        }
    }

    private void createDiscountedOrder() {
        createDiscountedOrder("RPT-001", false);
    }

    private void createDiscountedOrder(String orderCode, boolean deleted) {
        Product product = new Product();
        product.setSku(orderCode + "-SKU");
        product.setName("Report Product " + orderCode);
        product.setIsDeleted(false);
        product.setRetailPrice(new BigDecimal("100000"));
        product.setStock(10);
        product = productRepository.save(product);

        Dealer dealer = new Dealer();
        dealer.setUsername(orderCode.toLowerCase() + "@example.com");
        dealer.setPassword("hashed-password");
        dealer.setEmail(orderCode.toLowerCase() + "@example.com");
        dealer.setBusinessName("VAT Dealer");
        dealer.setContactName("VAT Dealer");
        dealer.setTaxCode(orderCode + "-TAX");
        dealer.setPhone("09" + String.format("%08d", Math.abs(orderCode.hashCode()) % 100_000_000));
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        dealer = dealerRepository.save(dealer);

        BulkDiscount discount = new BulkDiscount();
        discount.setFromQuantity(1);
        discount.setToQuantity(null);
        discount.setDiscountPercent(new BigDecimal("10"));
        discount.setStatus(DiscountRuleStatus.ACTIVE);
        bulkDiscountRepository.save(discount);

        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setDealer(dealer);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setIsDeleted(deleted);
        order.setShippingFee(10000);
        order.setPaidAmount(BigDecimal.ZERO);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(1);
        item.setUnitPrice(new BigDecimal("100000"));

        order.setOrderItems(new LinkedHashSet<>());
        order.getOrderItems().add(item);
        orderRepository.save(order);
    }
}
