package mn.tasky.common.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ClientIpResolver {

    private final int trustedProxyDepth;

    public ClientIpResolver(@Value("${tasky.rate-limit.trusted-proxy-depth:0}") int trustedProxyDepth) {
        this.trustedProxyDepth = Math.max(0, trustedProxyDepth);
    }

    public String resolve(HttpServletRequest request) {
        if (trustedProxyDepth <= 0) {
            return fallback(request);
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (!StringUtils.hasText(forwarded)) {
            return fallback(request);
        }

        String[] chain = forwarded.split(",");
        if (chain.length < trustedProxyDepth) {
            return fallback(request);
        }

        String clientIp = chain[chain.length - trustedProxyDepth].trim();
        return StringUtils.hasText(clientIp) ? clientIp : fallback(request);
    }

    private String fallback(HttpServletRequest request) {
        return StringUtils.hasText(request.getRemoteAddr())
                ? request.getRemoteAddr().trim()
                : "unknown";
    }
}
