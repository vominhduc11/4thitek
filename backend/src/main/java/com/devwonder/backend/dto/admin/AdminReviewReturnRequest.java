package com.devwonder.backend.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AdminReviewReturnRequest(
        @Valid
        @NotEmpty(message = "decisions must not be empty")
        List<AdminReviewReturnItemDecision> decisions,

        Boolean awaitingReceipt
) {
}
