package mn.tasky.task.dto;

import mn.tasky.booking.dto.BookingState;

public record TaskAcceptResult(BookingState booking, String errorCode) {
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
    public static final String CONFLICT = "CONFLICT";

    public static TaskAcceptResult success(BookingState booking) {
        return new TaskAcceptResult(booking, null);
    }

    public static final TaskAcceptResult NOT_FOUND_RESULT = new TaskAcceptResult(null, NOT_FOUND);
    public static final TaskAcceptResult FORBIDDEN_RESULT = new TaskAcceptResult(null, FORBIDDEN);
    public static final TaskAcceptResult TASK_NOT_OPEN_RESULT = new TaskAcceptResult(null, TASK_NOT_OPEN);
    public static final TaskAcceptResult CONFLICT_RESULT = new TaskAcceptResult(null, CONFLICT);

    public boolean isSuccess() {
        return booking != null;
    }
}
