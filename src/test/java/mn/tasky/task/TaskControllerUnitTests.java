package mn.tasky.task;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.category.application.CategoryService;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.task.api.TaskController;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.AcceptApplicationRequest;
import mn.tasky.task.dto.CreateTaskRequest;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskPhotoUploadUrlRequest;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTaskRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskControllerUnitTests {

    @Mock
    private TaskService taskService;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AuthService authService;
    @Mock
    private BookingService bookingService;
    @Mock
    private IdempotencyService idempotencyService;

    private TaskController controller;

    @BeforeEach
    void setUp() {
        controller = new TaskController(taskService,
            categoryService,
            authService,
            bookingService,
            idempotencyService);
    }

    @Test
    void createTaskRejectsNonCustomerRole() {
        JwtPrincipal principal = new JwtPrincipal(uuid(1),
            "TASKER",
            "ACTIVE");

        ResponseEntity<?> response = controller.createTask(
            principal,
            createTaskRequest(),
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "FORBIDDEN");
    }

    @Test
    void createTaskReturnsBadRequestWhenServiceRejectsPayload() {
        JwtPrincipal principal = new JwtPrincipal(uuid(101),
            "CUSTOMER",
            "ACTIVE");
        when(taskService.createTask(eq(principal.userId()),
            any())).thenReturn(TaskCreateResult.error(
            TaskCreateResult.INVALID_CATEGORY,
            "Category does not exist."
        ));

        ResponseEntity<?> response = controller.createTask(
            principal,
            createTaskRequest(),
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
                TaskCreateResult.INVALID_CATEGORY)
            .containsEntry("message",
                "Category does not exist.");
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d",
            suffix);
    }

    private CreateTaskRequest createTaskRequest() {
        return new CreateTaskRequest(
            uuid(30),
            "Task description long enough",
            50000,
            47.9,
            106.9,
            "Ulaanbaatar city",
            "2026-02-18T00:00:00Z",
            List.of()
        );
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE,
            "trace-task-controller");
        return request;
    }

    @Test
    void listApplicationsReturnsForbiddenWhenServiceRejectsActor() {
        JwtPrincipal principal = new JwtPrincipal(uuid(2),
            "TASKER",
            "ACTIVE");
        when(taskService.listTaskApplications(principal.userId(),
            uuid(3),
            null,
            21)).thenReturn(TaskApplicationsListResult.FORBIDDEN_RESULT);

        ResponseEntity<?> response = controller.listTaskApplications(
            principal,
            uuid(3),
            null,
            20,
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void acceptApplicationMapsDisclaimerRequiredError() {
        JwtPrincipal principal = new JwtPrincipal(uuid(4),
            "CUSTOMER",
            "ACTIVE");
        when(idempotencyService.claim(principal.userId(),
            IdempotencyOperations.ACCEPT_APPLICATION,
            "idem-1")).thenReturn(new IdempotencyClaim(
            IdempotencyClaim.Status.NEW,
            null
        ));
        when(taskService.acceptApplication(principal.userId(),
            uuid(5),
            uuid(6),
            false)).thenReturn(TaskAcceptResult.DISCLAIMER_REQUIRED_RESULT);

        ResponseEntity<?> response = controller.acceptApplication(
            principal,
            uuid(5),
            uuid(6),
            new AcceptApplicationRequest(false),
            "idem-1",
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "DISCLAIMER_REQUIRED");
        verify(idempotencyService).abandon(principal.userId(),
            IdempotencyOperations.ACCEPT_APPLICATION,
            "idem-1");
    }

    @Test
    void acceptApplicationMapsConflictError() {
        JwtPrincipal principal = new JwtPrincipal(uuid(7),
            "CUSTOMER",
            "ACTIVE");
        when(idempotencyService.claim(principal.userId(),
            IdempotencyOperations.ACCEPT_APPLICATION,
            "idem-2")).thenReturn(new IdempotencyClaim(
            IdempotencyClaim.Status.NEW,
            null
        ));
        when(taskService.acceptApplication(principal.userId(),
            uuid(8),
            uuid(9),
            true)).thenReturn(TaskAcceptResult.CONFLICT_RESULT);

        ResponseEntity<?> response = controller.acceptApplication(
            principal,
            uuid(8),
            uuid(9),
            new AcceptApplicationRequest(true),
            "idem-2",
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "CONFLICT");
    }

    @Test
    void getPostCreateUploadUrlRejectsWhenTaskAlreadyHasThreePhotos() {
        JwtPrincipal principal = new JwtPrincipal(uuid(10),
            "CUSTOMER",
            "ACTIVE");
        when(taskService.getTask(uuid(11))).thenReturn(Optional.of(taskWithPhotos(uuid(11),
            principal.userId(),
            List.of("a",
                "b",
                "c"))));

        ResponseEntity<?> response = controller.getPostCreateUploadUrl(
            principal,
            uuid(11),
            new TaskPhotoUploadUrlRequest("image/jpeg"),
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "TOO_MANY_PHOTOS");
    }

    private TaskState taskWithPhotos(String id,
                                     String customerId,
                                     List<String> photoKeys) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new TaskState(
            id,
            customerId,
            uuid(20),
            "Task description long",
            50000,
            47.9,
            106.9,
            "Ulaanbaatar",
            "OPEN",
            now.plusSeconds(3600),
            photoKeys,
            now,
            now
        );
    }

    @Test
    void getPreCreateUploadUrlReturnsValidationErrorWhenServiceRejectsContentType() {
        JwtPrincipal principal = new JwtPrincipal(uuid(12),
            "CUSTOMER",
            "ACTIVE");
        when(taskService.createPhotoUploadUrl(principal.userId(),
            "image/webp")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getPreCreateUploadUrl(
            principal,
            new TaskPhotoUploadUrlRequest("image/webp"),
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "INVALID_CONTENT_TYPE");
    }

    @Test
    void getPreCreateUploadUrlReturnsUploadPayload() {
        JwtPrincipal principal = new JwtPrincipal(uuid(13),
            "CUSTOMER",
            "ACTIVE");
        when(taskService.createPhotoUploadUrl(principal.userId(),
            "image/jpeg")).thenReturn(Optional.of(new PresignedUpload(
            "https://upload.example.com",
            "uploads/tasks/one.jpg"
        )));

        ResponseEntity<?> response = controller.getPreCreateUploadUrl(
            principal,
            new TaskPhotoUploadUrlRequest("image/jpeg"),
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("storage_key",
            "uploads/tasks/one.jpg");
    }

    @Test
    void updateTaskMapsAllErrorCodesToExpectedResponses() {
        JwtPrincipal principal = new JwtPrincipal(uuid(201),
            "CUSTOMER",
            "ACTIVE");
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-not-found"),
            any())).thenReturn(TaskUpdateResult.NOT_FOUND_RESULT);
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-forbidden"),
            any())).thenReturn(TaskUpdateResult.FORBIDDEN_RESULT);
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-invalid-status"),
            any())).thenReturn(TaskUpdateResult.INVALID_STATUS_RESULT);
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-invalid-desc"),
            any())).thenReturn(TaskUpdateResult.INVALID_DESCRIPTION_RESULT);
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-invalid-location"),
            any())).thenReturn(TaskUpdateResult.INVALID_LOCATION_RESULT);
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-invalid-schedule"),
            any())).thenReturn(TaskUpdateResult.INVALID_SCHEDULE_RESULT);
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-too-many-photos"),
            any())).thenReturn(TaskUpdateResult.TOO_MANY_PHOTOS_RESULT);
        when(taskService.updateTask(eq(principal.userId()),
            eq("task-unknown"),
            any())).thenReturn(new TaskUpdateResult(null,
            "UNKNOWN"));

        assertTaskUpdateError(principal,
            "task-not-found",
            HttpStatus.NOT_FOUND,
            "NOT_FOUND");
        assertTaskUpdateError(principal,
            "task-forbidden",
            HttpStatus.FORBIDDEN,
            "FORBIDDEN");
        assertTaskUpdateError(principal,
            "task-invalid-status",
            HttpStatus.CONFLICT,
            "INVALID_STATUS");
        assertTaskUpdateError(principal,
            "task-invalid-desc",
            HttpStatus.BAD_REQUEST,
            "INVALID_DESCRIPTION");
        assertTaskUpdateError(principal,
            "task-invalid-location",
            HttpStatus.BAD_REQUEST,
            "INVALID_LOCATION");
        assertTaskUpdateError(principal,
            "task-invalid-schedule",
            HttpStatus.BAD_REQUEST,
            "INVALID_SCHEDULE");
        assertTaskUpdateError(principal,
            "task-too-many-photos",
            HttpStatus.BAD_REQUEST,
            "TOO_MANY_PHOTOS");

        ResponseEntity<?> unknownResponse = controller.updateTask(
            principal,
            "task-unknown",
            updateTaskRequest(),
            request()
        );
        assertThat(unknownResponse.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private void assertTaskUpdateError(JwtPrincipal principal,
                                       String taskId,
                                       HttpStatus expectedStatus,
                                       String expectedCode) {
        ResponseEntity<?> response = controller.updateTask(
            principal,
            taskId,
            updateTaskRequest(),
            request()
        );
        assertThat(response.getStatusCode()).isEqualTo(expectedStatus);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            expectedCode);
    }

    private UpdateTaskRequest updateTaskRequest() {
        return new UpdateTaskRequest(
            "Updated description long enough",
            65000,
            47.91,
            106.92,
            "Updated Ulaanbaatar location",
            "2026-02-19T00:00:00Z",
            List.of("photo-1")
        );
    }
}
