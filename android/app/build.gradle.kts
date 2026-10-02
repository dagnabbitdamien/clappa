plugins { id("com.android.application"); id("org.jetbrains.kotlin.android"); id("org.jetbrains.kotlin.plugin.compose") }
android {
    namespace = "org.clappa.app"
    compileSdk = 36
    signingConfigs { getByName("debug") { rootProject.file("../.tools/review-signing/debug.keystore").takeIf { it.exists() }?.let { storeFile = it } } }
    defaultConfig { applicationId = "org.clappa.app"; minSdk = 28; targetSdk = 36; versionCode = 21; versionName = "0.3.0-test15.1" }
    buildTypes { create("review") { initWith(getByName("debug")); applicationIdSuffix = ".review"; matchingFallbacks += "debug" } }
    buildFeatures { compose = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("org.bouncycastle:bcpkix-jdk18on:1.79")
    testImplementation("junit:junit:4.13.2")
    implementation(platform("androidx.compose:compose-bom:2025.09.00"))
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.4")
    implementation("androidx.camera:camera-camera2:1.5.0")
    implementation("androidx.camera:camera-lifecycle:1.5.0")
    implementation("androidx.camera:camera-view:1.5.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.zxing:core:3.5.3")
}

