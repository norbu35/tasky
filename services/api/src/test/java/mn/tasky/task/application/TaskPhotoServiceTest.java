package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.util.List;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskPhotoService")
class TaskPhotoServiceTest {

    @Mock
    private S3PresignedUrlService storageService;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    private TaskPhotoService service;

    @BeforeEach
    void setUp() {
        service = new TaskPhotoService(storageService, storageKeyPolicy);
    }

    @Nested
    @DisplayName("createPhotoUploadUrl")
    class CreatePhotoUploadUrl {
        @Test
        @DisplayName("returns empty for unsupported content type")
        void unsupportedContentType() {
            assertThat(service.createPhotoUploadUrl("u1", "application/pdf")).isEmpty();
        }

        @Test
        @DisplayName("creates upload URL for jpeg")
        void jpeg() {
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.TASK_PHOTO, "u1", "jpg"))
                    .thenReturn("task-photo/u1/abc.jpg");
            when(storageService.generateUploadUrl("task-photo/u1/abc.jpg", "image/jpeg"))
                    .thenReturn("https://s3.example.com/upload");
            var result = service.createPhotoUploadUrl("u1", "image/jpeg");
            assertThat(result).isPresent();
            assertThat(result.get().uploadUrl()).isEqualTo("https://s3.example.com/upload");
        }

        @Test
        @DisplayName("creates upload URL for png")
        void png() {
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.TASK_PHOTO, "u1", "png"))
                    .thenReturn("task-photo/u1/abc.png");
            when(storageService.generateUploadUrl("task-photo/u1/abc.png", "image/png"))
                    .thenReturn("https://s3.example.com/upload-png");
            var result = service.createPhotoUploadUrl("u1", "image/png");
            assertThat(result).isPresent();
        }
    }

    @Nested
    @DisplayName("buildPhotoAccessUrls")
    class BuildPhotoAccessUrls {
        @Test
        @DisplayName("returns empty list for null keys")
        void nullKeys() {
            assertThat(service.buildPhotoAccessUrls(null, "c1")).isEmpty();
        }

        @Test
        @DisplayName("returns empty list for empty keys")
        void emptyKeys() {
            assertThat(service.buildPhotoAccessUrls(List.of(), "c1")).isEmpty();
        }

        @Test
        @DisplayName("builds URLs for valid keys")
        void validKeys() {
            when(storageService.generateDownloadUrl("key1", StorageKeyPolicy.Namespace.TASK_PHOTO))
                    .thenReturn("https://s3.example.com/download/key1");
            List<String> urls = service.buildPhotoAccessUrls(List.of("key1"), "c1");
            assertThat(urls).containsExactly("https://s3.example.com/download/key1");
        }

        @Test
        @DisplayName("skips invalid keys")
        void invalidKey() {
            doThrow(new IllegalArgumentException("Invalid key"))
                    .when(storageKeyPolicy)
                    .validateOwnedKey("bad-key", StorageKeyPolicy.Namespace.TASK_PHOTO, "c1");
            List<String> urls = service.buildPhotoAccessUrls(List.of("bad-key"), "c1");
            assertThat(urls).isEmpty();
        }
    }

    @Nested
    @DisplayName("buildOwnedPhotoAccessUrl")
    class BuildOwnedPhotoAccessUrl {
        @Test
        @DisplayName("returns empty when customerId is blank")
        void blankCustomerId() {
            assertThat(service.buildOwnedPhotoAccessUrl("key1", "")).isEmpty();
        }

        @Test
        @DisplayName("returns empty when customerId is null")
        void nullCustomerId() {
            assertThat(service.buildOwnedPhotoAccessUrl("key1", null)).isEmpty();
        }

        @Test
        @DisplayName("returns URL for valid key")
        void validKey() {
            when(storageService.generateDownloadUrl("key1", StorageKeyPolicy.Namespace.TASK_PHOTO))
                    .thenReturn("https://s3.example.com/download/key1");
            assertThat(service.buildOwnedPhotoAccessUrl("key1", "c1")).contains("https://s3.example.com/download/key1");
        }

        @Test
        @DisplayName("returns empty for unowned key")
        void unownedKey() {
            doThrow(new IllegalArgumentException("Not owned"))
                    .when(storageKeyPolicy)
                    .validateOwnedKey("key1", StorageKeyPolicy.Namespace.TASK_PHOTO, "other");
            assertThat(service.buildOwnedPhotoAccessUrl("key1", "other")).isEmpty();
        }
    }
}
