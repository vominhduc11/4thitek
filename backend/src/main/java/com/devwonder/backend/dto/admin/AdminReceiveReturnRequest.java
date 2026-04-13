package com.devwonder.backend.dto.admin;

import java.util.List;

public record AdminReceiveReturnRequest(
        List<Long> itemIds,
        String note
) {
}
