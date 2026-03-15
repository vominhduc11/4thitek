package com.devwonder.backend.service;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.service.support.AppMessageSupport;
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
    private final AppMessageSupport appMessageSupport;

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
                "4ThiTek đã nhận hồ sơ đăng ký đại lý",
                """
                        Xin chào %s,

                        4ThiTek đã nhận hồ sơ đăng ký đại lý của bạn.
                        Trạng thái hiện tại: Đang xem xét.

                        Tài khoản Dealer sẽ được kích hoạt sau khi hồ sơ được phê duyệt.
                        Chúng tôi sẽ gửi email tiếp theo khi có cập nhật.

                        Trân trọng,
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
            case UNDER_REVIEW -> "Tài khoản đại lý đang chờ duyệt. Vui lòng đợi email cập nhật từ 4ThiTek.";
            case SUSPENDED -> "Tài khoản đại lý của bạn đã bị tạm khóa. Vui lòng liên hệ 4ThiTek để biết thêm chi tiết.";
            case ACTIVE -> "Tài khoản đại lý đã sẵn sàng.";
        };
    }

    private String notificationTitle(CustomerStatus status) {
        return switch (status) {
            case ACTIVE -> appMessageSupport.get("notification.dealer.lifecycle.active.title");
            case UNDER_REVIEW -> appMessageSupport.get("notification.dealer.lifecycle.under_review.title");
            case SUSPENDED -> appMessageSupport.get("notification.dealer.lifecycle.suspended.title");
        };
    }

    private String notificationContent(CustomerStatus status) {
        return switch (status) {
            case ACTIVE -> appMessageSupport.get("notification.dealer.lifecycle.active.content");
            case UNDER_REVIEW -> appMessageSupport.get("notification.dealer.lifecycle.under_review.content");
            case SUSPENDED -> appMessageSupport.get("notification.dealer.lifecycle.suspended.content");
        };
    }

    private String statusEmailSubject(CustomerStatus status) {
        return switch (status) {
            case ACTIVE -> "4ThiTek đã phê duyệt tài khoản đại lý";
            case UNDER_REVIEW -> "4ThiTek đang xem xét hồ sơ đại lý";
            case SUSPENDED -> "4ThiTek đã tạm khóa tài khoản đại lý";
        };
    }

    private String statusEmailBody(Dealer dealer, CustomerStatus status) {
        String greetingName = resolveDisplayName(dealer);
        return switch (status) {
            case ACTIVE -> """
                    Xin chào %s,

                    Hồ sơ đại lý của bạn đã được phê duyệt và tài khoản Dealer đã kích hoạt.
                    Bạn có thể đăng nhập ứng dụng Dealer bằng email đã đăng ký và mật khẩu đã tạo trên website.

                    Trân trọng,
                    4ThiTek
                    """.formatted(greetingName);
            case UNDER_REVIEW -> """
                    Xin chào %s,

                    Hồ sơ đại lý của bạn đang được 4ThiTek xem xét.
                    Chúng tôi sẽ gửi email tiếp theo ngay khi có kết quả xử lý.

                    Trân trọng,
                    4ThiTek
                    """.formatted(greetingName);
            case SUSPENDED -> """
                    Xin chào %s,

                    Tài khoản đại lý của bạn đã bị tạm khóa và không thể đăng nhập ứng dụng Dealer.
                    Vui lòng liên hệ đội ngũ 4ThiTek để biết thêm chi tiết và được hỗ trợ.

                    Trân trọng,
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
        return "đối tác";
    }
}
