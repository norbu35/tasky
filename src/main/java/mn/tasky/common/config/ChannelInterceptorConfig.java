package mn.tasky.common.config;

import mn.tasky.auth.application.AuthService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.messaging.application.MessagingService;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
public class ChannelInterceptorConfig
    implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenService jwtTokenService;
    private final MessagingService messagingService;
    private final AuthService authService;

    public ChannelInterceptorConfig(JwtTokenService jwtTokenService,
                                    @Lazy MessagingService messagingService,
                                    AuthService authService) {
        this.jwtTokenService = jwtTokenService;
        this.messagingService = messagingService;
        this.authService = authService;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message,
                                      @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor =
                    MessageHeaderAccessor.getAccessor(message,
                        StompHeaderAccessor.class);

                if (accessor == null) {
                    return message;
                }

                StompCommand command = accessor.getCommand();
                if (command == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(command)) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        throw new IllegalArgumentException("Unauthorized");
                    }
                    String token = authHeader.substring(7);
                    JwtPrincipal principal = jwtTokenService.parse(token)
                        .orElseThrow(() -> new IllegalArgumentException("Unauthorized"));
                    assertUserNotRestricted(principal);
                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + principal.role()))
                        );
                    accessor.setUser(auth);
                } else if (StompCommand.SUBSCRIBE.equals(command)) {
                    assertAuthorizedConversationSubscription(accessor);
                }
                return message;
            }
        });
    }

    private void assertAuthorizedConversationSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/topic/conversations/")) {
            return;
        }
        String conversationId = destination.substring("/topic/conversations/".length());
        JwtPrincipal principal = requireJwtPrincipal(accessor);
        assertUserNotRestricted(principal);
        boolean isParticipant = messagingService.listConversations(principal.userId())
            .stream()
            .anyMatch(c -> c.id()
                .equals(conversationId));
        if (!isParticipant) {
            throw new IllegalArgumentException("Forbidden");
        }
    }

    private JwtPrincipal requireJwtPrincipal(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth)
            || !(auth.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new IllegalArgumentException("Unauthorized");
        }
        return principal;
    }

    private void assertUserNotRestricted(JwtPrincipal principal) {
        String effectiveStatus = authService.currentUserStatus(principal.userId())
            .orElse(principal.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            throw new IllegalArgumentException("Forbidden");
        }
    }
}
