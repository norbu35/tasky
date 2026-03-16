package mn.tasky.common.idempotency;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class IdempotencyService {

    private static final int MAX_KEY_LENGTH = 128;
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";

    private final IdempotencyDao idempotencyDao;

    public IdempotencyService(IdempotencyDao idempotencyDao) {
        this.idempotencyDao = idempotencyDao;
    }

    public IdempotencyClaim claim(String userId, String operation, String rawKey) {
        UUID userUuid = required(userId, "userId");
        String key = requireKey(rawKey);
        Instant now = Instant.now();

        int inserted = idempotencyDao.insert(UUID.randomUUID(), userUuid, operation, key, STATUS_IN_PROGRESS, now, now);
        if (inserted == 1) {
            return new IdempotencyClaim(IdempotencyClaim.Status.NEW, null);
        }

        IdempotencyRecord record = idempotencyDao
                .find(userUuid, operation, key)
                .orElseThrow(() -> new IdempotencyException(
                        HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT", "Unable to resolve idempotency key state."));

        if ("COMPLETED".equals(record.status())) {
            return new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record);
        }
        return new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, record);
    }

    public String requireKey(String rawKey) {
        if (!StringUtils.hasText(rawKey)) {
            throw new IdempotencyException(
                    HttpStatus.BAD_REQUEST, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required.");
        }

        String normalized = rawKey.trim();
        if (normalized.length() > MAX_KEY_LENGTH) {
            throw new IdempotencyException(
                    HttpStatus.BAD_REQUEST,
                    "IDEMPOTENCY_KEY_INVALID",
                    "Idempotency-Key must be at most " + MAX_KEY_LENGTH + " characters.");
        }
        return normalized;
    }

    public void completeWithResource(
            String userId, String operation, String rawKey, String resourceType, String resourceId) {
        UUID userUuid = required(userId, "userId");
        UUID resourceUuid = required(resourceId, "resourceId");
        String key = requireKey(rawKey);
        idempotencyDao.markCompleted(userUuid, operation, key, resourceType, resourceUuid, Instant.now());
    }

    public void abandon(String userId, String operation, String rawKey) {
        UUID userUuid = required(userId, "userId");
        String key = requireKey(rawKey);
        idempotencyDao.abandonInProgress(userUuid, operation, key);
    }
}
