package com.devwonder.backend.service;

import com.devwonder.backend.entity.Customer;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import java.net.URI;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class WarrantyMailService {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final MailService mailService;

    @Value("${app.password-reset.base-url:}")
    private String passwordResetBaseUrl;

    public void sendWarrantyActivatedEmail(
            Customer customer,
            Dealer dealer,
            ProductSerial productSerial,
            WarrantyRegistration registration,
            String generatedPassword
    ) {
        String recipient = normalize(customer == null ? null : customer.getEmail());
        if (recipient == null) {
            return;
        }

        String customerName = firstNonBlank(
                customer == null ? null : customer.getFullName(),
                registration == null ? null : registration.getCustomerName(),
                recipient
        );
        Product product = productSerial == null ? null : productSerial.getProduct();
        String productName = firstNonBlank(product == null ? null : product.getName(), "Sản phẩm");
        String serial = firstNonBlank(productSerial == null ? null : productSerial.getSerial(), "N/A");
        String dealerName = firstNonBlank(
                dealer == null ? null : dealer.getBusinessName(),
                dealer == null ? null : dealer.getContactName(),
                dealer == null ? null : dealer.getEmail(),
                "đại lý"
        );
        String warrantyStart = registration == null || registration.getWarrantyStart() == null
                ? "--"
                : DATE_FORMATTER.format(registration.getWarrantyStart());
        String warrantyEnd = registration == null || registration.getWarrantyEnd() == null
                ? "--"
                : DATE_FORMATTER.format(registration.getWarrantyEnd());

        StringBuilder body = new StringBuilder("""
                Xin chào %s,

                Sản phẩm %s (Serial: %s) đã được đăng ký bảo hành bởi đại lý %s.

                Thời hạn bảo hành: %s — %s

                Đăng nhập để xem chi tiết: %s
                Email: %s
                """.formatted(
                customerName,
                productName,
                serial,
                dealerName,
                warrantyStart,
                warrantyEnd,
                buildAccountUrl(),
                recipient
        ));

        String normalizedPassword = normalize(generatedPassword);
        if (normalizedPassword != null) {
            body.append("Mật khẩu tạm: ").append(normalizedPassword).append("\n");
        }

        body.append("""

                Trân trọng,
                4ThiTek
                """);

        mailService.sendText(
                recipient,
                "4ThiTek xác nhận kích hoạt bảo hành",
                body.toString().trim()
        );
    }

    private String buildAccountUrl() {
        String normalizedBase = normalize(passwordResetBaseUrl);
        if (normalizedBase == null) {
            return "https://4thitek.vn/account";
        }
        try {
            URI uri = new URI(normalizedBase);
            if (!StringUtils.hasText(uri.getScheme()) || !StringUtils.hasText(uri.getHost())) {
                return "https://4thitek.vn/account";
            }
            StringBuilder builder = new StringBuilder(uri.getScheme())
                    .append("://")
                    .append(uri.getHost());
            if (uri.getPort() > 0) {
                builder.append(':').append(uri.getPort());
            }
            builder.append("/account");
            return builder.toString();
        } catch (Exception ex) {
            return "https://4thitek.vn/account";
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
