package com.devwonder.backend.dto.dealer;

public record DealerBankTransferInstructionResponse(
        String provider,
        String bankName,
        String accountNumber,
        String accountHolder
) {
}
