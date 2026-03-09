package com.devwonder.backend.service;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class DealerAccountLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(DealerAccountLifecycleService.class);

    private final NotificationService notificationService;
    private final MailService mailService;

    public void assertDealerPortalAccess(Account account) {
        if (!(account instanceof Dealer dealer)) {
            return;
        }
        CustomerStatus status = normalizeStatus(dealer.getCustomerStatus());
        if (status == CustomerStatus.ACTIVE) {
            return;
        }
        throw new UnauthorizedException(loginBlockedMessage(status));
    }

    public void sendApplicationReceivedEmail(Dealer dealer) {
        sendEmailIfPossible(
                dealer.getEmail(),
                "4ThiTek da nhan ho so dang ky dai ly",
                """
                        Xin chao %s,

                        4ThiTek da nhan ho so dang ky dai ly cua ban.
                        Trang thai hien tai: Dang xem xet.

                        Tai khoan Dealer se duoc kich hoat sau khi ho so duoc phe duyet.
                        Chung toi se gui email tiep theo khi co cap nhat.

                        Tran trong,
                        4ThiTek
                        """.formatted(resolveDisplayName(dealer))
        );
    }

    public void notifyDealerStatusChanged(Dealer dealer, CustomerStatus previousStatus) {
        CustomerStatus normalizedPreviousStatus = normalizeStatus(previousStatus);
        CustomerStatus currentStatus = normalizeStatus(dealer.getCustomerStatus());
        if (currentStatus == normalizedPreviousStatus) {
            return;
        }

        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                notificationTitle(currentStatus),
                notificationContent(currentStatus),
                NotifyType.SYSTEM,
                null
        ));

        sendEmailIfPossible(
                dealer.getEmail(),
                statusEmailSubject(currentStatus),
                statusEmailBody(dealer, currentStatus)
        );
    }

    private String loginBlockedMessage(CustomerStatus status) {
        return switch (status) {
            case UNDER_REVIEW -> "Tai khoan dai ly dang cho duyet. Vui long doi email cap nhat tu 4ThiTek.";
            case NEEDS_ATTENTION -> "Ho so dai ly can bo sung thong tin. Vui long kiem tra email cap nhat tu 4ThiTek.";
            case ACTIVE -> "Tai khoan dai ly da san sang.";
        };
    }

    private String notificationTitle(CustomerStatus status) {
        return switch (status) {
            case ACTIVE -> "Tai khoan dai ly da duoc kich hoat";
            case UNDER_REVIEW -> "Ho so dai ly dang duoc xem xet";
            case NEEDS_ATTENTION -> "Ho so dai ly can bo sung";
        };
    }

    private String notificationContent(CustomerStatus status) {
        return switch (status) {
            case ACTIVE -> "Ho so dai ly cua ban da duoc phe duyet. Ban co the dang nhap ung dung Dealer bang tai khoan da dang ky.";
            case UNDER_REVIEW -> "Ho so dai ly cua ban dang duoc 4ThiTek xem xet. Chung toi se gui email khi co cap nhat moi.";
            case NEEDS_ATTENTION -> "Ho so dai ly cua ban can bo sung thong tin truoc khi kich hoat. Vui long kiem tra email de biet chi tiet.";
        };
    }

    private String statusEmailSubject(CustomerStatus status) {
        return switch (status) {
            case ACTIVE -> "4ThiTek da phe duyet tai khoan dai ly";
            case UNDER_REVIEW -> "4ThiTek dang xem xet ho so dai ly";
            case NEEDS_ATTENTION -> "4ThiTek yeu cau bo sung ho so dai ly";
        };
    }

    private String statusEmailBody(Dealer dealer, CustomerStatus status) {
        String greetingName = resolveDisplayName(dealer);
        return switch (status) {
            case ACTIVE -> """
                    Xin chao %s,

                    Ho so dai ly cua ban da duoc phe duyet va tai khoan Dealer da kich hoat.
                    Ban co the dang nhap ung dung Dealer bang email da dang ky va mat khau da tao tren website.

                    Tran trong,
                    4ThiTek
                    """.formatted(greetingName);
            case UNDER_REVIEW -> """
                    Xin chao %s,

                    Ho so dai ly cua ban dang duoc 4ThiTek xem xet.
                    Chung toi se gui email tiep theo ngay khi co ket qua xu ly.

                    Tran trong,
                    4ThiTek
                    """.formatted(greetingName);
            case NEEDS_ATTENTION -> """
                    Xin chao %s,

                    Ho so dai ly cua ban dang can bo sung thong tin truoc khi kich hoat.
                    Vui long kiem tra lai thong tin da gui va lien he doi ngu 4ThiTek neu ban can ho tro them.

                    Tran trong,
                    4ThiTek
                    """.formatted(greetingName);
        };
    }

    private void sendEmailIfPossible(String recipient, String subject, String body) {
        if (!StringUtils.hasText(recipient) || !mailService.isEnabled()) {
            return;
        }
        try {
            mailService.sendText(recipient.trim(), subject, body);
        } catch (RuntimeException ex) {
            log.warn("Could not send dealer lifecycle email to {}", recipient, ex);
        }
    }

    private CustomerStatus normalizeStatus(CustomerStatus status) {
        return status == null ? CustomerStatus.ACTIVE : status;
    }

    private String resolveDisplayName(Dealer dealer) {
        if (StringUtils.hasText(dealer.getContactName())) {
            return dealer.getContactName().trim();
        }
        if (StringUtils.hasText(dealer.getBusinessName())) {
            return dealer.getBusinessName().trim();
        }
        if (StringUtils.hasText(dealer.getEmail())) {
            return dealer.getEmail().trim();
        }
        return "doi tac";
    }
}
