# Fix Warnings and Errors in `app/build.gradle` and `variables.gradle`

The goal is to modernize the build configuration, address deprecation warnings, update dependencies, and fix build errors caused by version mismatches.

## User Review Required

> [!IMPORTANT]
> To support the latest AndroidX libraries (like `credentials 1.6.0` and `core-splashscreen 1.2.0`), we must upgrade the Android Gradle Plugin (AGP) from `7.4.2` to `8.7.3`. This is because these libraries require SDK 35 and AGP 8.6+.

## Proposed Changes

### [Component Name]

#### [MODIFY] [variables.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/variables.gradle)

- Update dependency versions and SDK levels:
    - `minSdkVersion`: `22` -> `23` (Required by `firebase-inappmessaging-display`)
    - `compileSdkVersion`: `34` -> `35` (Required by new AndroidX libraries)
    - `targetSdkVersion`: `34` -> `35`
    - `androidxCoordinatorLayoutVersion`: `1.3.0`
    - `coreSplashScreenVersion`: `1.2.0`
    - `androidxJunitVersion`: `1.3.0`
    - `androidxEspressoCoreVersion`: `3.7.0`

#### [MODIFY] [build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/build.gradle) (Root)

- Upgrade AGP: `7.4.2` -> `8.7.3`.

#### [MODIFY] [build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build.gradle)

- Add resolution strategy to fix duplicate vision classes.
- Update deprecated properties (`compileSdk`, `minSdk`, `targetSdk`).
- Update `aaptOptions` to `androidResources`.
- Update Proguard configuration to `proguard-android-optimize.txt`.
- Remove redundant plugin application.
- Fix unused catch parameter.
- Add `namespace` if not present (it is already present).

## Verification Plan

### Automated Tests
- Run `./gradlew :app:help` to ensure the build script still evaluates correctly.
- Run a Gradle sync to verify no more warnings/errors are reported by the IDE (simulated).

### Manual Verification
- Verify that the app still builds.
