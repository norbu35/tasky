package mn.tasky.kernel.idempotency;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Tests the two-phase idempotency lifecycle (IN_PROGRESS → COMPLETED)
 * at the guard level, proving the DAO-backed behavior works correctly.
 */
class WorkflowIdempotencyGuardTest {

    private static final String EVENT_ID = "test-event-001";
    private static final String EVENT_TYPE = "BOOKING_COMPLETED";

    private EventIdempotencyDao dao;
    private WorkflowIdempotencyGuard guard;

    @BeforeEach
    void setUp() {
        dao = mock(EventIdempotencyDao.class);
        guard = new WorkflowIdempotencyGuard(dao);
    }

    @Test
    @DisplayName("IDEM-DAO-001: First claim succeeds (new INSERT)")
    void firstClaimSucceeds() {
        when(dao.claimEvent(anyString(), anyString(), anyString(), any())).thenReturn(1);

        boolean result = guard.claim(EVENT_TYPE, EVENT_ID);

        assertThat(result).isTrue();
        verify(dao).claimEvent(eq(EVENT_ID), eq(EVENT_TYPE), eq("BOOKING_COMPLETED_handler"), any());
    }

    @Test
    @DisplayName("IDEM-DAO-002: Second claim on COMPLETED row returns false (skip)")
    void secondClaimOnCompletedReturnsFalse() {
        when(dao.claimEvent(anyString(), anyString(), anyString(), any())).thenReturn(0);
        when(dao.findByEventId(EVENT_ID))
                .thenReturn(Optional.of(new EventIdempotencyRecord(
                        null, EVENT_TYPE, "BOOKING_COMPLETED_handler", "COMPLETED", Instant.now())));

        boolean result = guard.claim(EVENT_TYPE, EVENT_ID);

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("IDEM-DAO-003: Second claim on IN_PROGRESS row returns true (retry after crash)")
    void secondClaimOnInProgressReturnsTrue() {
        // Simulates: first attempt claimed IN_PROGRESS, crashed before complete.
        // Retry should proceed because side effects may not have run.
        when(dao.claimEvent(anyString(), anyString(), anyString(), any())).thenReturn(0);
        when(dao.findByEventId(EVENT_ID))
                .thenReturn(Optional.of(new EventIdempotencyRecord(
                        null, EVENT_TYPE, "BOOKING_COMPLETED_handler", "IN_PROGRESS", Instant.now())));

        boolean result = guard.claim(EVENT_TYPE, EVENT_ID);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("IDEM-DAO-004: guard.complete() delegates to dao.completeEvent()")
    void guardCompleteDelegatesToDao() {
        // This proves guard.complete(eventId) actually delegates to the DAO.
        guard.complete(EVENT_ID);

        verify(dao).completeEvent(EVENT_ID);
    }
}
