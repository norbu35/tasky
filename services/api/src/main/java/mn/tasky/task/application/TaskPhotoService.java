package mn.tasky.task.application;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Service for task photo management: upload URL generation and access URL building.
 */
@Service
public class TaskPhotoService {

    private static final Map<String, String> PHOTO_EXTENSION_BY_CONTENT_TYPE =
            Map.of("image/jpeg", "jpg", "image/png", "png");

    private static final Logger log = LoggerFactory.getLogger(TaskPhotoService.class);

    private final S3PresignedUrlService storageService;
    private final StorageKeyPolicy storageKeyPolicy;

    public TaskPhotoService(S3PresignedUrlService storageService, StorageKeyPolicy storageKeyPolicy) {
        this.storageService = storageService;
        this.storageKeyPolicy = storageKeyPolicy;
    }

    /**
     * Creates a signed upload URL for a task photo.
     *
     * @param userId      Requesting user identifier.
     * @param contentType MIME type to upload.
     * @return Signed upload payload when MIME type is supported.
     */
    public Optional<PresignedUpload> createPhotoUploadUrl(String userId, String contentType) {
        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        String extension = PHOTO_EXTENSION_BY_CONTENT_TYPE.get(normalizedContentType);
        if (!StringUtils.hasText(extension)) {
            return Optional.empty();
        }

        String storageKey = storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.TASK_PHOTO, userId, extension);
        String uploadUrl = storageService.generateUploadUrl(storageKey, normalizedContentType);
        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }

    /**
     * Builds read URLs for a list of stored photo keys.
     *
     * @param storageKeys Photo storage keys.
     * @param customerId  Task owner identifier used to enforce namespace ownership.
     * @return Access URLs, or empty list when no keys are provided.
     */
    public List<String> buildPhotoAccessUrls(List<String> storageKeys, String customerId) {
        if (storageKeys == null || storageKeys.isEmpty()) {
            return List.of();
        }
        return storageKeys.stream()
                .map(storageKey -> buildOwnedPhotoAccessUrl(storageKey, customerId))
                .flatMap(Optional::stream)
                .toList();
    }

    /**
     * Builds a read URL for one stored photo key.
     *
     * @param storageKey Photo storage key.
     * @param customerId Task owner identifier used to enforce namespace ownership.
     * @return Presigned read URL when the key still belongs to the task owner.
     */
    public Optional<String> buildOwnedPhotoAccessUrl(String storageKey, String customerId) {
        if (!StringUtils.hasText(customerId)) {
            return Optional.empty();
        }

        try {
            storageKeyPolicy.validateOwnedKey(storageKey, StorageKeyPolicy.Namespace.TASK_PHOTO, customerId);
            return Optional.of(storageService.generateDownloadUrl(storageKey, StorageKeyPolicy.Namespace.TASK_PHOTO));
        } catch (IllegalArgumentException exception) {
            log.warn("Skipping invalid legacy task photo key for owner {}: {}", customerId, storageKey);
            return Optional.empty();
        }
    }
}
