package mn.tasky.admin.api;

import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.runtime.adminapi.composition.AdminMessageCompositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/messages")
@Validated
public class AdminMessageController {

    private final AdminMessageCompositionService adminMessageCompositionService;

    public AdminMessageController(AdminMessageCompositionService adminMessageCompositionService) {
        this.adminMessageCompositionService = adminMessageCompositionService;
    }

    @GetMapping("/flagged")
    public ResponseEntity<?> listFlagged(
            @RequestParam(required = false) String cursor, @RequestParam(defaultValue = "50") int limit) {
        var page = adminMessageCompositionService.listFlagged(cursor, limit);
        return ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
    }
}
