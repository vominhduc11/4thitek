package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.repository.OrderRepository;
import jakarta.persistence.LockModeType;
import jakarta.persistence.Version;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;

class OrderConcurrencyContractTests {

    @Test
    void orderEntityKeepsOptimisticLockVersionField() throws Exception {
        Field versionField = Order.class.getDeclaredField("version");

        assertThat(versionField.getType()).isEqualTo(Long.class);
        assertThat(versionField.isAnnotationPresent(Version.class)).isTrue();
    }

    @Test
    void criticalOrderRepositoryMutationsKeepPessimisticWriteLocks() throws Exception {
        assertThat(lockModeOf(
                OrderRepository.class.getMethod("findVisibleByIdAndDealerIdForUpdate", Long.class, Long.class)
        )).isEqualTo(LockModeType.PESSIMISTIC_WRITE);

        assertThat(lockModeOf(
                OrderRepository.class.getMethod("findByIdForUpdate", Long.class)
        )).isEqualTo(LockModeType.PESSIMISTIC_WRITE);

        assertThat(lockModeOf(
                OrderRepository.class.getMethod("findByOrderCodeIgnoreCaseForUpdate", String.class)
        )).isEqualTo(LockModeType.PESSIMISTIC_WRITE);

        assertThat(lockModeOf(
                OrderRepository.class.getMethod("findPendingOrdersOfSuspendedDealersBefore", Instant.class)
        )).isEqualTo(LockModeType.PESSIMISTIC_WRITE);

        assertThat(lockModeOf(
                OrderRepository.class.getMethod("findPendingOrdersCreatedBefore", Instant.class)
        )).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
    }

    private LockModeType lockModeOf(Method method) {
        Lock lock = method.getAnnotation(Lock.class);
        assertThat(lock)
                .as("Expected @Lock on %s", method.getName())
                .isNotNull();
        return lock.value();
    }
}
