package com.devwonder.backend.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AdminAssignOrderSerialsRequest(
        @NotEmpty @Valid List<LineAssignment> assignments
) {
    public record LineAssignment(
            Long productId,
            @NotEmpty List<String> serials
    ) {}
}
