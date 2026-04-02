package mn.tasky.common.security;

public record JwtPrincipal(String userId, String role, String status) {}
