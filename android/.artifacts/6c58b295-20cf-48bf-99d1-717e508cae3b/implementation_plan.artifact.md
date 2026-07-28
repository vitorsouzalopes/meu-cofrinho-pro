# Fix Deprecated `buildConfig` Flag

The build warning `The option setting 'android.defaults.buildfeatures.buildconfig=true' is deprecated` indicates that the global way of enabling `BuildConfig` generation in `gradle.properties` is no longer recommended.

Starting with Android Gradle Plugin (AGP) 8.0, `BuildConfig` generation is disabled by default to improve build speed. The flag in `gradle.properties` was a temporary measure to maintain backward compatibility, but it will be removed in AGP 9.0.

## Proposed Changes

### [Component Name]

#### [MODIFY] [gradle.properties](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/gradle.properties)
- Remove `android.defaults.buildfeatures.buildconfig=true`.

#### [MODIFY] [app/build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build.gradle)
- Explicitly enable `buildConfig` for the app module. This ensures that if the app (or any future code) needs `BuildConfig`, it remains available without using the deprecated global flag.

## Verification Plan

### Automated Tests
- Run `./gradlew assembleDebug` to ensure the project still builds correctly.
- Verify that `BuildConfig` is still generated for the `:app` module (if needed).

### Manual Verification
- Check that the deprecation warning is gone during sync/build.
