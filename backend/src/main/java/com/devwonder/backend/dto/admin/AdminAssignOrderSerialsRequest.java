package com.devwonder.backend.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AdminAssignOrderSerialsRequest(
        @NotEmpty @Valid List<LineAssignment> assignments
) {
    public record LineAssignment(
            @NotNull(message = "productId is required")
            Long productId,
            @NotEmpty(message = "serials must not be empty")
            List<@NotBlank(message = "serials must not contain blank values") String> serials
    ) {}
}
