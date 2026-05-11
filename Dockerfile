# digest: obtain with docker buildx imagetools inspect eclipse-temurin:21-jdk
FROM eclipse-temurin:25-jdk@sha256:e23592541431eaeef5c13c84c21db71f97cdca0e70181ea6222ec9bccac24f6c AS build
WORKDIR /workspace

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
COPY services services
COPY packages packages
COPY tooling tooling
COPY docs/API.yaml docs/API.yaml
COPY docs/openapi docs/openapi

RUN chmod +x gradlew && ./gradlew --no-daemon :services:api:bootJar

# digest: obtain with docker buildx imagetools inspect eclipse-temurin:21-jre
FROM eclipse-temurin:25-jre@sha256:9c9e7c4f5f3840e5254be62ea9a7de56b2d0af23864032a8a3654bf63c31cd5b
WORKDIR /app

COPY --from=build /workspace/services/api/build/libs/*.jar app.jar

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN groupadd --system tasky && useradd --system --gid tasky --create-home tasky
USER tasky

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health/liveness || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
