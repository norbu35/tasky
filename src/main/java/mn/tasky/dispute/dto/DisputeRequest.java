package mn.tasky.dispute.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.lang.Nullable;

public record DisputeRequest(
        @NotBlank @Size(min = 10, max = 2000) String reason, @Nullable @Valid List<EvidenceItem> evidence) {

    public record EvidenceItem(
            @NotBlank @Size(max = 64) String type,
            @Nullable @Size(max = 512) String storageKey,
            @Nullable @Size(max = 5000) String textPayload) {}
}
