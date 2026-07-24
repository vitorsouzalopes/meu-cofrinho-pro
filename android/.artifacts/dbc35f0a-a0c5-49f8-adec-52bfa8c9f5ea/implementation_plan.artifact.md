# Fix Warnings and Errors in `app/build.gradle` and `variables.gradle`

The goal is to modernize the build configuration, address deprecation warnings, update dependencies, and fix lint issues.

## Proposed Changes

### [Component Name]

#### [MODIFY] [variables.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/variables.gradle)

- Update dependency versions:
    - `androidxCoordinatorLayoutVersion`: `1.2.0` -> `1.3.0`
    - `coreSplashScreenVersion`: `1.0.0` -> `1.2.0`
    - `androidxJunitVersion`: `1.1.5` -> `1.3.0`
    - `androidxEspressoCoreVersion`: `3.5.1` -> `3.7.0`

#### [MODIFY] [build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build.gradle)

- Update deprecated properties:
    - `compileSdkVersion` -> `compileSdk`
    - `minSdkVersion` -> `minSdk`
    - `targetSdkVersion` -> `targetSdk`
- Update `aaptOptions` to `androidResources` (modern DSL).
- Update Proguard configuration:
    - Change `getDefaultProguardFile('proguard-android.txt')` to `getDefaultProguardFile('proguard-android-optimize.txt')` for better performance and to avoid the deprecation warning.
- Remove redundant `apply plugin: 'com.google.gms.google-services'` at line 64.
- Fix unused catch parameter `e` by replacing it with `_` or removing the variable name if allowed in Groovy, or just leaving it but noting it's for logging if needed (though the user specifically asked to fix "Unused catch parameter"). In Groovy, `catch(Exception _)` or just `catch(Exception ignore)` is common.
- Ensure `sourceCompatibility` and `targetCompatibility` are explicitly set to `JavaVersion.VERSION_11`.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:help` to ensure the build script still evaluates correctly.
- Run a Gradle sync to verify no more warnings/errors are reported by the IDE (simulated).

### Manual Verification
- Verify that the app still builds.
