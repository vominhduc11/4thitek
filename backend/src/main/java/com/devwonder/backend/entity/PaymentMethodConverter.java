package com.devwonder.backend.entity;

import com.devwonder.backend.entity.enums.PaymentMethod;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Locale;

@Converter(autoApply = false)
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {

    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        String normalized = dbData.trim().toUpperCase(Locale.ROOT);
        if ("DEBT".equals(normalized) || "BANK_TRANSFER".equals(normalized)) {
            return PaymentMethod.BANK_TRANSFER;
        }

        throw new IllegalArgumentException("Unsupported payment method value: " + dbData);
    }
}
