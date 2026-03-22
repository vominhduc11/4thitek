package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.admin.AdminReportExportResponse;
import com.devwonder.backend.dto.admin.AdminReportExportType;
import com.devwonder.backend.dto.admin.AdminReportFormat;
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
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.service.AdminReportingService;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
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
    private ProductRepository productRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BulkDiscountRepository bulkDiscountRepository;

    @BeforeEach
    void setUp() {
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

    private void createDiscountedOrder() {
        Product product = new Product();
        product.setSku("RPT-SKU-001");
        product.setName("Report Product");
        product.setIsDeleted(false);
        product.setRetailPrice(new BigDecimal("100000"));
        product.setStock(10);
        product = productRepository.save(product);

        Dealer dealer = new Dealer();
        dealer.setUsername("report.dealer@example.com");
        dealer.setPassword("hashed-password");
        dealer.setEmail("report.dealer@example.com");
        dealer.setBusinessName("VAT Dealer");
        dealer.setContactName("VAT Dealer");
        dealer.setTaxCode("RPT-TAX-001");
        dealer.setPhone("0900000001");
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        dealer = dealerRepository.save(dealer);

        BulkDiscount discount = new BulkDiscount();
        discount.setLabel("Global 10%");
        discount.setRangeLabel("1+");
        discount.setMinQuantity(1);
        discount.setDiscountPercent(new BigDecimal("10"));
        discount.setStatus(DiscountRuleStatus.ACTIVE);
        bulkDiscountRepository.save(discount);

        Order order = new Order();
        order.setOrderCode("RPT-001");
        order.setDealer(dealer);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setIsDeleted(false);
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
