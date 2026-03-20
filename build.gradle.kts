import net.ltgt.gradle.errorprone.errorprone
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    java
    id("org.springframework.boot") version "3.4.2"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.openapi.generator") version "7.12.0"
    jacoco
    checkstyle
    pmd
    id("com.github.spotbugs") version "6.1.11"
    id("net.ltgt.errorprone") version "4.1.0"
    id("org.owasp.dependencycheck") version "12.1.0"
    id("com.diffplug.spotless") version "6.25.0"
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
val testcontainersVersion = "1.21.4"
val jjwtVersion = "0.12.6"

dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("io.micrometer:micrometer-registry-prometheus")

    // JDBI
    implementation("org.jdbi:jdbi3-core:$jdbiVersion")
    implementation("org.jdbi:jdbi3-sqlobject:$jdbiVersion")
    implementation("org.jdbi:jdbi3-postgres:$jdbiVersion")
    implementation("org.jdbi:jdbi3-jackson2:$jdbiVersion")
    implementation("org.jdbi:jdbi3-spring5:$jdbiVersion")

    // ShedLock — distributed scheduler locks
    implementation("net.javacrumbs.shedlock:shedlock-spring:5.16.0")
    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:5.16.0")

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
    implementation("org.jsoup:jsoup:1.18.3")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:testcontainers:$testcontainersVersion")
    testImplementation("org.testcontainers:junit-jupiter:$testcontainersVersion")
    testImplementation("org.testcontainers:jdbc:$testcontainersVersion")
    testImplementation("org.testcontainers:database-commons:$testcontainersVersion")
    testImplementation("org.testcontainers:postgresql:$testcontainersVersion")

    // Static analysis
    errorprone("com.google.errorprone:error_prone_core:2.36.0")
    spotbugsPlugins("com.h3xstream.findsecbugs:findsecbugs-plugin:1.13.0")
    compileOnly("com.github.spotbugs:spotbugs-annotations:4.8.6")
    testCompileOnly("com.github.spotbugs:spotbugs-annotations:4.8.6")
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

tasks.named<BootRun>("bootRun") {
    val activeProfileFromSystemProperty = System.getProperty("spring.profiles.active")
    val activeProfileFromEnvironment = System.getenv("SPRING_PROFILES_ACTIVE")

    if (activeProfileFromSystemProperty.isNullOrBlank() && activeProfileFromEnvironment.isNullOrBlank()) {
        environment("SPRING_PROFILES_ACTIVE", "dev")
    }
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
            // Enforce 80% line coverage on active MVP runtime packages.
            // Exclude generated sources, DTO-only packages, and deferred post-MVP monetization modules.
            element = "PACKAGE"
            includes = listOf("mn.tasky.*")
            excludes = listOf(
                "mn.tasky.api.generated*",
                "mn.tasky.*.dto*",
                "mn.tasky.payment*",
                "mn.tasky.wallet*",
                "mn.tasky"
            )
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

// Spotless — enforces Palantir Java Style via palantir-java-format
// Run `./gradlew spotlessApply` to auto-format; `./gradlew spotlessCheck` (or `check`) to verify.
// Mirrors the IntelliJ code style in .idea/codeStyles/Project.xml (4-space indent, 120-char limit).
spotless {
    java {
        target("src/main/java/**/*.java", "src/test/java/**/*.java")
        palantirJavaFormat("2.47.0").style("PALANTIR") // 4-space indent, 120-char line limit
        removeUnusedImports()
        // Import ordering is handled by palantir-java-format (static → blank → non-static).
        trimTrailingWhitespace()
        endWithNewline()
    }
}

// PMD
pmd {
    toolVersion = "7.9.0"
    isConsoleOutput = true
    ruleSets = mutableListOf()   // clear defaults; use our ruleset only
    ruleSetFiles = files("${rootProject.projectDir}/config/pmd/pmd-ruleset.xml")
    isIgnoreFailures = false
}
tasks.withType<Pmd>().configureEach {
    reports {
        html.required = true
        xml.required = false
    }
}

// SpotBugs
spotbugs {
    toolVersion = "4.8.6"
    effort = com.github.spotbugs.snom.Effort.MAX
    reportLevel = com.github.spotbugs.snom.Confidence.MEDIUM
    excludeFilter = file("${rootProject.projectDir}/config/spotbugs/spotbugs-exclude.xml")
    ignoreFailures = false
}
tasks.withType<com.github.spotbugs.snom.SpotBugsTask>().configureEach {
    reports.create("html") { required.set(true) }
}

// ErrorProne
tasks.withType<JavaCompile>().configureEach {
    options.errorprone {
        disableWarningsInGeneratedCode.set(true)
    }
}

// OWASP Dependency Check (opt-in — deliberately NOT wired into `check`)
dependencyCheck {
    failBuildOnCVSS = 7.0f
    suppressionFile = "${rootProject.projectDir}/config/owasp/suppressions.xml"
    nvd { apiKey = System.getenv("NVD_API_KEY") ?: "" }
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
