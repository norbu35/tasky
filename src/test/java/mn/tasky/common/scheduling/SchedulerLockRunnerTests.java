package mn.tasky.common.scheduling;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class SchedulerLockRunnerTests {

    private final SchedulerLockRunner runner = new SchedulerLockRunner();

    @Test
    void lockAcquired_taskRuns() {
        AtomicBoolean ran = new AtomicBoolean(false);

        runner.runWithLock("test-job", () -> ran.set(true));

        assertThat(ran).isTrue();
    }

    @Test
    void lockAlreadyHeld_taskSkipped() throws InterruptedException {
        CountDownLatch taskStarted = new CountDownLatch(1);
        CountDownLatch allowFinish = new CountDownLatch(1);
        AtomicInteger runCount = new AtomicInteger(0);

        // First invocation: holds the lock until we signal
        Thread holder = new Thread(() -> runner.runWithLock("overlap-job", () -> {
            runCount.incrementAndGet();
            taskStarted.countDown();
            try {
                allowFinish.await(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }));
        holder.start();

        // Wait for the first task to actually start and hold the lock
        assertThat(taskStarted.await(2, TimeUnit.SECONDS)).isTrue();

        // Second invocation while lock is held should be skipped
        runner.runWithLock("overlap-job", runCount::incrementAndGet);

        // Release the first task
        allowFinish.countDown();
        holder.join(2000);

        assertThat(runCount.get()).isEqualTo(1);
    }

    @Test
    void taskThrows_lockReleased() {
        // First call throws
        runner.runWithLock("error-job", () -> {
            throw new RuntimeException("boom");
        });

        // Second call should succeed (lock was released despite exception)
        AtomicBoolean ran = new AtomicBoolean(false);
        runner.runWithLock("error-job", () -> ran.set(true));

        assertThat(ran).isTrue();
    }
}
