package mn.tasky.auth.dto;

import java.time.Instant;

public class AuthUser {
    private final String id;
    private final String phone;
    private final String role;
    private final String status;
    private final Instant createdAt;

    public AuthUser(String id, String phone, String role, String status, Instant createdAt) {
        this.id = id;
        this.phone = phone;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
    }

    public String id() { return id; }
    public String phone() { return phone; }
    public String role() { return role; }
    public String status() { return status; }
    public Instant createdAt() { return createdAt; }
}
