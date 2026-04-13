package mn.tasky.auth.application;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationRequest;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Handles verification document upload URLs, submission, review, and listing.
 */
@Service
public class VerificationService {

    private static final Map<String, String> VERIFICATION_EXTENSION_BY_CONTENT_TYPE =
            Map.of("image/jpeg", "jpg", "image/png", "png");

    private final UserDao userDao;
    private final ProfileDao profileDao;
    private final VerificationDao verificationDao;
    private final S3PresignedUrlService storageService;
    private final StorageKeyPolicy storageKeyPolicy;
    private final CryptoService cryptoService;

    public VerificationService(
            UserDao userDao,
            ProfileDao profileDao,
            VerificationDao verificationDao,
            S3PresignedUrlService storageService,
            StorageKeyPolicy storageKeyPolicy,
            CryptoService cryptoService) {
        this.userDao = userDao;
        this.profileDao = profileDao;
        this.verificationDao = verificationDao;
        this.storageService = storageService;
        this.storageKeyPolicy = storageKeyPolicy;
        this.cryptoService = cryptoService;
    }

    /**
     * Creates a signed upload URL for verification document images.
     *
     * @param userId      User identifier.
     * @param contentType MIME type of the document image.
     * @return Upload payload when user exists and MIME type is supported.
     */
    public Optional<PresignedUpload> createVerificationUploadUrl(String userId, String contentType) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        String extension = VERIFICATION_EXTENSION_BY_CONTENT_TYPE.get(normalizedContentType);
        if (!StringUtils.hasText(extension)) {
            return Optional.empty();
        }

