import net.ltgt.gradle.errorprone.errorprone
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    java
    id("org.springframework.boot") version "3.5.13"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.openapi.generator") version "7.21.0"
    jacoco
    checkstyle
    pmd
    id("com.github.spotbugs") version "6.1.11"
    id("net.ltgt.errorprone") version "4.1.0"
    id("org.owasp.dependencycheck") version "12.1.0"
    id("com.diffplug.spotless") version "6.25.0"
    id("info.solidsoft.pitest") version "1.15.0"
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

val jdbiVersion = "3.52.1"
val testcontainersVersion = "1.21.4"
val jjwtVersion = "0.13.0"

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
    implementation("net.javacrumbs.shedlock:shedlock-spring:7.7.0")
    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:7.7.0")

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

    // Firebase
    implementation("com.google.firebase:firebase-admin:9.4.2")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:testcontainers:$testcontainersVersion")
    testImplementation("org.testcontainers:junit-jupiter:$testcontainersVersion")
    testImplementation("org.testcontainers:jdbc:$testcontainersVersion")
    testImplementation("org.testcontainers:database-commons:$testcontainersVersion")
    testImplementation("org.testcontainers:postgresql:$testcontainersVersion")
    testImplementation("com.tngtech.archunit:archunit-junit5:1.4.1")
    testImplementation("com.atlassian.oai:swagger-request-validator-mockmvc:2.46.1")

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
            // Legacy blanket package coverage floor.
            // Kept as an opt-in advisory task while release gates move to scenario-backed evidence
            // plus scoped mutation checks. Do not wire this into blocking deploy gates.
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
    configFile = file("${rootProject.projectDir}/tooling/config/checkstyle/checkstyle.xml")
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
    ruleSetFiles = files("${rootProject.projectDir}/tooling/config/pmd/pmd-ruleset.xml")
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
    excludeFilter = file("${rootProject.projectDir}/tooling/config/spotbugs/spotbugs-exclude.xml")
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
    suppressionFile = "${rootProject.projectDir}/tooling/config/owasp/suppressions.xml"
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
    // Testcontainers binds mapped ports to localhost. On macOS with a system SOCKS proxy configured,
    // the JVM routes loopback connections through the proxy, which can't resolve them.
    // Explicitly exclude loopback addresses so Testcontainers connections bypass the proxy.
    jvmArgs("-DsocksNonProxyHosts=localhost|127.*|0:0:0:0:0:0:0:1|::1")
}

tasks.register<Test>("architectureTest") {
    description = "Runs architecture boundary tests (ArchUnit)."
    group = "verification"
    useJUnitPlatform()
    testClassesDirs = sourceSets["test"].output.classesDirs
    classpath = sourceSets["test"].runtimeClasspath
    filter {
        includeTestsMatching("*ArchitectureTest")
    }
}

tasks.named("check") {
    dependsOn("architectureTest")
}

tasks.register("precommit") {
    description = "Quick local quality check before committing (~20-30s)"
    group = "verification"
    dependsOn("spotlessCheck", "checkstyleMain", "compileJava", "compileTestJava")
}

// Quality Gates — driven by tests/registry.yaml and tests/scenarios/*.md
// Run sync-registry.sh first to ensure registry reflects current test + PIT state.

tasks.register<Exec>("gateSmoke") {
    description = "Gate 1: all Critical scenarios covered. Blocks merge to main."
    group = "verification"
    dependsOn(tasks.test)
    workingDir(rootProject.projectDir)
    doFirst {
        exec {
            workingDir(rootProject.projectDir)
            commandLine("${rootProject.projectDir}/services/api/scripts/sync-registry.sh")
        }
    }
    commandLine("${rootProject.projectDir}/tooling/scripts/check-gates.sh", "smoke")
}

tasks.register<Exec>("gateRegression") {
    description = "Gate 2: all Critical + High scenarios covered and API contract valid. Blocks deploy."
    group = "verification"
    dependsOn(
        tasks.test,
        tasks.jacocoTestReport,
        "openApiValidate",
    )
    workingDir(rootProject.projectDir)
    doFirst {
        exec {
            workingDir(rootProject.projectDir)
            commandLine("${rootProject.projectDir}/services/api/scripts/sync-registry.sh")
        }
    }
    commandLine("${rootProject.projectDir}/tooling/scripts/check-gates.sh", "regression")
}

tasks.register<Exec>("gateFull") {
    description = "Gate 3: all scenarios + PIT floors. Runs nightly."
    group = "verification"
    dependsOn(tasks.test, tasks.jacocoTestReport, "pitest")
    workingDir(rootProject.projectDir)
    doFirst {
        exec {
            workingDir(rootProject.projectDir)
            commandLine("${rootProject.projectDir}/services/api/scripts/sync-registry.sh")
        }
    }
    commandLine("${rootProject.projectDir}/tooling/scripts/check-gates.sh", "full")
}

// PIT Mutation Testing
// Run: ./gradlew pitest
// Report: build/reports/pitest/index.html
//
// Excluded packages mirror the JaCoCo exclusions:
//   - generated API sources     (mn.tasky.api.generated*)
//   - DTO-only packages         (mn.tasky.*.dto*)
//   - deferred monetization     (mn.tasky.payment*, mn.tasky.wallet*)
//   - root package (no classes) (mn.tasky)
//
// Thresholds are intentionally low to start — tighten after the first baseline run.
// See build/reports/pitest/index.html to find which packages need work.
pitest {
    junit5PluginVersion.set("1.2.1")
    pitestVersion.set("1.17.0")

    targetClasses.set(setOf("mn.tasky.*"))
    excludedClasses.set(setOf(
        "mn.tasky.api.generated.*",
        "mn.tasky.*.dto.*",
        "mn.tasky.payment.*",
        "mn.tasky.wallet.*",
        "mn.tasky.TaskyApplication"
    ))
    targetTests.set(setOf("mn.tasky.*"))

    // Exclude slow Testcontainers integration tests — PIT re-runs tests for every mutant,
    // so integration tests (each spinning up Postgres) would take hours.
    // Unit tests give fast, precise mutation feedback on domain logic.
    excludedTestClasses.set(setOf(
        "mn.tasky.**.*IntegrationTests",
        "mn.tasky.**.*IntegrationTest",
        "mn.tasky.TaskyApplicationTests",
        "mn.tasky.common.IntegrationTestBase",
        "mn.tasky.performance.**",
        "mn.tasky.contract.OpenApiContractTestSupport"
    ))

    // Mutators: defaults (STRONGER) give a good signal without excessive noise
    mutators.set(setOf("STRONGER"))

    // Run tests in parallel — tune based on your CI machine
    threads.set(4)

    // Fail the build if mutation coverage drops below this threshold.
    // Start at 0 (establish a baseline), then raise once you've reviewed the first report.
    // Raised from 0 after Phase 1+2 scenario coverage established.
    // Raise further as mutation scores improve — floor only moves up.
    mutationThreshold.set(20)

    // Output
    outputFormats.set(setOf("HTML", "XML"))
    reportDir.set(file("${layout.buildDirectory.get()}/reports/pitest"))

    timestampedReports.set(false)
    verbose.set(false)
}
