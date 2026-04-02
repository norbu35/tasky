package mn.tasky.common.storage;

import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class StorageKeyPolicy {

    private static final Pattern PATH_SEPARATOR = Pattern.compile("/");
    private static final Pattern OWNER_PATTERN = Pattern.compile("^[A-Za-z0-9-]+$");
    private static final Pattern FILE_NAME_PATTERN = Pattern.compile("^[A-Za-z0-9_.@-]+$");
    private static final Pattern EXTENSION_PATTERN = Pattern.compile("^[a-z]{2,4}$");

    public enum Namespace {
        TASK_PHOTO("tasks"),
        AVATAR("avatars"),
        VERIFICATION("verification"),
        DISPUTE_EVIDENCE("evidence");

        private final String pathSegment;

        Namespace(String pathSegment) {
            this.pathSegment = pathSegment;
        }

        public String pathSegment() {
            return pathSegment;
        }
    }

    public String createKey(Namespace namespace, String ownerId, String extension) {
        validateOwner(ownerId);
        validateExtension(extension);
        return "uploads/" + namespace.pathSegment() + "/" + ownerId + "/" + UUID.randomUUID() + "." + extension;
    }

    public void validateManagedKey(String key) {
        ParsedKey parsedKey = parse(key);
        if (parsedKey.namespace() == null) {
            throw new IllegalArgumentException("Invalid storage key");
        }
    }

    public void validateOwnedKey(String key, Namespace namespace, String ownerId) {
        ParsedKey parsedKey = parse(key);
        if (parsedKey.namespace() != namespace || !parsedKey.ownerId().equals(ownerId)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
    }

    public void validateNamespaceKey(String key, Namespace namespace) {
        ParsedKey parsedKey = parse(key);
        if (parsedKey.namespace() != namespace) {
            throw new IllegalArgumentException("Invalid storage key");
        }
    }

    private ParsedKey parse(String key) {
        if (!StringUtils.hasText(key) || key.contains("..") || key.contains("//")) {
            throw new IllegalArgumentException("Invalid storage key");
        }

        String[] parts = PATH_SEPARATOR.split(key, -1);
        if (parts.length != 4 || !"uploads".equals(parts[0])) {
            throw new IllegalArgumentException("Invalid storage key");
        }

        Namespace namespace = namespaceFor(parts[1]);
        if (namespace == null) {
            throw new IllegalArgumentException("Invalid storage key");
        }

        validateOwner(parts[2]);
        validateFileName(parts[3]);
        return new ParsedKey(namespace, parts[2]);
    }

    private Namespace namespaceFor(String pathSegment) {
        for (Namespace namespace : Namespace.values()) {
            if (namespace.pathSegment().equals(pathSegment)) {
                return namespace;
            }
        }
        return null;
    }

    private void validateOwner(String ownerId) {
        if (!StringUtils.hasText(ownerId) || !OWNER_PATTERN.matcher(ownerId).matches()) {
            throw new IllegalArgumentException("Invalid storage key");
        }
    }

    private void validateExtension(String extension) {
        if (!StringUtils.hasText(extension) || !EXTENSION_PATTERN.matcher(extension).matches()) {
            throw new IllegalArgumentException("Invalid storage key");
        }
    }

    private void validateFileName(String fileName) {
        if (!StringUtils.hasText(fileName) || !FILE_NAME_PATTERN.matcher(fileName).matches()) {
            throw new IllegalArgumentException("Invalid storage key");
        }

        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex <= 0 || dotIndex == fileName.length() - 1) {
            throw new IllegalArgumentException("Invalid storage key");
        }

        validateExtension(fileName.substring(dotIndex + 1));
    }

    private record ParsedKey(Namespace namespace, String ownerId) {}
}
