package mn.tasky.common.dto;

public record PresignedUpload(String uploadUrl, String storageKey) {
}
