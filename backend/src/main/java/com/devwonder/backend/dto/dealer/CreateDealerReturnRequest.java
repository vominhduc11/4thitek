package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.ReturnRequestResolution;
import com.devwonder.backend.entity.enums.ReturnRequestType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateDealerReturnRequest(
        @NotNull(message = "orderId is required")
        Long orderId,

        @NotNull(message = "type is required")
        ReturnRequestType type,

        @NotNull(message = "requestedResolution is required")
        ReturnRequestResolution requestedResolution,

        @Size(max = 128, message = "reasonCode must be at most 128 characters")
        String reasonCode,

        @Size(max = 1000, message = "reasonDetail must be at most 1000 characters")
        String reasonDetail,

        @Valid
        @NotEmpty(message = "items must not be empty")
        List<DealerReturnRequestItemPayload> items,

        @Valid
        List<DealerReturnRequestAttachmentPayload> attachments
) {
}
