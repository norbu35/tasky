package mn.tasky.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Controller;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

final class OpenApiContractTestSupport {

    private static final Pattern PATH_PATTERN = Pattern.compile("^  (?<path>/[^:]+):$", Pattern.MULTILINE);

    private OpenApiContractTestSupport() {}

    static String readOpenApi() throws IOException {
        return Files.readString(Path.of("docs/API.yaml"));
    }

    static Set<String> documentedPaths(String api) {
        Matcher matcher = PATH_PATTERN.matcher(api);
        Set<String> paths = new TreeSet<>();
        while (matcher.find()) {
            paths.add(matcher.group("path"));
        }
        return paths;
    }

    static String endpointBlock(String api, String endpoint) {
        String marker = "  " + endpoint + ":";
        int start = api.indexOf(marker);
        assertThat(start).as("endpoint marker should exist: %s", endpoint).isGreaterThanOrEqualTo(0);

        int next = api.indexOf("\n  /", start + marker.length());
        if (next < 0) {
            return api.substring(start);
        }
        return api.substring(start, next);
    }

    static Set<String> liveApiPaths() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        scanner.addIncludeFilter(new AnnotationTypeFilter(Controller.class));

        Set<String> paths = new TreeSet<>();
        for (var candidate : scanner.findCandidateComponents("mn.tasky")) {
            Class<?> controllerClass = ClassUtils.resolveClassName(candidate.getBeanClassName(), null);
            Set<String> classPaths = requestMappingPaths(controllerClass);
            for (Method method : controllerClass.getDeclaredMethods()) {
                if (!AnnotatedElementUtils.hasAnnotation(method, RequestMapping.class)) {
                    continue;
                }
                Set<String> methodPaths = requestMappingPaths(method);
                for (String classPath : classPaths) {
                    for (String methodPath : methodPaths) {
                        String combined = normalizePath(classPath + methodPath);
                        if (combined.startsWith("/api/v1/")) {
                            paths.add(normalizePath(combined.substring("/api/v1".length())));
                        }
                    }
                }
            }
        }
        return paths;
    }

    private static Set<String> requestMappingPaths(Class<?> type) {
        return requestMappingPaths((java.lang.reflect.AnnotatedElement) type);
    }

    private static Set<String> requestMappingPaths(Method method) {
        return requestMappingPaths((java.lang.reflect.AnnotatedElement) method);
    }

    private static Set<String> requestMappingPaths(java.lang.reflect.AnnotatedElement element) {
        RequestMapping requestMapping = AnnotatedElementUtils.findMergedAnnotation(element, RequestMapping.class);
        if (requestMapping == null) {
            return Set.of("");
        }

        Set<String> paths = new LinkedHashSet<>();
        for (String path : requestMapping.path()) {
            paths.add(normalizePath(path));
        }
        for (String value : requestMapping.value()) {
            paths.add(normalizePath(value));
        }
        if (paths.isEmpty()) {
            paths.add("");
        }
        return paths;
    }

    private static String normalizePath(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        String normalized = path.replaceAll("//+", "/");
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
