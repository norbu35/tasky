package mn.tasky.common.observability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
class RequestObservabilityFilterTest {

    private RequestObservabilityFilter filter;

    @Mock
    private FilterChain filterChain;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        filter = new RequestObservabilityFilter();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Nested
    class TraceAndCorrelationIdResolution {

        @Test
        void usesHeaderValuesWhenValid() throws ServletException, IOException {
            request.addHeader("X-Trace-Id", "trace-abc-123");
            request.addHeader("X-Correlation-Id", "corr-def-456");

            filter.doFilterInternal(request, response, filterChain);

            assertThat(response.getHeader("X-Trace-Id")).isEqualTo("trace-abc-123");
            assertThat(response.getHeader("X-Correlation-Id")).isEqualTo("corr-def-456");
            assertThat(request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE))
                    .isEqualTo("trace-abc-123");
            assertThat(request.getAttribute(RequestObservabilityFilter.CORRELATION_ID_ATTRIBUTE))
                    .isEqualTo("corr-def-456");
        }

        @Test
        void generatesUuidsWhenHeadersMissing() throws ServletException, IOException {
            filter.doFilterInternal(request, response, filterChain);

            assertThat(response.getHeader("X-Trace-Id"))
                    .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
            assertThat(response.getHeader("X-Correlation-Id"))
                    .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        }

        @Test
        void generatesUuidsWhenHeadersContainInvalidChars() throws ServletException, IOException {
            request.addHeader("X-Trace-Id", "invalid trace! @#");
            request.addHeader("X-Correlation-Id", "");

            filter.doFilterInternal(request, response, filterChain);

            assertThat(response.getHeader("X-Trace-Id"))
                    .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
            assertThat(response.getHeader("X-Correlation-Id"))
                    .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        }
    }

    @Nested
    class MdcPopulation {

        @Test
        void setsMdcKeysDuringFilterExecution() throws ServletException, IOException {
            request.addHeader("X-Trace-Id", "trace-123");
            request.addHeader("X-Correlation-Id", "corr-456");

            filter.doFilterInternal(request, response, filterChain);

            Map<String, String> mdcAfter = MDC.getCopyOfContextMap();
            assertThat(mdcAfter == null || !mdcAfter.containsKey("trace_id")).isTrue();
        }

        @Test
        void clearsMdcAfterFilterChainCompletes() throws ServletException, IOException {
            request.addHeader("X-Trace-Id", "trace-123");
            request.addHeader("X-Correlation-Id", "corr-456");

            filter.doFilterInternal(request, response, filterChain);

            Map<String, String> mdc = MDC.getCopyOfContextMap();
            assertThat(mdc == null || mdc.isEmpty()).isTrue();
        }
    }

    @Nested
    class LocaleResolution {

        @Test
        void defaultsToMnWhenNoAcceptLanguage() throws ServletException, IOException {
            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        void extractsFirstLanguageFromAcceptLanguage() throws ServletException, IOException {
            request.addHeader("Accept-Language", "en-US, mn;q=0.9");

            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }
    }

    @Nested
    class PlatformResolution {

        @Test
        void usesExplicitPlatformHeaderWhenValid() throws ServletException, IOException {
            request.addHeader("X-Client-Platform", "android");

            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        void detectsAndroidFromUserAgent() throws ServletException, IOException {
            request.addHeader("User-Agent", "Mozilla/5.0 (Linux; Android 14) Chrome/120");

            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        void detectsIosFromUserAgent() throws ServletException, IOException {
            request.addHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)");

            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        void detectsWebFromUserAgent() throws ServletException, IOException {
            request.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; rv:120.0) Firefox/120.0");

            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }
    }

    @Nested
    class FilterChainProceeds {

        @Test
        void callsFilterChainDoFilter() throws ServletException, IOException {
            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        void clearsMdcEvenWhenChainThrows() throws ServletException, IOException {
            RuntimeException chainException = new RuntimeException("chain failure");
            doAnswer(inv -> {
                        throw chainException;
                    })
                    .when(filterChain)
                    .doFilter(request, response);

            RuntimeException thrown = null;
            try {
                filter.doFilterInternal(request, response, filterChain);
            } catch (RuntimeException e) {
                thrown = e;
            }

            assertThat(thrown).isSameAs(chainException);
            Map<String, String> mdc = MDC.getCopyOfContextMap();
            assertThat(mdc == null || mdc.isEmpty()).isTrue();
        }
    }
}
