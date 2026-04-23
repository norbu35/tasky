import net.ltgt.gradle.errorprone.errorprone
import org.gradle.testing.jacoco.tasks.JacocoCoverageVerification
import org.gradle.testing.jacoco.tasks.JacocoReport
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    java
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.openapi.generator)
    jacoco
    checkstyle
    pmd
    alias(libs.plugins.spotbugs)
    alias(libs.plugins.errorprone)
    alias(libs.plugins.owasp)
    alias(libs.plugins.spotless)
    alias(libs.plugins.pitest)
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

dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("io.micrometer:micrometer-registry-prometheus")

    // JDBI
    implementation(libs.jdbi.core)
    implementation(libs.jdbi.sqlobject)
    implementation(libs.jdbi.postgres)
    implementation(libs.jdbi.jackson2)
    implementation(libs.jdbi.spring5)

    // ShedLock — distributed scheduler locks
    implementation(libs.shedlock.spring)
    implementation(libs.shedlock.jdbc)

    // Rate limiting — Bucket4j for WebSocket STOMP message throttling
    implementation(libs.bucket4j)

    // Caching — Caffeine for token blacklist and user status cache
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation(libs.caffeine)

    // Database
    runtimeOnly("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // AWS S3 / MinIO
    implementation(libs.aws.s3)

    // Logging
    implementation(libs.logstash.logback)

    // Jackson
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
    implementation(libs.jsoup)

    // Firebase
    implementation(libs.firebase.admin)

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation(libs.testcontainers.core)
    testImplementation(libs.testcontainers.junit)
    testImplementation(libs.testcontainers.jdbc)
    testImplementation(libs.testcontainers.db.commons)
    testImplementation(libs.testcontainers.postgres)
    testImplementation(libs.archunit)
    testImplementation(libs.swagger.validator)

    // Static analysis
    errorprone(libs.errorprone.core)
    spotbugsPlugins(libs.findsecbugs)
    compileOnly(libs.spotbugs.annotations)
    testCompileOnly(libs.spotbugs.annotations)
}

// OpenAPI Generator
val bundleOpenApiSpec by tasks.registering(Exec::class) {
    workingDir = rootProject.projectDir
    val nodeAvailable = try { ProcessBuilder("node", "--version").start().waitFor() == 0 } catch (_: Exception) { false }
    onlyIf { nodeAvailable }
    commandLine("node", "tooling/scripts/contracts/bundle-openapi.mjs")
    inputs.dir("${rootProject.projectDir}/docs/openapi")
    inputs.file("${rootProject.projectDir}/tooling/scripts/contracts/bundle-openapi.mjs")
    outputs.file("${rootProject.projectDir}/docs/API.yaml")
}

