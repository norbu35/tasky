package mn.tasky.admin.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.common.outbox.OutboxEvent;
import mn.tasky.common.outbox.OutboxEventDao;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoints for inspecting and replaying outbox events.
 * Secured by SecurityConfig via /api/v1/admin/** path matching.
 */
@RestController
@RequestMapping("/api/v1/admin/outbox")
public class OutboxReplayController {

    private final OutboxEventDao outboxEventDao;

    public OutboxReplayController(OutboxEventDao outboxEventDao) {
        this.outboxEventDao = outboxEventDao;
    }

    @GetMapping("/events")
    public ResponseEntity<OutboxEventPage> listEvents(
            @RequestParam(defaultValue = "FAILED") String status,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        int clampedLimit = Math.max(1, Math.min(limit, 200));
        List<OutboxEvent> events = outboxEventDao.findByStatus(status, clampedLimit, offset);
        long total = outboxEventDao.countByStatus(status);
        return ResponseEntity.ok(new OutboxEventPage(events, total, offset, clampedLimit));
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<OutboxEvent> getEvent(@PathVariable String id) {
        UUID uuid = UUID.fromString(id);
        OutboxEvent event = outboxEventDao.findById(uuid);
        return event != null
                ? ResponseEntity.ok(event)
                : ResponseEntity.notFound().build();
    }

    @PostMapping("/events/{id}/replay")
    public ResponseEntity<Map<String, Object>> replayEvent(@PathVariable String id) {
        UUID uuid = UUID.fromString(id);
        int updated = outboxEventDao.resetForReplay(uuid, Instant.now());
        if (updated == 0) {
            return ResponseEntity.status(409)
                    .body(Map.of(
                            "error", "event_not_replayable",
                            "message", "Event is not in FAILED or PROCESSED status, or does not exist"));
        }
        return ResponseEntity.ok(Map.of("status", "replayed", "eventId", id));
    }

    @GetMapping("/summary")
    public ResponseEntity<OutboxSummary> getSummary() {
        long pending = outboxEventDao.countByStatus("PENDING");
        long failed = outboxEventDao.countByStatus("FAILED");
        long processed = outboxEventDao.countByStatus("PROCESSED");
        long processing = outboxEventDao.countByStatus("PROCESSING");
        return ResponseEntity.ok(new OutboxSummary(pending, failed, processed, processing));
    }

    @PostMapping("/events/replay-all")
    public ResponseEntity<Map<String, Object>> replayAllFailed() {
        List<OutboxEvent> failed = outboxEventDao.findByStatus("FAILED", 10000, 0);
        int replayed = 0;
        for (OutboxEvent event : failed) {
            int updated = outboxEventDao.resetForReplay(event.id(), Instant.now());
            replayed += updated;
        }
        return ResponseEntity.ok(
                Map.of("status", "replay_all_initiated", "replayed_count", replayed, "total_failed", failed.size()));
    }

    public record OutboxEventPage(List<OutboxEvent> events, long total, int offset, int limit) {}

    public record OutboxSummary(long pending, long failed, long processed, long processing) {}
}
