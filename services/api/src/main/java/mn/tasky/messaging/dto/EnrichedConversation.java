package mn.tasky.messaging.dto;

import java.time.Instant;
import org.jdbi.v3.core.mapper.reflect.ColumnName;

public record EnrichedConversation(
        String id,
        @ColumnName("taskId") String taskId,
        @ColumnName("taskDescription") String taskDescription,
        @ColumnName("counterpartyId") String counterpartyId,
        @ColumnName("counterpartyName") String counterpartyName,
        @ColumnName("counterpartyAvatarUrl") String counterpartyAvatarUrl,
        @ColumnName("counterpartyLastActiveAt") Instant counterpartyLastActiveAt,
        @ColumnName("lastMessageContent") String lastMessageContent,
        @ColumnName("lastMessageAt") Instant lastMessageAt,
        @ColumnName("unreadCount") int unreadCount,
        @ColumnName("createdAt") Instant createdAt) {}
