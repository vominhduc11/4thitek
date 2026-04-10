package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminRecentPaymentResponse;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentReconciliationJob {

    private static final DateTimeFormatter REPORT_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm z");
    private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationJob.class);

    private final AdminFinancialService adminFinancialService;
    private final AdminRepository adminRepository;
    private final AsyncMailService asyncMailService;

    @Value("${app.payment.reconciliation-zone:Asia/Ho_Chi_Minh}")
    private String reconciliationZone;

    @Scheduled(
            cron = "${app.payment.reconciliation-cron:0 0 0 * * *}",
            zone = "${app.payment.reconciliation-zone:Asia/Ho_Chi_Minh}"
    )
    public void sendDailyPaymentReport() {
        if (!asyncMailService.isEnabled()) {
            log.debug("Payment reconciliation job skipped: mail disabled");
            return;
        }
        Set<String> recipients = loadRecipients();
        if (recipients.isEmpty()) {
            log.info("Payment reconciliation job skipped: no active admin recipients");
            return;
        }

        ZoneId zoneId = ZoneId.of(reconciliationZone);
        ZonedDateTime windowEnd = ZonedDateTime.now(zoneId).toLocalDate().atStartOfDay(zoneId);
        ZonedDateTime windowStart = windowEnd.minusDays(1);
        Instant fromInclusive = windowStart.toInstant();
        Instant toExclusive = windowEnd.toInstant();

        List<AdminRecentPaymentResponse> payments = adminFinancialService.getPaymentsRecordedBetween(
                fromInclusive,
                toExclusive
        );
        String subject = "[4T HITEK] Daily bank transfer reconciliation report - " + windowStart.toLocalDate();
        String body = buildBody(windowStart, windowEnd, payments);
        log.info(
                "Payment reconciliation job sending report: recipients={}, paymentCount={}",
                recipients.size(),
                payments.size()
        );
        for (String recipient : recipients) {
            asyncMailService.sendText(recipient, subject, body);
        }
        log.info("Payment reconciliation job completed: recipients={}", recipients.size());
    }

    private Set<String> loadRecipients() {
        Set<String> recipients = new LinkedHashSet<>();
        for (Admin admin : adminRepository.findAll()) {
            if (admin.getUserStatus() != null && admin.getUserStatus() != StaffUserStatus.ACTIVE) {
                continue;
            }
            String email = admin.getEmail();
            if (email == null || email.isBlank()) {
                continue;
            }
            recipients.add(email.trim());
        }
        return recipients;
    }

    private String buildBody(
            ZonedDateTime windowStart,
            ZonedDateTime windowEnd,
            List<AdminRecentPaymentResponse> payments
    ) {
        StringBuilder body = new StringBuilder();
        body.append("Bank transfer payment reconciliation report").append('\n')
                .append("Window: ")
                .append(REPORT_DATE_FORMAT.format(windowStart))
                .append(" -> ")
                .append(REPORT_DATE_FORMAT.format(windowEnd))
                .append('\n')
                .append("Total payments: ")
                .append(payments.size())
                .append("\n\n");

        if (payments.isEmpty()) {
            body.append("No bank transfer payments were recorded in this window.").append('\n');
            return body.toString();
        }

        int index = 1;
        for (AdminRecentPaymentResponse payment : payments) {
            body.append(index++)
                    .append(". Dealer: ")
                    .append(payment.dealerName() != null ? payment.dealerName() : "Unknown")
                    .append(" | Order: ")
                    .append(payment.orderCode() != null ? payment.orderCode() : "-")
                    .append(" | Amount: ")
                    .append(payment.amount() != null ? payment.amount().toPlainString() : "0")
                    .append(" | PaidAt: ")
                    .append(payment.paidAt() != null ? payment.paidAt() : payment.createdAt())
                    .append(" | Proof: ")
                    .append(payment.proofFileName() != null && !payment.proofFileName().isBlank() ? "yes" : "no")
                    .append('\n');
        }
        return body.toString();
    }
}
