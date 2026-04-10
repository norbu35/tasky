package mn.tasky.task.dto;

import org.jdbi.v3.core.mapper.reflect.ColumnName;

public record RecentLocation(
        @ColumnName("location_lat") double locationLat,
        @ColumnName("location_lng") double locationLng,
        @ColumnName("location_text") String locationText) {}
