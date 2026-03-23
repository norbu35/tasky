package mn.tasky.common.storage;

import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Object-level storage operations (delete, etc.) using S3Client.
 * Separate from {@link S3PresignedUrlService} which only generates presigned URLs.
 */
@Service
public class S3StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3Client;
    private final String bucket;

    public S3StorageService(
            @Value("${tasky.storage.endpoint:http://localhost:9000}") String endpoint,
            @Value("${tasky.storage.access-key:minioadmin}") String accessKey,
            @Value("${tasky.storage.secret-key:minioadmin}") String secretKey,
            @Value("${tasky.storage.bucket:tasky-local}") String bucket) {
        this.bucket = bucket;
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(
                        StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.US_EAST_1)
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .forcePathStyle(true)
                .build();
    }

    /**
     * Deletes an object from the storage bucket.
     * Logs but does not throw on failure to avoid blocking the retention process.
     */
    public void deleteObject(String key) {
        if (key == null || key.contains("..")) {
            log.warn("Skipping delete for invalid storage key: {}", key);
            return;
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            log.info("s3_object_deleted bucket={} key={}", bucket, key);
        } catch (S3Exception e) {
            log.error("Failed to delete S3 object bucket={} key={}: {}", bucket, key, e.getMessage());
        }
    }
}
