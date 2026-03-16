package mn.tasky.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectVerificationRequest(@NotBlank String reason) {}
