package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.entity.PaymentMethodConverter;
import com.devwonder.backend.entity.enums.PaymentMethod;
import org.junit.jupiter.api.Test;

class PaymentMethodConverterTests {

    private final PaymentMethodConverter converter = new PaymentMethodConverter();

    @Test
    void mapsLegacyDebtValueToBankTransfer() {
        assertThat(converter.convertToEntityAttribute("DEBT"))
                .isEqualTo(PaymentMethod.BANK_TRANSFER);
    }

    @Test
    void preservesBankTransferValue() {
        assertThat(converter.convertToEntityAttribute("BANK_TRANSFER"))
                .isEqualTo(PaymentMethod.BANK_TRANSFER);
    }

    @Test
    void rejectsUnknownDatabaseValue() {
        assertThatThrownBy(() -> converter.convertToEntityAttribute("CASH"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported payment method value");
    }
}
