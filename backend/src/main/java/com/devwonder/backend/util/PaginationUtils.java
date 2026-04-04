package com.devwonder.backend.util;

import com.devwonder.backend.exception.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PaginationUtils {
    private PaginationUtils() {
    }

    public static Pageable toPageable(Integer page, Integer size, String sortBy, String sortDir, String defaultSortBy) {
        int safePage = page == null ? 0 : validatePage(page);
        int safeSize = size == null ? 20 : validateSize(size);
        String effectiveSortBy = sortBy == null || sortBy.isBlank() ? defaultSortBy : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(safePage, safeSize, Sort.by(direction, effectiveSortBy));
    }

    public static Pageable toUnsortedPageable(Integer page, Integer size) {
        int safePage = page == null ? 0 : validatePage(page);
        int safeSize = size == null ? 20 : validateSize(size);
        return PageRequest.of(safePage, safeSize, Sort.unsorted());
    }

    private static int validatePage(int page) {
        if (page < 0) {
            throw new BadRequestException("page must be greater than or equal to 0");
        }
        return page;
    }

    private static int validateSize(int size) {
        if (size <= 0) {
            throw new BadRequestException("size must be greater than 0");
        }
        return Math.min(size, 100);
    }
}
