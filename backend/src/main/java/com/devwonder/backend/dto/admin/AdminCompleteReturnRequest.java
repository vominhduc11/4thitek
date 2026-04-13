package com.devwonder.backend.dto.admin;

import jakarta.validation.constraints.Size;

public record AdminCompleteReturnRequest(
        @Size(max = 1000, message = "note must be at most 1000 characters")
        String note
) {
}
