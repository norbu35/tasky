package mn.tasky.dispute.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record DisputeRequest(
        @NotBlank @Size(min = 10, max = 2000) String reason, @NotEmpty @Valid List<EvidenceItem> evidence) {

    public record EvidenceItem(
            @NotBlank @Size(max = 64) String type,
            @org.springframework.lang.Nullable @Size(max = 512) String storageKey,
            @org.springframework.lang.Nullable @Size(max = 5000) String textPayload) {}
}
