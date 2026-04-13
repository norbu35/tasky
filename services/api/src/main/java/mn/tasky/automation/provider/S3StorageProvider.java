package mn.tasky.automation.provider;

import java.net.URI;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.S3StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * StorageProvider adapter wrapping the existing S3/MinIO services.
 * Activated when tasky.storage.provider=s3 (default).
 */
@Component
@ConditionalOnProperty(name = "tasky.storage.provider", havingValue = "s3", matchIfMissing = true)
public class S3StorageProvider implements StorageProvider {

    private static final Logger log = LoggerFactory.getLogger(S3StorageProvider.class);

    private final S3PresignedUrlService presignedUrlService;
    private final S3StorageService s3StorageService;
    private final String bucket;

    public S3StorageProvider(
            S3PresignedUrlService presignedUrlService,
            S3StorageService s3StorageService,
            @org.springframework.beans.factory.annotation.Value("${tasky.storage.bucket:tasky-local}") String bucket) {
        this.presignedUrlService = presignedUrlService;
        this.s3StorageService = s3StorageService;
        this.bucket = bucket;
    }

    @Override
    public URI generateUploadUrl(String key, String contentType) {
        return URI.create(presignedUrlService.generateUploadUrl(key, contentType));
    }

    @Override
    public URI generateDownloadUrl(String key, String namespace) {
        mn.tasky.common.storage.StorageKeyPolicy.Namespace ns =
                mn.tasky.common.storage.StorageKeyPolicy.Namespace.valueOf(namespace);
        return URI.create(presignedUrlService.generateDownloadUrl(key, ns));
    }

    @Override
    public boolean deleteObject(String key) {
        try {
            s3StorageService.deleteObject(key);
            return true;
        } catch (Exception exception) {
            log.warn("Failed to delete object from storage: key={} error={}", key, exception.getMessage());
            return false;
        }
    }

    @Override
    public ProviderHealth health() {
        try {
            s3StorageService
                    .getS3Client()
                    .headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            return ProviderHealth.healthy(providerName());
        } catch (S3Exception exception) {
            return ProviderHealth.unhealthy(providerName(), exception.getMessage());
        } catch (Exception exception) {
            return ProviderHealth.unhealthy(providerName(), exception.getMessage());
        }
    }

    @Override
    public String providerName() {
        return "s3";
    }
}
