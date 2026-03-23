package mn.tasky.common.config;

import java.util.ArrayList;
import java.util.List;
import mn.tasky.common.security.JwtAuthenticationFilter;
import mn.tasky.common.security.RateLimitFilter;
import mn.tasky.common.security.RestAccessDeniedHandler;
import mn.tasky.common.security.RestAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final List<String> allowedOrigins;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final boolean devAuthEnabled;

    public SecurityConfig(
            @Value("${tasky.cors.allowed-origins:http://localhost:5173}") String allowedOrigins,
            @Value("${tasky.dev-auth.enabled:false}") boolean devAuthEnabled,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RateLimitFilter rateLimitFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler) {
        this.allowedOrigins = List.of(allowedOrigins.trim().split("\\s*,\\s*"));
        this.devAuthEnabled = devAuthEnabled;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.restAccessDeniedHandler = restAccessDeniedHandler;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        List<String> publicPaths = new ArrayList<>(List.of(
                "/error",
                "/actuator/health",
                "/actuator/info",
                "/api/v1/system/version",
                "/api/v1/auth/facebook",
                "/api/v1/auth/otp/request",
                "/api/v1/auth/otp/verify",
                "/api/v1/auth/token/refresh",
                "/api/v1/auth/facebook/status",
                "/api/v1/payments/qpay/callback",
                "/ws"));
        if (devAuthEnabled) {
            publicPaths.add("/api/v1/auth/dev/login");
        }
        return http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .headers(headers -> headers.contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .httpStrictTransportSecurity(
                                hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
                        .referrerPolicy(referrer -> referrer.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                                        .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(
                                permissions -> permissions.policy("camera=(), microphone=(), geolocation=(self)")))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handler -> handler.authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler))
                .authorizeHttpRequests(auth -> auth.requestMatchers(publicPaths.toArray(String[]::new))
                        .permitAll()
                        .requestMatchers("/actuator/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/v1/security/customer/**")
                        .hasRole("CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/tasks")
                        .hasRole("CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/tasks/*")
                        .hasRole("CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/tasks/*/cancel")
                        .hasRole("CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/tasks/*/applications")
                        .hasRole("TASKER")
                        .requestMatchers("/api/v1/security/tasker/**")
                        .hasRole("TASKER")
                        .requestMatchers("/api/v1/taskers/me/service-areas")
                        .hasRole("TASKER")
                        .requestMatchers("/api/v1/security/admin/**", "/api/v1/admin/**")
                        .hasRole("ADMIN")
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(rateLimitFilter, JwtAuthenticationFilter.class)
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Accept-Language",
                "Idempotency-Key",
                "X-Correlation-Id",
                "X-Trace-Id",
                "X-Client-Platform"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
