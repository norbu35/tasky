plugins {
    base
}

allprojects {
    repositories {
        mavenCentral()
    }
}

// Root aliases keep existing contributor commands stable while backend now lives in :services:api.
tasks.register("test") {
    group = "verification"
    dependsOn(":services:api:test")
}

tasks.register("openApiValidate") {
    group = "verification"
    dependsOn(":services:api:openApiValidate")
}

tasks.register("gateSmoke") {
    group = "verification"
    dependsOn(":services:api:gateSmoke")
}

tasks.register("gateRegression") {
    group = "verification"
    dependsOn(":services:api:gateRegression")
}

tasks.register("gateFull") {
    group = "verification"
    dependsOn(":services:api:gateFull")
}

tasks.register("bootRun") {
    group = "application"
    dependsOn(":services:api:bootRun")
}
