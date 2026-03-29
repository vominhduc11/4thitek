package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.exception.RestExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class RestExceptionHandlerTests {

    private final RestExceptionHandler handler = new RestExceptionHandler();

    @Test
    void pessimisticLockMapsToConflictWithRetryMessage() {
        ResponseEntity<ApiResponse<Void>> response = handler.handlePessimisticLock(
                new CannotAcquireLockException("lock timeout")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error())
                .isEqualTo("Stock is being updated by another request; please retry");
    }
}
