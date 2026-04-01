package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminReportExportResponse;
import com.devwonder.backend.dto.admin.AdminReportExportType;
import com.devwonder.backend.dto.admin.AdminReportFormat;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.support.OrderPricingSupport;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import com.devwonder.backend.service.support.WarrantyStatusSupport;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminReportingService {

    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter FILE_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(REPORT_ZONE);
    private static final DateTimeFormatter DISPLAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(REPORT_ZONE);

    private final OrderRepository orderRepository;
    private final BulkDiscountRepository bulkDiscountRepository;
    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final ProductSerialRepository productSerialRepository;
    private final AdminSettingsService adminSettingsService;

    @Transactional(readOnly = true)
    public AdminReportExportResponse export(AdminReportExportType type, AdminReportFormat format) {
        return export(type, format, null, null);
    }

    @Transactional(readOnly = true)
    public AdminReportExportResponse export(
            AdminReportExportType type,
            AdminReportFormat format,
            Instant from,
            Instant to
    ) {
        TableReport report = buildReport(type, from, to);
        byte[] content = switch (format) {
            case XLSX -> renderXlsx(report);
            case PDF -> renderPdf(report);
        };
        String extension = format.name().toLowerCase(Locale.ROOT);
        String fileName = type.name().toLowerCase(Locale.ROOT) + "-report-" + FILE_DATE_FORMAT.format(Instant.now()) + "." + extension;
        String contentType = format == AdminReportFormat.XLSX
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/pdf";
        return new AdminReportExportResponse(fileName, contentType, content);
    }

    private TableReport buildReport(AdminReportExportType type, Instant from, Instant to) {
        List<BulkDiscount> activeDiscountRules = bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
        return switch (type) {
            case ORDERS -> buildOrdersReport(activeDiscountRules, from, to);
            case REVENUE -> buildRevenueReport(activeDiscountRules, from, to);
            case WARRANTIES -> buildWarrantiesReport();
            case SERIALS -> buildSerialsReport();
        };
    }

    private TableReport buildOrdersReport(List<BulkDiscount> activeDiscountRules, Instant from, Instant to) {
        List<Order> orders = orderRepository.findVisibleByCreatedAtDesc(org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .filter(order -> from == null || (order.getCreatedAt() != null && !order.getCreatedAt().isBefore(from)))
                .filter(order -> to == null || (order.getCreatedAt() != null && !order.getCreatedAt().isAfter(to)))
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<List<String>> rows = orders.stream()
                .map(order -> List.of(
                        safe(order.getOrderCode()),
                        dealerName(order.getDealer()),
                        safeEnum(order.getStatus()),
                        safeEnum(order.getPaymentStatus()),
                        formatMoney(calculateTotalAmount(order, activeDiscountRules)),
                        formatMoney(order.getPaidAmount()),
                        String.valueOf(order.getOrderItems() == null ? 0 : order.getOrderItems().size()),
                        formatDate(order.getCreatedAt())
                ))
                .toList();

        return new TableReport(
                "Orders Report",
                List.of("Order Code", "Dealer", "Status", "Payment", "Total", "Paid", "Items", "Created At"),
                rows
        );
    }

    private TableReport buildRevenueReport(List<BulkDiscount> activeDiscountRules, Instant from, Instant to) {
        Map<String, DealerRevenueRow> summary = new LinkedHashMap<>();
        for (Order order : orderRepository.findVisibleByCreatedAtDesc(org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .filter(o -> from == null || (o.getCreatedAt() != null && !o.getCreatedAt().isBefore(from)))
                .filter(o -> to == null || (o.getCreatedAt() != null && !o.getCreatedAt().isAfter(to)))
                .toList()) {
            Dealer dealer = order.getDealer();
            String key = dealer == null ? "unassigned" : String.valueOf(dealer.getId());
            DealerRevenueRow row = summary.computeIfAbsent(key, ignored ->
                    new DealerRevenueRow(
                            dealer == null ? "N/A" : dealerName(dealer),
                            BigDecimal.ZERO,
                            BigDecimal.ZERO,
                            0,
                            null
                    )
            );
            row.totalAmount = row.totalAmount.add(calculateTotalAmount(order, activeDiscountRules));
            row.paidAmount = row.paidAmount.add(nullSafe(order.getPaidAmount()));
            row.orderCount += 1;
            if (order.getCreatedAt() != null && (row.lastOrderAt == null || order.getCreatedAt().isAfter(row.lastOrderAt))) {
                row.lastOrderAt = order.getCreatedAt();
            }
        }

        List<List<String>> rows = summary.values().stream()
                .sorted(Comparator.comparing((DealerRevenueRow row) -> row.totalAmount).reversed())
                .map(row -> List.of(
                        row.dealerName,
                        String.valueOf(row.orderCount),
                        formatMoney(row.totalAmount),
                        formatMoney(row.paidAmount),
                        formatMoney(row.totalAmount.subtract(row.paidAmount)),
                        formatDate(row.lastOrderAt)
                ))
                .toList();

        return new TableReport(
                "Revenue Report",
                List.of("Dealer", "Orders", "Gross Revenue", "Paid Revenue", "Outstanding", "Last Order"),
                rows
        );
    }

    private TableReport buildWarrantiesReport() {
        List<List<String>> rows = warrantyRegistrationRepository.findAll().stream()
                .sorted(Comparator.comparing(WarrantyRegistration::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(registration -> {
                    ProductSerial productSerial = registration.getProductSerial();
                    Product product = productSerial == null ? null : productSerial.getProduct();
                    return List.of(
                            safe(registration.getWarrantyCode()),
                            product == null ? "N/A" : safe(product.getName()),
                            productSerial == null ? "N/A" : safe(productSerial.getSerial()),
                            dealerName(registration.getDealer()),
                            firstNonBlank(registration.getCustomerName(), "N/A"),
                            safeEnum(resolveWarrantyStatus(registration)),
                            formatDate(registration.getWarrantyStart()),
                            formatDate(registration.getWarrantyEnd())
                    );
                })
                .toList();

        return new TableReport(
                "Warranties Report",
                List.of("Warranty Code", "Product", "Serial", "Dealer", "Customer", "Status", "Start", "End"),
                rows
        );
    }

    private TableReport buildSerialsReport() {
        List<List<String>> rows = productSerialRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductSerial::getImportedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(serial -> {
                    Product product = serial.getProduct();
                    return List.of(
                            safe(serial.getSerial()),
                            product == null ? "N/A" : safe(product.getName()),
                            safe(product == null ? null : product.getSku()),
                            safeEnum(serial.getStatus()),
                            safe(serial.getWarehouseName()),
                            dealerName(serial.getDealer()),
                            firstNonBlank(serial.getWarranty() == null ? null : serial.getWarranty().getCustomerName(), "N/A"),
                            formatDate(serial.getImportedAt())
                    );
                })
                .toList();

        return new TableReport(
                "Serial Inventory Report",
                List.of("Serial", "Product", "SKU", "Status", "Warehouse", "Dealer", "Customer", "Imported At"),
                rows
        );
    }

    private byte[] renderXlsx(TableReport report) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Report");

            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row titleRow = sheet.createRow(0);
            titleRow.createCell(0).setCellValue(report.title());
            titleRow.getCell(0).setCellStyle(titleStyle);

            Row generatedRow = sheet.createRow(1);
            generatedRow.createCell(0).setCellValue("Generated at");
            generatedRow.createCell(1).setCellValue(formatDate(Instant.now()));

            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < report.headers().size(); i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(report.headers().get(i));
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 4;
            for (List<String> rowValues : report.rows()) {
                Row row = sheet.createRow(rowIndex++);
                for (int i = 0; i < rowValues.size(); i++) {
                    row.createCell(i).setCellValue(rowValues.get(i));
                }
            }

            for (int i = 0; i < report.headers().size(); i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 800, 16000));
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to generate XLSX report", ex);
        }
    }

    private byte[] renderPdf(TableReport report) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.COURIER);
            float fontSize = 9f;
            float leading = 13f;
            float margin = 36f;

            PageWriter writer = new PageWriter(document, font, fontSize, leading, margin);
            writer.writeLine(report.title(), true);
            writer.writeLine("Generated at: " + formatDate(Instant.now()), false);
            writer.writeLine("", false);
            writer.writeLine(joinCells(report.headers()), true);
            writer.writeLine(repeat("-", Math.min(joinCells(report.headers()).length(), 120)), false);
            for (List<String> row : report.rows()) {
                writer.writeLine(joinCells(row), false);
            }
            writer.close();

            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to generate PDF report", ex);
        }
    }

    private String joinCells(List<String> cells) {
        return cells.stream()
                .map(this::compactCell)
                .reduce((left, right) -> left + " | " + right)
                .orElse("");
    }

    private String compactCell(String value) {
        String sanitized = safe(value).replace('\n', ' ').replace('\r', ' ');
        return sanitized.length() <= 24 ? sanitized : sanitized.substring(0, 21) + "...";
    }

    private BigDecimal calculateTotalAmount(Order order, List<BulkDiscount> activeDiscountRules) {
        return OrderPricingSupport.computeTotalAmount(order, activeDiscountRules, adminSettingsService.getVatPercent())
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String dealerName(Dealer dealer) {
        if (dealer == null) {
            return "N/A";
        }
        return firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername());
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "N/A";
        }
        return value.trim();
    }

    private String safeEnum(Enum<?> value) {
        return value == null ? "N/A" : value.name();
    }

    private String formatMoney(BigDecimal value) {
        return nullSafe(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatDate(Instant value) {
        return value == null ? "N/A" : DISPLAY_DATE_FORMAT.format(value);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "N/A";
    }

    private Enum<?> resolveWarrantyStatus(WarrantyRegistration registration) {
        return WarrantyStatusSupport.resolveEffectiveStatus(registration);
    }

    private String repeat(String value, int count) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < count; i++) {
            builder.append(value);
        }
        return builder.toString();
    }

    private record TableReport(String title, List<String> headers, List<List<String>> rows) {
    }

    private static final class DealerRevenueRow {
        private final String dealerName;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private int orderCount;
        private Instant lastOrderAt;

        private DealerRevenueRow(
                String dealerName,
                BigDecimal totalAmount,
                BigDecimal paidAmount,
                int orderCount,
                Instant lastOrderAt
        ) {
            this.dealerName = dealerName;
            this.totalAmount = totalAmount;
            this.paidAmount = paidAmount;
            this.orderCount = orderCount;
            this.lastOrderAt = lastOrderAt;
        }
    }

    private static final class PageWriter {
        private final PDDocument document;
        private final PDType1Font font;
        private final float fontSize;
        private final float leading;
        private final float margin;

        private PDPageContentStream contentStream;
        private float cursorY;

        private PageWriter(PDDocument document, PDType1Font font, float fontSize, float leading, float margin) throws IOException {
            this.document = document;
            this.font = font;
            this.fontSize = fontSize;
            this.leading = leading;
            this.margin = margin;
            startNewPage();
        }

        private void writeLine(String line, boolean bold) throws IOException {
            if (cursorY <= margin) {
                startNewPage();
            }
            contentStream.beginText();
            contentStream.setFont(bold ? new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD) : font, fontSize);
            contentStream.newLineAtOffset(margin, cursorY);
            contentStream.showText(line);
            contentStream.endText();
            cursorY -= leading;
        }

        private void startNewPage() throws IOException {
            if (contentStream != null) {
                contentStream.close();
            }
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            contentStream = new PDPageContentStream(document, page);
            cursorY = page.getMediaBox().getHeight() - margin;
        }

        private void close() throws IOException {
            if (contentStream != null) {
                contentStream.close();
            }
        }
    }
}
