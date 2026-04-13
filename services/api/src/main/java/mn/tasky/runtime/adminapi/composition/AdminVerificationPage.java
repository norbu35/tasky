package mn.tasky.runtime.adminapi.composition;

import java.util.List;
import mn.tasky.admin.dto.VerificationDetailResponse;

public record AdminVerificationPage(List<VerificationDetailResponse> data, String nextCursor, boolean hasMore) {}
