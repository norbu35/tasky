package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.task.application.TaskPhotoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Domain-unit tests for TaskPhotoService.
 * Covers upload URL generation and access URL building with namespace ownership validation.
 */
@ExtendWith(MockitoExtension.class)
class TaskPhotoServiceTests {

    private static final String USER_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();

    @Mock
    private S3PresignedUrlService storageService;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    private TaskPhotoService service;

    @BeforeEach
    void setUp() {
        service = new TaskPhotoService(storageService, storageKeyPolicy);
    }

    // ── createPhotoUploadUrl ──────────────────────────────────────────────

    @Nested
    @DisplayName("createPhotoUploadUrl")
    class CreatePhotoUploadUrl {

        @Test
        @DisplayName("Returns upload URL for image/jpeg")
        void jpegReturnsUrl() {
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.TASK_PHOTO, USER_ID, "jpg"))
                    .thenReturn("task-photo/key.jpg");
            when(storageService.generateUploadUrl("task-photo/key.jpg", "image/jpeg"))
                    .thenReturn("https://s3/upload");

            Optional<PresignedUpload> result = service.createPhotoUploadUrl(USER_ID, "image/jpeg");

            assertThat(result).isPresent();
            assertThat(result.get().uploadUrl()).isEqualTo("https://s3/upload");
            assertThat(result.get().storageKey()).isEqualTo("task-photo/key.jpg");
        }

        @Test
        @DisplayName("Returns upload URL for image/png")
        void pngReturnsUrl() {
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.TASK_PHOTO, USER_ID, "png"))
                    .thenReturn("task-photo/key.png");
            when(storageService.generateUploadUrl("task-photo/key.png", "image/png"))
                    .thenReturn("https://s3/upload-png");

            Optional<PresignedUpload> result = service.createPhotoUploadUrl(USER_ID, "image/png");

            assertThat(result).isPresent();
            assertThat(result.get().uploadUrl()).isEqualTo("https://s3/upload-png");
            assertThat(result.get().storageKey()).isEqualTo("task-photo/key.png");
        }

        @Test
        @DisplayName("Returns empty for unsupported MIME type")
        void unsupportedMimeReturnsEmpty() {
            assertThat(service.createPhotoUploadUrl(USER_ID, "image/webp")).isEmpty();
            assertThat(service.createPhotoUploadUrl(USER_ID, "application/pdf")).isEmpty();
        }

        @Test
        @DisplayName("Case-insensitive MIME type matching")
        void caseInsensitiveMime() {
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.TASK_PHOTO, USER_ID, "jpg"))
                    .thenReturn("task-photo/key.jpg");
            when(storageService.generateUploadUrl("task-photo/key.jpg", "image/jpeg"))
                    .thenReturn("https://s3/upload");

            assertThat(service.createPhotoUploadUrl(USER_ID, "Image/JPEG")).isPresent();
        }
    }

    // ── buildPhotoAccessUrls ──────────────────────────────────────────────

    @Nested
    @DisplayName("buildPhotoAccessUrls")
    class BuildPhotoAccessUrls {

        @Test
        @DisplayName("Returns empty list for null keys")
        void nullKeysReturnsEmpty() {
            assertThat(service.buildPhotoAccessUrls(null, CUSTOMER_ID)).isEmpty();
        }

        @Test
        @DisplayName("Returns empty list for empty keys")
        void emptyKeysReturnsEmpty() {
            assertThat(service.buildPhotoAccessUrls(List.of(), CUSTOMER_ID)).isEmpty();
        }

        @Test
        @DisplayName("Builds download URLs for valid keys")
        void buildsDownloadUrls() {
            // storageKeyPolicy.validateOwnedKey does not throw = key is valid
            when(storageService.generateDownloadUrl("key1", StorageKeyPolicy.Namespace.TASK_PHOTO))
                    .thenReturn("https://s3/download/key1");
            when(storageService.generateDownloadUrl("key2", StorageKeyPolicy.Namespace.TASK_PHOTO))
                    .thenReturn("https://s3/download/key2");

            List<String> urls = service.buildPhotoAccessUrls(List.of("key1", "key2"), CUSTOMER_ID);

            assertThat(urls).containsExactly("https://s3/download/key1", "https://s3/download/key2");
        }

        @Test
        @DisplayName("Skips invalid legacy keys without failing")
        void skipsInvalidKeys() {
            when(storageService.generateDownloadUrl("valid-key", StorageKeyPolicy.Namespace.TASK_PHOTO))
                    .thenReturn("https://s3/download/valid");
            // The invalid key will throw during validateOwnedKey
            org.mockito.Mockito.doThrow(new IllegalArgumentException("bad key"))
                    .when(storageKeyPolicy)
                    .validateOwnedKey("invalid-key", StorageKeyPolicy.Namespace.TASK_PHOTO, CUSTOMER_ID);

            List<String> urls = service.buildPhotoAccessUrls(List.of("invalid-key", "valid-key"), CUSTOMER_ID);

            assertThat(urls).containsExactly("https://s3/download/valid");
        }
    }

}
