package mn.tasky.runtime.publicapi.composition;

import java.util.Map;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.verification.dto.VerificationStatusApiResponse;
import org.springframework.stereotype.Component;

@Component
public class VerificationPublicCompositionService {

    private final IdentityQueryPort identityQueryPort;

    public VerificationPublicCompositionService(IdentityQueryPort identityQueryPort) {
        this.identityQueryPort = identityQueryPort;
    }

    public Map<String, Object> uploadUrlResponse(PresignedUpload upload) {
        return Map.of("upload_url", upload.uploadUrl(), "storage_key", upload.storageKey());
    }

    public VerificationStatusApiResponse verificationStatus(String userId) {
        return statusResponse(identityQueryPort.getVerificationStatus(userId));
    }

    public VerificationStatusApiResponse statusResponse(VerificationStatusResponse status) {
        return new VerificationStatusApiResponse(
                status.status(), status.adminNotes(), status.submittedAt(), status.reviewedAt());
    }
}