openApiGenerate {
    generatorName.set("spring")
    inputSpec.set("${rootProject.projectDir}/docs/openapi/openapi.yaml")
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

tasks.named("openApiGenerate") {
    dependsOn(bundleOpenApiSpec)
    inputs.dir("${rootProject.projectDir}/docs/openapi")
}

tasks.named<org.openapitools.generator.gradle.plugin.tasks.ValidateTask>("openApiValidate") {
    dependsOn(bundleOpenApiSpec)
    inputSpec.set("${rootProject.projectDir}/docs/openapi/openapi.yaml")
    inputs.dir("${rootProject.projectDir}/docs/openapi")
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

tasks.named("test") {
    dependsOn(bundleOpenApiSpec)
}

tasks.named<BootRun>("bootRun") {
    // Load monorepo root .env for local development.
    // Real environment variables take precedence — .env only fills in gaps.
    val envFile = rootProject.file(".env")
    if (envFile.exists()) {
        envFile.readLines()
            .filter { it.isNotBlank() && !it.startsWith("#") && it.contains("=") }
            .forEach { line ->
                val idx = line.indexOf('=')
                val key = line.substring(0, idx).trim()
                val value = line.substring(idx + 1).trim()
                if (System.getenv(key) == null) {
                    environment(key, value)
                }
            }
    }

    // Default to 'local' profile when nothing else sets it.
    // bootRun is a local-only task — 'local' matches application-local.yml
    // which has dev-auth enabled and sensible local-dev defaults.
    val profileFromEnv = System.getenv("SPRING_PROFILES_ACTIVE")
    val profileFromProp = System.getProperty("spring.profiles.active")
    if (profileFromEnv.isNullOrBlank() && profileFromProp.isNullOrBlank()) {
        environment("SPRING_PROFILES_ACTIVE", "local")
    }
}

// JaCoCo
jacoco {
    toolVersion = libs.versions.jacoco.get()
}

val jacocoCoverageExcludes = listOf(
    "mn.tasky.api.generated*",
    "mn.tasky.*.dto*",
    "mn.tasky.*.publicapi*",
    "mn.tasky.payment*",
    "mn.tasky.wallet*",
    "mn.tasky"
)

fun normalizeCoveragePackage(raw: String): String = raw.trim().removeSuffix(".*").removeSuffix(".")

val coverageSlicePackages = (findProperty("coveragePackages") as String?)
    ?.split(",")
    ?.map(::normalizeCoveragePackage)
    ?.filter(String::isNotEmpty)
    ?.distinct()
    ?: emptyList()

val coverageSliceFileIncludes = coverageSlicePackages.map { "${it.replace('.', '/')}/**" }
val coverageSliceClassIncludes = coverageSlicePackages.map { "$it*" }

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
            // Repo-wide backend coverage floor. This is a blocking verification rule and
            // remains wired into verify:backend and CI alongside scenario-backed gates.
            element = "PACKAGE"
            includes = listOf("mn.tasky.*")
            excludes = jacocoCoverageExcludes
            limit {
                counter = "LINE"
                value = "COVEREDRATIO"
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}

tasks.register<JacocoReport>("jacocoSliceReport") {
    group = "verification"
    description = "Generates an HTML/XML JaCoCo report for the packages selected via -PcoveragePackages=mn.tasky.auth,mn.tasky.task"
    if (coverageSlicePackages.isNotEmpty()) {
        dependsOn(tasks.test)
    }

    doFirst {
        require(coverageSlicePackages.isNotEmpty()) {
            "jacocoSliceReport requires -PcoveragePackages=mn.tasky.auth,mn.tasky.task"
        }
    }

    reports {
        xml.required = true
        html.required = true
    }

    classDirectories.setFrom(files(sourceSets["main"].output.classesDirs).asFileTree.matching {
        include(coverageSliceFileIncludes)
        exclude(
            "mn/tasky/api/generated/**",
            "**/dto/**",
            "mn/tasky/payment/**",
            "mn/tasky/wallet/**"
        )
    })
    sourceDirectories.setFrom(files(sourceSets["main"].allSource.srcDirs))
    additionalSourceDirs.setFrom(files(sourceSets["main"].allSource.srcDirs))
    executionData.setFrom(file("${layout.buildDirectory.get()}/jacoco/test.exec"))
}

tasks.register<JacocoCoverageVerification>("jacocoSliceCoverageVerification") {
    group = "verification"
    description = "Checks the selected coverage slice against the blocking 80% line floor. Requires -PcoveragePackages."
    if (coverageSlicePackages.isNotEmpty()) {
        dependsOn(tasks.test)
    }

    doFirst {
        require(coverageSlicePackages.isNotEmpty()) {
            "jacocoSliceCoverageVerification requires -PcoveragePackages=mn.tasky.auth,mn.tasky.task"
        }
    }

    classDirectories.setFrom(files(sourceSets["main"].output.classesDirs).asFileTree.matching {
        include(coverageSliceFileIncludes)
        exclude(
            "mn/tasky/api/generated/**",
            "**/dto/**",
            "mn/tasky/payment/**",
            "mn/tasky/wallet/**"
        )
    })
    sourceDirectories.setFrom(files(sourceSets["main"].allSource.srcDirs))
    additionalSourceDirs.setFrom(files(sourceSets["main"].allSource.srcDirs))
    executionData.setFrom(file("${layout.buildDirectory.get()}/jacoco/test.exec"))

    violationRules {
        rule {
            element = "PACKAGE"
            includes = coverageSliceClassIncludes
            excludes = jacocoCoverageExcludes
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
    toolVersion = libs.versions.checkstyle.get()
    configFile = file("${rootProject.projectDir}/tooling/config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
}

tasks.withType<Checkstyle>().configureEach {
    configDirectory.set(file("${rootProject.projectDir}/tooling/config/checkstyle"))
}

// Spotless — enforces Palantir Java Style via palantir-java-format
// Run `./gradlew spotlessApply` to auto-format; `./gradlew spotlessCheck` (or `check`) to verify.
// Mirrors the IntelliJ code style in .idea/codeStyles/Project.xml (4-space indent, 120-char limit).
spotless {
    java {
        target("src/main/java/**/*.java", "src/test/java/**/*.java")
        palantirJavaFormat(libs.versions.palantir.java.format.get()).style("PALANTIR") // 4-space indent, 120-char line limit
        removeUnusedImports()
        // Import ordering is handled by palantir-java-format (static → blank → non-static).
        trimTrailingWhitespace()
        endWithNewline()
    }
}

// PMD
pmd {
    toolVersion = libs.versions.pmd.get()
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
    description = "Runs architecture and boundary enforcement tests (ArchUnit)."
    group = "verification"
    useJUnitPlatform()
    testClassesDirs = sourceSets["test"].output.classesDirs
    classpath = sourceSets["test"].runtimeClasspath
    filter {
        includeTestsMatching("*ArchitectureTest")
        includeTestsMatching("*BoundaryTest")
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

val syncTestRegistry by tasks.registering(Exec::class) {
    description = "Syncs tests/registry.yaml before gate evaluation."
    group = "verification"
    workingDir(rootProject.projectDir)
    commandLine("${rootProject.projectDir}/services/api/scripts/sync-registry.sh")
    mustRunAfter(tasks.test)
    mustRunAfter("pitest")
    mustRunAfter(tasks.jacocoTestReport)
    mustRunAfter("jacocoTestCoverageVerification")
    mustRunAfter("openApiValidate")
    mustRunAfter("dependencyCheckAnalyze")
}

tasks.register<Exec>("gateSmoke") {
    description = "Gate 1: all Critical scenarios covered plus optional diff-scoped mutation floor."
    group = "verification"
    dependsOn(tasks.test, "pitest", syncTestRegistry)
    workingDir(rootProject.projectDir)
    val mutationDiffBase = (findProperty("mutationDiffBase") as String?) ?: System.getenv("MUTATION_DIFF_BASE")
    if (!mutationDiffBase.isNullOrBlank()) {
        environment("MUTATION_DIFF_BASE", mutationDiffBase)
    }
    commandLine("${rootProject.projectDir}/tooling/scripts/gates/check-gates.sh", "smoke")
}

tasks.register<Exec>("gateRegression") {
    description = "Gate 2: all Critical + High scenarios covered and API contract valid. Blocks deploy."
    group = "verification"
    dependsOn(
        tasks.test,
        tasks.jacocoTestReport,
        "jacocoTestCoverageVerification",
        "openApiValidate",
        syncTestRegistry,
    )
    workingDir(rootProject.projectDir)
    commandLine("${rootProject.projectDir}/tooling/scripts/gates/check-gates.sh", "regression")
}

tasks.register<Exec>("gateFull") {
    description = "Gate 3: all scenarios + PIT floors. Runs nightly."
    group = "verification"
    dependsOn(tasks.test, tasks.jacocoTestReport, "pitest", "dependencyCheckAnalyze", syncTestRegistry)
    workingDir(rootProject.projectDir)
    commandLine("${rootProject.projectDir}/tooling/scripts/gates/check-gates.sh", "full")
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
