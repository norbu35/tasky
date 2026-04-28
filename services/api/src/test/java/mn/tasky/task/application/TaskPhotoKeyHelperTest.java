package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.util.List;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskPhotoKeyHelper")
class TaskPhotoKeyHelperTest {

    @Mock
    private TaskPhotoDao taskPhotoDao;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    private TaskPhotoKeyHelper helper;

    @BeforeEach
    void setUp() {
        helper = new TaskPhotoKeyHelper(taskPhotoDao, storageKeyPolicy);
    }

    @Nested
    @DisplayName("populatePhotoKeys")
    class PopulatePhotoKeys {
        @Test
        @DisplayName("returns same task when photo keys already present")
        void alreadyPresent() {
            TaskState withPhotos = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "OPEN",
                    java.time.Instant.now(),
                    "BUDGET",
                    List.of("k1"),
                    null,
                    null,
                    null,
                    java.time.Instant.now(),
                    java.time.Instant.now());
            assertThat(helper.populatePhotoKeys(withPhotos)).isSameAs(withPhotos);
        }

        @Test
        @DisplayName("populates from DAO when photo keys are null")
        void nullPhotoKeys() {
            TaskState noPhotos = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "OPEN",
                    java.time.Instant.now(),
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    java.time.Instant.now(),
                    java.time.Instant.now());
            when(taskPhotoDao.findKeysByTaskId("t1")).thenReturn(List.of("key1"));
            TaskState result = helper.populatePhotoKeys(noPhotos);
            assertThat(result.photoKeys()).containsExactly("key1");
        }
    }

    @Nested
    @DisplayName("areOwnedTaskPhotoKeys")
    class AreOwnedTaskPhotoKeys {
        @Test
        @DisplayName("returns true for empty list")
        void empty() {
            assertThat(helper.areOwnedTaskPhotoKeys(List.of(), "c1")).isTrue();
        }

        @Test
        @DisplayName("returns false when a key fails validation")
        void notOwned() {
            doThrow(new IllegalArgumentException("Not owned"))
                    .when(storageKeyPolicy)
                    .validateOwnedKey("bad-key", StorageKeyPolicy.Namespace.TASK_PHOTO, "c1");
            assertThat(helper.areOwnedTaskPhotoKeys(List.of("bad-key"), "c1")).isFalse();
        }

        @Test
        @DisplayName("returns true when all keys pass validation")
        void allOwned() {
            assertThat(helper.areOwnedTaskPhotoKeys(List.of("valid-key"), "c1")).isTrue();
        }
    }
}
