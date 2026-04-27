# Community 26

> 48 nodes

## Key Concepts

- **.doFilterInternal()** (22 connections) — `services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java`
- **Write** (10 connections) — `services/api/src/test/java/mn/tasky/common/security/JsonSecurityResponseWriterTest.java`
- **RequestObservabilityFilterTest.java** (6 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **JwtAuthenticationFilter** (5 connections) — `services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java`
- **PlatformResolution** (5 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **TraceAndCorrelationIdResolution** (4 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **RestAccessDeniedHandler** (3 connections) — `services/api/src/main/java/mn/tasky/common/security/RestAccessDeniedHandler.java`
- **RestAuthenticationEntryPoint** (3 connections) — `services/api/src/main/java/mn/tasky/common/security/RestAuthenticationEntryPoint.java`
- **.commence()** (3 connections) — `services/api/src/main/java/mn/tasky/common/security/RestAuthenticationEntryPoint.java`
- **MdcPopulation** (3 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **LocaleResolution** (3 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **FilterChainProceeds** (3 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **RestAccessDeniedHandlerTest** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/RestAccessDeniedHandlerTest.java`
- **.writesForbiddenResponse()** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/RestAccessDeniedHandlerTest.java`
- **RestAuthenticationEntryPointTest** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/RestAuthenticationEntryPointTest.java`
- **.writesUnauthorizedResponse()** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/RestAuthenticationEntryPointTest.java`
- **.handle()** (2 connections) — `services/api/src/main/java/mn/tasky/common/security/RestAccessDeniedHandler.java`
- **.isAuthOrPublicPath()** (2 connections) — `services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java`
- **.usesHeaderValuesWhenValid()** (2 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.generatesUuidsWhenHeadersMissing()** (2 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.generatesUuidsWhenHeadersContainInvalidChars()** (2 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.setsMdcKeysDuringFilterExecution()** (2 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.clearsMdcAfterFilterChainCompletes()** (2 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.defaultsToMnWhenNoAcceptLanguage()** (2 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.extractsFirstLanguageFromAcceptLanguage()** (2 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- _... and 23 more nodes in this community_

## Relationships

- [[Community 0]] (3 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 3]] (2 shared connections)
- [[Community 8]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java`
- `services/api/src/main/java/mn/tasky/common/security/RestAccessDeniedHandler.java`
- `services/api/src/main/java/mn/tasky/common/security/RestAuthenticationEntryPoint.java`
- `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- `services/api/src/test/java/mn/tasky/common/security/JsonSecurityResponseWriterTest.java`
- `services/api/src/test/java/mn/tasky/common/security/RestAccessDeniedHandlerTest.java`
- `services/api/src/test/java/mn/tasky/common/security/RestAuthenticationEntryPointTest.java`

## Audit Trail

- EXTRACTED: 85 (65%)
- INFERRED: 46 (35%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
