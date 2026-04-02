FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
COPY services services
COPY config config
COPY docs/API.yaml docs/API.yaml

RUN chmod +x gradlew && ./gradlew --no-daemon :services:api:bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/services/api/build/libs/*.jar app.jar

RUN groupadd --system tasky && useradd --system --gid tasky --create-home tasky
USER tasky

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
