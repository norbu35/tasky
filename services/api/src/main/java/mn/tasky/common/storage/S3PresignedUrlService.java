package mn.tasky.common.storage;

import java.net.URI;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * Generates presigned PUT and GET URLs for object storage (MinIO / S3-compatible).
 *
 * <p>URL generation is purely local (HMAC signing) — no network call to the storage endpoint is
 * made at generation time. Clients use the returned URLs to upload or download objects directly.
 */
@Service
public class S3PresignedUrlService {

    private final S3Presigner presigner;
    private final StorageKeyPolicy storageKeyPolicy;
    private final String bucket;
    private final Duration uploadTtl;
    private final Duration downloadTtl;

    public S3PresignedUrlService(
            StorageKeyPolicy storageKeyPolicy,
            @Value("${tasky.storage.endpoint:http://localhost:9000}") String endpoint,
            @Value("${tasky.storage.access-key:minioadmin}") String accessKey,
            @Value("${tasky.storage.secret-key:minioadmin}") String secretKey,
            @Value("${tasky.storage.bucket:tasky-local}") String bucket,
            @Value("${tasky.storage.upload-ttl-seconds:900}") long uploadTtlSeconds,
            @Value("${tasky.storage.download-ttl-seconds:3600}") long downloadTtlSeconds) {
        this.storageKeyPolicy = storageKeyPolicy;
        this.bucket = bucket;
        this.uploadTtl = Duration.ofSeconds(uploadTtlSeconds);
        this.downloadTtl = Duration.ofSeconds(downloadTtlSeconds);
        this.presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.US_EAST_1)
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    /**
     * Generates a presigned PUT URL for uploading an object.
     *
     * @param key         Storage key (object path within the bucket).
     * @param contentType MIME type of the object.
     * @return Presigned upload URL valid for {@code uploadTtl}.
     */
    public String generateUploadUrl(String key, String contentType) {
        storageKeyPolicy.validateManagedKey(key);
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(uploadTtl)
                .putObjectRequest(putRequest)
                .build();
        return presigner.presignPutObject(presignRequest).url().toString();
    }

    /**
     * Generates a presigned GET URL for downloading an object.
     *
     * @param key       Storage key (object path within the bucket).
     * @param namespace Expected storage namespace.
     * @return Presigned download URL valid for {@code downloadTtl}.
     */
    public String generateDownloadUrl(String key, StorageKeyPolicy.Namespace namespace) {
        storageKeyPolicy.validateNamespaceKey(key, namespace);
        GetObjectRequest getRequest =
                GetObjectRequest.builder().bucket(bucket).key(key).build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(downloadTtl)
                .getObjectRequest(getRequest)
                .build();
        return presigner.presignGetObject(presignRequest).url().toString();
    }
}
