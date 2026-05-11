package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
@DisplayName("MinClientVersionFilter")
class MinClientVersionFilterTest {

    @Mock
    private FilterChain filterChain;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @Test
    @DisplayName("sets header when min version is configured")
    void setsHeader() throws ServletException, IOException {
        MinClientVersionFilter filter = new MinClientVersionFilter("1.2.0");
        filter.doFilterInternal(request, response, filterChain);
        assertThat(response.getHeader("X-Minimum-Client-Version")).isEqualTo("1.2.0");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("skips header when min version is empty")
    void skipsHeaderEmpty() throws ServletException, IOException {
        MinClientVersionFilter filter = new MinClientVersionFilter("");
        filter.doFilterInternal(request, response, filterChain);
        assertThat(response.getHeader("X-Minimum-Client-Version")).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("skips header when min version is null")
    void skipsHeaderNull() throws ServletException, IOException {
        MinClientVersionFilter filter = new MinClientVersionFilter(null);
        filter.doFilterInternal(request, response, filterChain);
        assertThat(response.getHeader("X-Minimum-Client-Version")).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("skips header when min version is blank")
    void skipsHeaderBlank() throws ServletException, IOException {
        MinClientVersionFilter filter = new MinClientVersionFilter("   ");
        filter.doFilterInternal(request, response, filterChain);
        assertThat(response.getHeader("X-Minimum-Client-Version")).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
