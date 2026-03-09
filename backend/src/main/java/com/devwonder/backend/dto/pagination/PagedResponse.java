package com.devwonder.backend.dto.pagination;

import java.util.List;
import org.springframework.data.domain.Page;

public record PagedResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        String sortBy
) {
    public static <T> PagedResponse<T> from(Page<T> page, String sortBy) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                sortBy
        );
    }
}