        String storageKey = storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.VERIFICATION, userId, extension);
        String uploadUrl = storageService.generateUploadUrl(storageKey, normalizedContentType);
        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }

    /**
     * Submits a tasker verification request.
     *
     * @param userId   Tasker identifier.
     * @param frontKey Storage key for front ID image.
     * @param backKey  Storage key for back ID image.
     * @return Verification submission result with status code and payload when successful.
     */
    public VerificationSubmitResult submitVerification(
            String userId, String frontKey, String backKey, String consentPolicyVersion) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return new VerificationSubmitResult(VerificationSubmitResult.USER_NOT_FOUND, null);
        }
        AuthUser user = userOpt.get();

        if (!"TASKER".equals(user.role())) {
            return new VerificationSubmitResult(VerificationSubmitResult.NOT_TASKER, null);
        }

        Optional<VerificationRequest> existingOpt = verificationDao.findLatestByUserId(userId);
        boolean hasPendingOrApproved = existingOpt
                .map(existing -> "PENDING".equals(existing.status()) || "APPROVED".equals(existing.status()))
                .orElse(false);
        if (hasPendingOrApproved) {
            return new VerificationSubmitResult(VerificationSubmitResult.CONFLICT, null);
        }

        String id = java.util.UUID.randomUUID().toString();
        Instant now = Instant.now();
        verificationDao.insert(
                id, userId, frontKey, backKey, "PENDING", now, null, null, consentPolicyVersion, now, null);
        VerificationRequest request =
                new VerificationRequest(id, userId, frontKey, backKey, "PENDING", now, null, null);
        return new VerificationSubmitResult(VerificationSubmitResult.SUCCESS, toVerificationStatus(request));
    }

    private VerificationStatusResponse toVerificationStatus(VerificationRequest request) {
        return new VerificationStatusResponse(
                request.status(),
                request.adminNotes(),
                request.submittedAt() != null ? request.submittedAt().toString() : null,
                request.reviewedAt() != null ? request.reviewedAt().toString() : null);
    }

    /**
     * Returns latest verification status for a user, or {@code NOT_SUBMITTED}.
     *
     * @param userId User identifier.
     * @return Current verification status view.
     */
    public VerificationStatusResponse getVerificationStatus(String userId) {
        return verificationDao
                .findLatestByUserId(userId)
                .map(this::toVerificationStatus)
                .orElseGet(() -> new VerificationStatusResponse("NOT_SUBMITTED", null, null, null));
    }

    /**
     * Returns a single verification detail by ID, including presigned URLs.
     *
     * @param verificationId Verification identifier.
     * @return Verification detail when found.
     */
    public Optional<VerificationDetail> getVerificationDetail(String verificationId) {
        return verificationDao.findById(verificationId).map(this::toVerificationDetail);
    }

    /**
     * Lists pending verification requests using first-page defaults.
     *
     * @param limit Maximum number of rows.
     * @return Pending verification details.
     */
    public List<VerificationDetail> listPendingVerifications(int limit) {
        return listPendingVerifications(null, limit);
    }

    /**
     * Lists pending verification requests with pagination cursor.
     *
     * @param cursor Optional cursor.
     * @param limit  Maximum number of rows.
     * @return Pending verification details.
     */
    public List<VerificationDetail> listPendingVerifications(String cursor, int limit) {
        List<VerificationRequest> pending = verificationDao.findPending(cursor, limit);
        return pending.stream().map(this::toVerificationDetail).toList();
    }

    private VerificationDetail toVerificationDetail(VerificationRequest request) {
        Optional<AuthUser> userOpt = userDao.findById(request.userId());
        UserProfileState profile = profileDao.findByUserId(request.userId()).orElse(null);
        String phone = userOpt.map(u -> decryptPhone(u.phone())).orElse(null);
        String name = profile != null ? profile.fullName() : null;

        String frontUrl = safeVerificationDownloadUrl(request.idCardFrontKey());
        String backUrl = safeVerificationDownloadUrl(request.idCardBackKey());

        return new VerificationDetail(
                request.id(),
                request.userId(),
                phone,
                name,
                frontUrl,
                backUrl,
                request.status(),
                request.adminNotes(),
                request.submittedAt().toString(),
                request.reviewedAt() != null ? request.reviewedAt().toString() : null,
                null,
                null,
                null);
    }

    private String safeVerificationDownloadUrl(String storageKey) {
        if (!StringUtils.hasText(storageKey)) {
            return null;
        }

        try {
            return storageService.generateDownloadUrl(storageKey, StorageKeyPolicy.Namespace.VERIFICATION);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    /**
     * Checks whether a verification request exists.
     *
     * @param verificationId Verification identifier.
     * @return {@code true} when present.
     */
    public boolean verificationExists(String verificationId) {
        return verificationDao.findById(verificationId).isPresent();
    }

    /**
     * Approves a pending verification and marks user status as {@code VERIFIED}.
     *
     * @param verificationId Verification identifier.
     * @return Resolved verification detail when transition succeeds.
     */
    public Optional<VerificationDetail> approveVerification(String verificationId) {
        return resolveVerification(verificationId, "APPROVED", null, true);
    }

    private Optional<VerificationDetail> resolveVerification(
            String verificationId, String status, String notes, boolean markUserVerified) {
        Optional<VerificationRequest> requestOpt = verificationDao.findById(verificationId);
        if (requestOpt.isEmpty()) {
            return Optional.empty();
        }

        VerificationRequest request = requestOpt.get();
        if (!"PENDING".equals(request.status())) {
            return Optional.empty();
        }

        String adminNotes = notes != null ? notes : request.adminNotes();
        Instant now = Instant.now();
        verificationDao.updateStatus(verificationId, status, adminNotes, now);
        if (markUserVerified) {
            userDao.updateStatus(request.userId(), "VERIFIED");
        }

        VerificationRequest resolved = new VerificationRequest(
                request.id(),
                request.userId(),
                request.idCardFrontKey(),
                request.idCardBackKey(),
                status,
                request.submittedAt(),
                adminNotes,
                now);
        return Optional.of(toVerificationDetail(resolved));
    }

    /**
     * Rejects a pending verification with admin reason.
     *
     * @param verificationId Verification identifier.
     * @param reason         Rejection reason/notes.
     * @return Resolved verification detail when transition succeeds.
     */
    public Optional<VerificationDetail> rejectVerification(String verificationId, String reason) {
        return resolveVerification(verificationId, "REJECTED", reason, false);
    }

    private String decryptPhone(String encryptedPhone) {
        if (!StringUtils.hasText(encryptedPhone)) {
            return null;
        }
        return cryptoService.decrypt(encryptedPhone);
    }
}
