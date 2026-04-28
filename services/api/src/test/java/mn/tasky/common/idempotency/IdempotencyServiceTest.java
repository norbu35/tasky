package mn.tasky.common.idempotency;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IdempotencyServiceTest {

    @Mock
    private IdempotencyDao idempotencyDao;

    private IdempotencyService service;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final String OPERATION = "task.accept_application";
    private static final String KEY = "client-generated-key-123";

    @BeforeEach
    void setUp() {
        service = new IdempotencyService(idempotencyDao);
    }

    @Nested
    class Claim {

        @Test
        void returnsNewWhenInsertSucceeds() {
            when(idempotencyDao.insert(
                            any(UUID.class),
                            eq(USER_ID),
                            eq(OPERATION),
                            eq(KEY),
                            eq("IN_PROGRESS"),
                            any(Instant.class),
                            any(Instant.class)))
                    .thenReturn(1);

            IdempotencyClaim claim = service.claim(USER_ID.toString(), OPERATION, KEY);

            assertThat(claim.status()).isEqualTo(IdempotencyClaim.Status.NEW);
            assertThat(claim.record()).isNull();
        }

        @Test
        void returnsCompletedWhenRecordHasCompletedStatus() {
            when(idempotencyDao.insert(
                            any(UUID.class),
                            eq(USER_ID),
                            eq(OPERATION),
                            eq(KEY),
                            any(),
                            any(Instant.class),
                            any(Instant.class)))
                    .thenReturn(0);

            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    USER_ID,
                    OPERATION,
                    KEY,
                    "COMPLETED",
                    "task",
                    UUID.randomUUID(),
                    Instant.now(),
                    Instant.now());
            when(idempotencyDao.find(USER_ID, OPERATION, KEY)).thenReturn(Optional.of(record));

            IdempotencyClaim claim = service.claim(USER_ID.toString(), OPERATION, KEY);

            assertThat(claim.status()).isEqualTo(IdempotencyClaim.Status.COMPLETED);
            assertThat(claim.record()).isSameAs(record);
        }

        @Test
        void returnsInProgressWhenRecordHasInProgressStatus() {
            when(idempotencyDao.insert(
                            any(UUID.class),
                            eq(USER_ID),
                            eq(OPERATION),
                            eq(KEY),
                            any(),
                            any(Instant.class),
                            any(Instant.class)))
                    .thenReturn(0);

            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    USER_ID,
                    OPERATION,
                    KEY,
                    "IN_PROGRESS",
                    null,
                    null,
                    Instant.now(),
                    Instant.now());
            when(idempotencyDao.find(USER_ID, OPERATION, KEY)).thenReturn(Optional.of(record));

            IdempotencyClaim claim = service.claim(USER_ID.toString(), OPERATION, KEY);

            assertThat(claim.status()).isEqualTo(IdempotencyClaim.Status.IN_PROGRESS);
            assertThat(claim.record()).isSameAs(record);
        }

        @Test
        void throwsConflictWhenFindReturnsEmptyAfterFailedInsert() {
            when(idempotencyDao.insert(
                            any(UUID.class),
                            eq(USER_ID),
                            eq(OPERATION),
                            eq(KEY),
                            any(),
                            any(Instant.class),
                            any(Instant.class)))
                    .thenReturn(0);
            when(idempotencyDao.find(USER_ID, OPERATION, KEY)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.claim(USER_ID.toString(), OPERATION, KEY))
                    .isInstanceOf(IdempotencyException.class)
                    .satisfies(ex -> {
                        IdempotencyException ie = (IdempotencyException) ex;
                        assertThat(ie.status()).isEqualTo(org.springframework.http.HttpStatus.CONFLICT);
                        assertThat(ie.code()).isEqualTo("IDEMPOTENCY_CONFLICT");
                    });
        }

        @Test
        void throwsWhenUserIdIsNotValidUuid() {
            assertThatThrownBy(() -> service.claim("not-a-uuid", OPERATION, KEY))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("userId");
        }
    }

    @Nested
    class RequireKey {

        @Test
        void throwsWhenKeyIsNull() {
            assertThatThrownBy(() -> service.requireKey(null))
                    .isInstanceOf(IdempotencyException.class)
                    .satisfies(ex -> {
                        IdempotencyException ie = (IdempotencyException) ex;
                        assertThat(ie.status()).isEqualTo(org.springframework.http.HttpStatus.BAD_REQUEST);
                        assertThat(ie.code()).isEqualTo("IDEMPOTENCY_KEY_REQUIRED");
                    });
        }

        @Test
        void throwsWhenKeyIsEmpty() {
            assertThatThrownBy(() -> service.requireKey(""))
                    .isInstanceOf(IdempotencyException.class)
                    .satisfies(ex -> {
                        IdempotencyException ie = (IdempotencyException) ex;
                        assertThat(ie.code()).isEqualTo("IDEMPOTENCY_KEY_REQUIRED");
                    });
        }

        @Test
        void throwsWhenKeyIsBlank() {
            assertThatThrownBy(() -> service.requireKey("   "))
                    .isInstanceOf(IdempotencyException.class)
                    .satisfies(ex -> {
                        IdempotencyException ie = (IdempotencyException) ex;
                        assertThat(ie.code()).isEqualTo("IDEMPOTENCY_KEY_REQUIRED");
                    });
        }

        @Test
        void throwsWhenKeyExceedsMaxLength() {
            String longKey = "x".repeat(129);
            assertThatThrownBy(() -> service.requireKey(longKey))
                    .isInstanceOf(IdempotencyException.class)
                    .satisfies(ex -> {
                        IdempotencyException ie = (IdempotencyException) ex;
                        assertThat(ie.status()).isEqualTo(org.springframework.http.HttpStatus.BAD_REQUEST);
                        assertThat(ie.code()).isEqualTo("IDEMPOTENCY_KEY_INVALID");
                    });
        }

        @Test
        void returnsTrimmedKeyForValidInput() {
            assertThat(service.requireKey("  my-key  ")).isEqualTo("my-key");
        }

        @Test
        void acceptsKeyAtMaxLength() {
            String key128 = "x".repeat(128);
            assertThat(service.requireKey(key128)).isEqualTo(key128);
        }
    }

    @Nested
    class CompleteWithResource {

        @Test
        void delegatesToDaoMarkCompleted() {
            UUID resourceId = UUID.randomUUID();

            service.completeWithResource(USER_ID.toString(), OPERATION, KEY, "task", resourceId.toString());

            verify(idempotencyDao)
                    .markCompleted(eq(USER_ID), eq(OPERATION), eq(KEY), eq("task"), eq(resourceId), any(Instant.class));
        }

        @Test
        void throwsWhenResourceIdIsInvalid() {
            assertThatThrownBy(
                            () -> service.completeWithResource(USER_ID.toString(), OPERATION, KEY, "task", "bad-uuid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("resourceId");
        }
    }

    @Nested
    class Abandon {

        @Test
        void delegatesToDaoAbandonInProgress() {
            service.abandon(USER_ID.toString(), OPERATION, KEY);

            verify(idempotencyDao).abandonInProgress(USER_ID, OPERATION, KEY);
        }

        @Test
        void throwsWhenUserIdIsInvalid() {
            assertThatThrownBy(() -> service.abandon("bad-uuid", OPERATION, KEY))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("userId");
        }
    }
}
