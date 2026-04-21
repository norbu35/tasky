package mn.tasky.common.scheduling;

import mn.tasky.common.outbox.OutboxRelayService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OutboxRelayScheduler {

    private final OutboxRelayService outboxRelayService;

    public OutboxRelayScheduler(OutboxRelayService outboxRelayService) {
        this.outboxRelayService = outboxRelayService;
    }

    @Scheduled(fixedDelay = 10_000)
    @SchedulerLock(name = "outbox_relay", lockAtMostFor = "4m", lockAtLeastFor = "5s")
    public void relayPendingEvents() {
        outboxRelayService.relayPending();
    }
}
