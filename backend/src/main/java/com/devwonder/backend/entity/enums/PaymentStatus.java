package com.devwonder.backend.entity.enums;

public enum PaymentStatus {
    /**
     * Order aggregate is pending payment or a payment attempt has not been confirmed yet.
     */
    PENDING,
    /**
     * Payment is fully confirmed.
     */
    PAID,
    /**
     * Legacy compatibility value for historical payment-attempt failures. Current runtime
     * paths do not emit FAILED for aggregate order.paymentStatus or new payment writes.
     */
    FAILED,
    /**
     * Order was cancelled before any confirmed payment existed.
     */
    CANCELLED
}
