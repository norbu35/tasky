package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

class StompRateLimitInterceptorTest {

    private StompRateLimitInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new StompRateLimitInterceptor();
    }

    private Message<?> stompSend(String userId) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        if (userId != null) {
            JwtPrincipal principal = new JwtPrincipal(userId, "TASKER", "ACTIVE", "jti1");
            accessor.setUser(new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of()));
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage("payload".getBytes(), accessor.getMessageHeaders());
    }

    @Test
    void preSend_nonSendCommand_passesThrough() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        Message<?> msg = MessageBuilder.createMessage("payload".getBytes(), accessor.getMessageHeaders());
        MessageChannel channel = mock(MessageChannel.class);

        Message<?> result = interceptor.preSend(msg, channel);

        assertThat(result).isSameAs(msg);
    }

    @Test
    void preSend_noUser_rejectsUnauthenticated() {
        Message<?> msg = stompSend(null);
        MessageChannel channel = mock(MessageChannel.class);

        assertThatThrownBy(() -> interceptor.preSend(msg, channel))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Authentication required for messaging");
    }

    @Test
    void preSend_withUser_passesThrough() {
        Message<?> msg = stompSend("u1");
        MessageChannel channel = mock(MessageChannel.class);

        Message<?> result = interceptor.preSend(msg, channel);

        assertThat(result).isSameAs(msg);
    }

    @Test
    void preSend_rateLimitExceeded_throws() {
        // Send 30 messages (limit), then the 31st should fail
        MessageChannel channel = mock(MessageChannel.class);
        for (int i = 0; i < 30; i++) {
            interceptor.preSend(stompSend("u1"), channel);
        }

        assertThatThrownBy(() -> interceptor.preSend(stompSend("u1"), channel))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Rate limit exceeded");
    }

    @Test
    void preSend_differentUsers_separateBuckets() {
        MessageChannel channel = mock(MessageChannel.class);

        // Exhaust user1's bucket
        for (int i = 0; i < 30; i++) {
            interceptor.preSend(stompSend("u1"), channel);
        }

        // User2 should still be able to send
        Message<?> result = interceptor.preSend(stompSend("u2"), channel);
        assertThat(result).isNotNull();
    }
}
