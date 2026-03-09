package com.devwonder.backend.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PaginationUtils {
    private PaginationUtils() {
    }

    public static Pageable toPageable(Integer page, Integer size, String sortBy, String sortDir, String defaultSortBy) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 100);
        String effectiveSortBy = sortBy == null || sortBy.isBlank() ? defaultSortBy : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(safePage, safeSize, Sort.by(direction, effectiveSortBy));
    }
}
