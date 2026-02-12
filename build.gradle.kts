plugins {
    java
    id("org.springframework.boot") version "3.4.2"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.openapi.generator") version "7.12.0"
    jacoco
    checkstyle
}

group = "mn.tasky"
version = "1.0.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

val jdbiVersion = "3.47.0"
val testcontainersVersion = "1.20.4"
val jjwtVersion = "0.12.6"

dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")

    // JDBI
    implementation("org.jdbi:jdbi3-core:$jdbiVersion")
    implementation("org.jdbi:jdbi3-sqlobject:$jdbiVersion")
    implementation("org.jdbi:jdbi3-postgres:$jdbiVersion")
    implementation("org.jdbi:jdbi3-jackson2:$jdbiVersion")
    implementation("org.jdbi:jdbi3-spring5:$jdbiVersion")

    // Database
    runtimeOnly("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:$jjwtVersion")

    // AWS S3 / MinIO
    implementation("software.amazon.awssdk:s3:2.29.46")

    // Logging
    implementation("net.logstash.logback:logstash-logback-encoder:8.0")

    // Jackson
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:testcontainers:$testcontainersVersion")
    testImplementation("org.testcontainers:junit-jupiter:$testcontainersVersion")
    testImplementation("org.testcontainers:postgresql:$testcontainersVersion")
}

// OpenAPI Generator
openApiGenerate {
    generatorName.set("spring")
    inputSpec.set("${rootProject.projectDir}/docs/API.yaml")
    outputDir.set("${layout.buildDirectory.get()}/generated-sources/openapi")
    apiPackage.set("mn.tasky.api.generated")
    modelPackage.set("mn.tasky.api.generated.model")
    configOptions.set(mapOf(
        "interfaceOnly" to "true",
        "useSpringBoot3" to "true",
        "useTags" to "true",
        "openApiNullable" to "false",
        "skipDefaultInterface" to "true",
        "documentationProvider" to "none",
        "generatedConstructorWithRequiredArgs" to "false",
        "additionalModelTypeAnnotations" to "@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)"
    ))
}

tasks.named<org.openapitools.generator.gradle.plugin.tasks.ValidateTask>("openApiValidate") {
    inputSpec.set("${rootProject.projectDir}/docs/API.yaml")
}

sourceSets {
    main {
        java {
            srcDir("${layout.buildDirectory.get()}/generated-sources/openapi/src/main/java")
        }
    }
}

tasks.named("compileJava") {
    dependsOn("openApiGenerate")
}

// JaCoCo
jacoco {
    toolVersion = "0.8.12"
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            element = "PACKAGE"
            includes = listOf("mn.tasky.*")
            excludes = listOf("mn.tasky.api.generated*", "mn.tasky.api.generated.model*")
            limit {
                counter = "LINE"
                value = "COVEREDRATIO"
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}

// Checkstyle
checkstyle {
    toolVersion = "10.21.2"
    configFile = file("${rootProject.projectDir}/config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
}

// Test
tasks.test {
    useJUnitPlatform()
    testLogging {
        events("passed", "failed", "skipped")
        showStandardStreams = true
    }
    finalizedBy(tasks.jacocoTestReport)
}

tasks.named("check") {
    dependsOn(tasks.jacocoTestCoverageVerification)
}
