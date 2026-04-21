package mn.tasky.common.config;

import java.util.List;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.StompRateLimitInterceptor;
import mn.tasky.common.security.TokenBlacklistService;
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

@Configuration
public class ChannelInterceptorConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenService jwtTokenService;
    private final MessagingService messagingService;
    private final UserProfileService userProfileService;
    private final StompRateLimitInterceptor stompRateLimitInterceptor;
    private final TokenBlacklistService tokenBlacklistService;

    public ChannelInterceptorConfig(
            JwtTokenService jwtTokenService,
            @Lazy MessagingService messagingService,
            UserProfileService userProfileService,
            StompRateLimitInterceptor stompRateLimitInterceptor,
            TokenBlacklistService tokenBlacklistService) {
        this.jwtTokenService = jwtTokenService;
        this.messagingService = messagingService;
        this.userProfileService = userProfileService;
        this.stompRateLimitInterceptor = stompRateLimitInterceptor;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompRateLimitInterceptor, new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

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
                    JwtPrincipal principal = jwtTokenService
                            .parse(token)
                            .orElseThrow(() -> new IllegalArgumentException("Unauthorized"));
                    if (tokenBlacklistService.isRevoked(principal.jti())) {
                        throw new IllegalArgumentException("TOKEN_REVOKED");
                    }
                    assertUserNotRestricted(principal);
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + principal.role())));
                    accessor.setUser(auth);
                } else if (StompCommand.SUBSCRIBE.equals(command)) {
                    assertAuthorizedSubscription(accessor);
                } else if (StompCommand.SEND.equals(command)) {
                    String destination = accessor.getDestination();
                    if (destination == null || !destination.matches("/app/conversations/[^/]+/messages")) {
                        throw new IllegalArgumentException("Forbidden: send not allowed");
                    }
                    requireJwtPrincipal(accessor);
                }
                return message;
            }
        });
    }

    private void assertAuthorizedSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            throw new IllegalArgumentException("Forbidden: null destination");
        }

        if (destination.startsWith("/topic/conversations/")) {
            String conversationId = destination.substring("/topic/conversations/".length());
            JwtPrincipal principal = requireJwtPrincipal(accessor);
            assertUserNotRestricted(principal);
            if (!messagingService.isParticipant(principal.userId(), conversationId)) {
                throw new IllegalArgumentException("Forbidden");
            }
            return;
        }

        throw new IllegalArgumentException("Forbidden: subscription not allowed");
    }

    private JwtPrincipal requireJwtPrincipal(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth)
                || !(auth.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new IllegalArgumentException("Unauthorized");
        }
        return principal;
    }

    private void assertUserNotRestricted(JwtPrincipal principal) {
        String effectiveStatus =
                userProfileService.currentUserStatus(principal.userId()).orElse(principal.status());
        if ("BANNED".equals(effectiveStatus)
                || "SUSPENDED".equals(effectiveStatus)
                || "DELETED".equals(effectiveStatus)) {
            throw new IllegalArgumentException("Forbidden");
        }
    }
}
