package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskDraftResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskDraftLocationTests {

    @Test
    @DisplayName("TaskDraftResponse.from() maps location fields")
    void responseIncludesLocationFields() {
        var draft = new TaskDraft(
                "d1", "c1", "cat1", null, 1, null,
                47.9184, 106.9177, "Near State Dept Store",
                Instant.now(), Instant.now().plusSeconds(3600));

        TaskDraftResponse response = TaskDraftResponse.from(draft);

        assertThat(response.locationLat()).isEqualTo(47.9184);
        assertThat(response.locationLng()).isEqualTo(106.9177);
        assertThat(response.locationText()).isEqualTo("Near State Dept Store");
    }

    @Test
    @DisplayName("TaskDraftResponse.from() handles null location")
    void responseHandlesNullLocation() {
        var draft = new TaskDraft(
                "d1", "c1", "cat1", null, 1, null,
                null, null, null,
                Instant.now(), Instant.now().plusSeconds(3600));

        TaskDraftResponse response = TaskDraftResponse.from(draft);

        assertThat(response.locationLat()).isNull();
        assertThat(response.locationLng()).isNull();
        assertThat(response.locationText()).isNull();
    }
}
