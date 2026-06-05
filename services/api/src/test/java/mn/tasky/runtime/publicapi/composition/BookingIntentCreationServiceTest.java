package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.CreateBookingIntentRequest;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingIntentCreationService")
class BookingIntentCreationServiceTest {

    @Mock
    private BookingIntentCommandPort bookingIntentCommandPort;

    @Mock
    private BookingIntentCompositionService bookingIntentCompositionService;

    @Mock
    private IdempotencyService idempotencyService;

    private BookingIntentCreationService service;

    private final String customerId = "cust-123";
    private final String taskId = "task-456";
    private final String idempotencyKey = "key-abc";
    private final CreateBookingIntentRequest request = new CreateBookingIntentRequest("direct", "tasker-789", null);

    @BeforeEach
    void setUp() {
        service = new BookingIntentCreationService(
                bookingIntentCommandPort, bookingIntentCompositionService, idempotencyService);
    }

    @Test
    @DisplayName("createIntent returns inProgress when idempotency claim is IN_PROGRESS")
    void claimInProgress() {
        IdempotencyClaim claim = new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null);
        when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                .thenReturn(claim);

        BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.IN_PROGRESS);
        verifyNoInteractions(bookingIntentCommandPort, bookingIntentCompositionService);
    }

    @Test
    @DisplayName("createIntent returns replayMissing when idempotency claim is COMPLETED but resourceId is null")
    void claimCompletedNullResource() {
        IdempotencyClaim claim = new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null);
        when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                .thenReturn(claim);

        BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.REPLAY_MISSING);
    }

    @Test
    @DisplayName("createIntent retrieves and returns success when idempotency claim is COMPLETED and resource is found")
    void claimCompletedSuccess() {
        UUID resourceId = UUID.randomUUID();
        IdempotencyRecord record = mock(IdempotencyRecord.class);
        when(record.resourceId()).thenReturn(resourceId);
        IdempotencyClaim claim = new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record);

        BookingIntentState mockIntent = mock(BookingIntentState.class);
        Map<String, Object> mockResponse = Map.of("id", resourceId.toString());

        when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                .thenReturn(claim);
        when(bookingIntentCommandPort.getIntent(resourceId.toString())).thenReturn(Optional.of(mockIntent));
        when(bookingIntentCompositionService.bookingIntentResponse(mockIntent)).thenReturn(mockResponse);

        BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.SUCCESS);
        assertThat(outcome.body()).isEqualTo(mockResponse);
    }

    @Test
    @DisplayName("createIntent creates new intent successfully and completes idempotency")
    void createNewIntentSuccess() {
        IdempotencyClaim claim = new IdempotencyClaim(IdempotencyClaim.Status.NEW, null);
        BookingIntentState mockIntent = mock(BookingIntentState.class);
        String generatedId = UUID.randomUUID().toString();
        when(mockIntent.id()).thenReturn(generatedId);
        BookingIntentCreateResult createResult = BookingIntentCreateResult.success(mockIntent);
        Map<String, Object> mockResponse = Map.of("id", generatedId);

        when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                .thenReturn(claim);
        when(bookingIntentCommandPort.createIntent(customerId, taskId, "direct", "tasker-789", null))
                .thenReturn(createResult);
        when(bookingIntentCompositionService.bookingIntentResponse(mockIntent)).thenReturn(mockResponse);

        BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.SUCCESS);
        assertThat(outcome.body()).isEqualTo(mockResponse);
        verify(idempotencyService)
                .completeWithResource(
                        customerId,
                        IdempotencyOperations.CREATE_BOOKING_INTENT,
                        idempotencyKey,
                        "BOOKING_INTENT",
                        generatedId);
    }

    @Test
    @DisplayName("createIntent abandons idempotency and maps failure code correctly on port error")
    void createNewIntentFailure() {
        IdempotencyClaim claim = new IdempotencyClaim(IdempotencyClaim.Status.NEW, null);
        BookingIntentCreateResult createResult =
                BookingIntentCreateResult.error(BookingIntentCreateResult.CONFLICT, "Conflict error");

        when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                .thenReturn(claim);
        when(bookingIntentCommandPort.createIntent(customerId, taskId, "direct", "tasker-789", null))
                .thenReturn(createResult);

        BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.CONFLICT);
        assertThat(outcome.errorCode()).isEqualTo("CONFLICT");
        assertThat(outcome.errorMessage()).isEqualTo("Conflict error");
        verify(idempotencyService).abandon(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey);
    }

    @Test
    @DisplayName("createIntent abandons idempotency and rethrows exception on runtime failure")
    void createNewIntentException() {
        IdempotencyClaim claim = new IdempotencyClaim(IdempotencyClaim.Status.NEW, null);

        when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                .thenReturn(claim);
        when(bookingIntentCommandPort.createIntent(customerId, taskId, "direct", "tasker-789", null))
                .thenThrow(new RuntimeException("Database error"));

        assertThatThrownBy(() -> service.createIntent(customerId, taskId, request, idempotencyKey))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Database error");

        verify(idempotencyService).abandon(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey);
    }
}
