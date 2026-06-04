# digest: obtain with docker buildx imagetools inspect eclipse-temurin:21-jdk
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
COPY services services
COPY packages packages
COPY tooling tooling
COPY docs/API.yaml docs/API.yaml
COPY docs/openapi docs/openapi

RUN rm -f gradle/gradle-daemon-jvm.properties && chmod +x gradlew && ./gradlew --no-daemon :services:api:bootJar

# digest: obtain with docker buildx imagetools inspect eclipse-temurin:21-jre
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/services/api/build/libs/*.jar app.jar

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN groupadd --system tasky && useradd --system --gid tasky --create-home tasky
USER tasky

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health/liveness || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
