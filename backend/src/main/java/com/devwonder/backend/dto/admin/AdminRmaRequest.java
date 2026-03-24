package com.devwonder.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AdminRmaRequest(
        @NotNull(message = "action is required")
        RmaAction action,

        @NotBlank(message = "reason is required")
        String reason,

        /** Required when action = PASS_QC — must have at least 1 element. */
        List<String> proofUrls
) {
    public enum RmaAction {
        START_INSPECTION,
        PASS_QC,
        SCRAP
    }
}
