package com.devwonder.backend.dto.webhook;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SepayWebhookRequest(
        String id,
        String gateway,
        @JsonAlias({"transaction_date"})
        String transactionDate,
        @JsonAlias({"account_number"})
        String accountNumber,
        @JsonAlias({"transfer_type"})
        String transferType,
        @JsonAlias({"transfer_amount"})
        BigDecimal transferAmount,
        BigDecimal accumulated,
        String code,
        String content,
        @JsonAlias({"reference_code"})
        String referenceCode,
        String description,
        @JsonAlias({"transfer_content"})
        String transferContent,
        @JsonAlias({"sub_account"})
        String subAccount
) {
}
