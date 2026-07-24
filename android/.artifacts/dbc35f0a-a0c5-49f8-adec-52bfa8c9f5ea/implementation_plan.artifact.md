# Fix Firebase Initialization Crash

The application is crashing on startup with `Default FirebaseApp is not initialized`. This is because the `GoogleServices` task was disabled in the root `build.gradle` for all subprojects, including the main app.

## Proposed Changes

### [Component Name]

#### [MODIFY] [build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/build.gradle) (Root)

- Update the `afterEvaluate` block to only disable the `GoogleServices` task for subprojects that are NOT the main `:app` project. This allows the main app to properly process `google-services.json` and initialize Firebase.

```diff
-            if (project.plugins.hasPlugin('com.google.gms.google-services')) {
+            if (project.plugins.hasPlugin('com.google.gms.google-services') && project.name != 'app') {
```

## Verification Plan

### Automated Tests
- Run `:app:assembleDebug` to verify the build still works.
- Check the generated resources (if possible) to ensure `google-services` resources are present.

### Manual Verification
- Deploy to the device and verify that the crash no longer occurs.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:help` to ensure the build script still evaluates correctly.
- Run a Gradle sync to verify no more warnings/errors are reported by the IDE (simulated).

### Manual Verification
- Verify that the app still builds.
