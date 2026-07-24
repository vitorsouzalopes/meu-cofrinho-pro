# Fix Warnings and Errors in `app/build.gradle`

The goal is to modernize the `app/build.gradle` file by addressing deprecated properties and redundant plugin applications.

## Proposed Changes

### [Component Name]

#### [MODIFY] [build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build.gradle)

- Update deprecated properties:
    - `compileSdkVersion` -> `compileSdk`
    - `minSdkVersion` -> `minSdk`
    - `targetSdkVersion` -> `targetSdk`
- Update `aaptOptions` to `androidResources` (modern DSL).
- Remove redundant `apply plugin: 'com.google.gms.google-services'` at line 64, as it is conditionally applied in a `try-catch` block later (common in Capacitor projects to handle missing `google-services.json`).
- Ensure `sourceCompatibility` and `targetCompatibility` are set to at least Java 11 (Capacitor 5+ requirement), although they are already set in `capacitor.build.gradle`, it's good to have them explicitly or consistently.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:help` to ensure the build script still evaluates correctly.
- Run a Gradle sync to verify no more warnings/errors are reported by the IDE (simulated).

### Manual Verification
- Verify that the app still builds.
