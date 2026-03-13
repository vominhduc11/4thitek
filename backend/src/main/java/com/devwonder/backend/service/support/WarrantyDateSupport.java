package com.devwonder.backend.service.support;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

public final class WarrantyDateSupport {

    public static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private WarrantyDateSupport() {
    }

    public static boolean isExpired(Instant warrantyEnd) {
        return isExpired(warrantyEnd, LocalDate.now(APP_ZONE));
    }

    public static boolean isExpired(Instant warrantyEnd, LocalDate currentDate) {
        if (warrantyEnd == null) {
            return false;
        }
        return currentDate.isAfter(toAppLocalDate(warrantyEnd));
    }

    public static long remainingDays(Instant warrantyEnd) {
        return remainingDays(warrantyEnd, LocalDate.now(APP_ZONE));
    }

    public static long remainingDays(Instant warrantyEnd, LocalDate currentDate) {
        if (warrantyEnd == null) {
            return 0L;
        }
        LocalDate endDate = toAppLocalDate(warrantyEnd);
        if (currentDate.isAfter(endDate)) {
            return 0L;
        }
        return ChronoUnit.DAYS.between(currentDate, endDate) + 1L;
    }

    public static LocalDate toAppLocalDate(Instant value) {
        return value.atZone(APP_ZONE).toLocalDate();
    }
}
