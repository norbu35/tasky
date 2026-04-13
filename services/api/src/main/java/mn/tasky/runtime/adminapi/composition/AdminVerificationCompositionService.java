package mn.tasky.runtime.adminapi.composition;

import java.util.List;
import java.util.Optional;
import mn.tasky.admin.dto.VerificationDetailResponse;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.projection.admin.AdminVerificationQueueProjectionService;
import mn.tasky.projection.admin.AdminVerificationQueueRow;
import org.springframework.stereotype.Component;

@Component
public class AdminVerificationCompositionService {

    private final AdminVerificationQueueProjectionService queueProjectionService;
    private final IdentityQueryPort identityQueryPort;
    private final AuditEventDao auditEventDao;
    private final CryptoService cryptoService;
    private final S3PresignedUrlService storageService;

    public AdminVerificationCompositionService(
            AdminVerificationQueueProjectionService queueProjectionService,
            IdentityQueryPort identityQueryPort,
            AuditEventDao auditEventDao,
            CryptoService cryptoService,
            S3PresignedUrlService storageService) {
        this.queueProjectionService = queueProjectionService;
        this.identityQueryPort = identityQueryPort;
        this.auditEventDao = auditEventDao;
        this.cryptoService = cryptoService;
        this.storageService = storageService;
    }

    public AdminVerificationPage pendingVerifications(String cursor, int limit) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<AdminVerificationQueueRow> pending = queueProjectionService.listPending(cursor, clampedLimit + 1);
        boolean hasMore = pending.size() > clampedLimit;
        List<AdminVerificationQueueRow> pageRows = hasMore ? pending.subList(0, clampedLimit) : pending;
        List<VerificationDetailResponse> data =
                pageRows.stream().map(this::queueDetailResponse).toList();
        String nextCursor = hasMore ? pageRows.getLast().id() : null;
        return new AdminVerificationPage(data, nextCursor, hasMore);
    }

    public Optional<VerificationDetailResponse> verificationDetail(String verificationId, String adminUserId) {
        return identityQueryPort.getVerificationDetail(verificationId).map(detail -> {
            if (detail.idCardFrontUrl() != null) {
                auditEventDao.insert(
                        adminUserId,
                        "VERIFICATION_MEDIA_VIEWED",
                        "VERIFICATION",
                        detail.id(),
                        "{\"field\":\"id_card_front\"}");
            }
            if (detail.idCardBackUrl() != null) {
                auditEventDao.insert(
                        adminUserId,
                        "VERIFICATION_MEDIA_VIEWED",
                        "VERIFICATION",
                        detail.id(),
                        "{\"field\":\"id_card_back\"}");
            }
            return detailResponse(detail);
        });
    }

    public VerificationDetailResponse detailResponse(VerificationDetail detail) {
        return new VerificationDetailResponse(
                detail.id(),
                detail.userId(),
                detail.userPhone(),
                detail.userName(),
                detail.idCardFrontUrl(),
                detail.idCardBackUrl(),
                detail.status(),
                detail.adminNotes(),
                detail.submittedAt(),
                detail.reviewedAt());
    }

    private VerificationDetailResponse queueDetailResponse(AdminVerificationQueueRow row) {
        return new VerificationDetailResponse(
                row.id(),
                row.userId(),
                decryptPhone(row.encryptedUserPhone()),
                row.userName(),
                safeVerificationDownloadUrl(row.idCardFrontKey()),
                safeVerificationDownloadUrl(row.idCardBackKey()),
                row.status(),
                row.adminNotes(),
                row.submittedAt() != null ? row.submittedAt().toString() : null,
                row.reviewedAt() != null ? row.reviewedAt().toString() : null);
    }

    private String decryptPhone(String encryptedPhone) {
        if (encryptedPhone == null || encryptedPhone.isBlank()) {
            return null;
        }
        try {
            return cryptoService.decrypt(encryptedPhone);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String safeVerificationDownloadUrl(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return null;
        }
        try {
            return storageService.generateDownloadUrl(storageKey, StorageKeyPolicy.Namespace.VERIFICATION);
        } catch (RuntimeException exception) {
            return null;
        }
    }
}
