package mn.tasky.automation.provider;

import java.net.URI;

/**
 * Contract for object storage providers (S3, GCS, Azure Blob, MinIO, etc.).
 */
public interface StorageProvider {

    /**
     * Generates a presigned URL for uploading an object.
     *
     * @param key         Storage key (object path within the bucket/container).
     * @param contentType MIME type of the object.
     * @return Presigned upload URL.
     */
    URI generateUploadUrl(String key, String contentType);

    /**
     * Generates a presigned URL for downloading an object.
     *
     * @param key       Storage key (object path within the bucket/container).
     * @param namespace Logical namespace for access control.
     * @return Presigned download URL.
     */
    URI generateDownloadUrl(String key, String namespace);

    /**
     * Deletes an object from storage.
     *
     * @param key Storage key to delete.
     * @return true if the object was deleted, false if it didn't exist.
     */
    boolean deleteObject(String key);

    /**
     * Returns the provider's current health status.
     */
    ProviderHealth health();

    /**
     * Returns the canonical provider name (e.g. "s3", "minio", "gcs").
     */
    String providerName();
}
