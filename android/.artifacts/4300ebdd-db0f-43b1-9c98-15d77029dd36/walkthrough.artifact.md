# Walkthrough - Build Error Fixed

I have successfully resolved the build error `Cause: firebaseAppDistribution must only be used with Android application projects`.

## Changes Made

The root cause was that the `com.google.firebase.appdistribution` and `com.google.gms.google-services` plugins were being applied to Capacitor library modules in `node_modules`. These plugins are only valid for application modules (`:app`).

I removed the following lines from the `build.gradle` files of all affected library modules:
- `apply plugin: 'com.google.firebase.appdistribution'`
- `apply plugin: 'com.google.gms.google-services'`

### Affected Files in `node_modules`
- [@capacitor/android](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/android/capacitor/build.gradle)
- [@capacitor/app](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/app/android/build.gradle)
- [@capacitor/haptics](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/haptics/android/build.gradle)
- [@capacitor/push-notifications](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/push-notifications/android/build.gradle)
- [@capacitor/splash-screen](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/splash-screen/android/build.gradle)
- [@capacitor/status-bar](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/status-bar/android/build.gradle)
- [@capacitor-community/admob](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor-community/admob/android/build.gradle)
- [capacitor-native-biometric](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/capacitor-native-biometric/android/build.gradle)
- [capacitor-native-settings](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/capacitor-native-settings/android/build.gradle)

## Verification Results

### Automated Tests
- **Gradle Sync**: [Success] The project structure was successfully synchronized.
- **Build**: [Success] Ran `./gradlew :app:assembleDebug` and the build finished successfully.

> [!WARNING]
> Since these changes were made inside `node_modules`, they will be overwritten if you run `npm install` or `npx cap update`.
>
> You should investigate if you have a local script (like a `postinstall` hook) that is adding these lines. Capacitor plugins should NOT have these plugins applied in their own `build.gradle` files.
