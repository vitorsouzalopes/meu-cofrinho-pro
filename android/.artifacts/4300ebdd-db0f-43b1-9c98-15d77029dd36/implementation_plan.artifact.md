# Fix Build Error: firebaseAppDistribution must only be used with Android application projects

The build error occurs because the `com.google.firebase.appdistribution` plugin is being applied to several Android Library modules (Capacitor plugins) located in the `node_modules` directory. This plugin is only compatible with Android Application projects (`com.android.application`).

## User Review Required

> [!IMPORTANT]
> The affected files are located inside the `node_modules` directory. While I can fix them now, these changes might be overwritten if you run `npm install` or `capacitor update`.
>
> You should investigate how these lines were added to your `node_modules`. It's highly unusual for Capacitor plugins to have these plugins applied in their own `build.gradle` files. If you used a script to set up Firebase, it might have incorrectly targeted all `build.gradle` files in your workspace.

## Proposed Changes

I will remove the following incorrect plugin applications from the library modules:
- `apply plugin: 'com.google.firebase.appdistribution'`
- `apply plugin: 'com.google.gms.google-services'` (Also incorrect for library modules, though not causing the immediate crash)

### Capacitor Library Modules

#### [MODIFY] [@capacitor/android build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/android/capacitor/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [@capacitor/app build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/app/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [@capacitor/haptics build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/haptics/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [@capacitor/push-notifications build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/push-notifications/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [@capacitor/splash-screen build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/splash-screen/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [@capacitor/status-bar build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor/status-bar/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [@capacitor-community/admob build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/@capacitor-community/admob/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [capacitor-native-biometric build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/capacitor-native-biometric/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

#### [MODIFY] [capacitor-native-settings build.gradle](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/node_modules/capacitor-native-settings/android/build.gradle)
- Remove `apply plugin: 'com.google.gms.google-services'`
- Remove `apply plugin: 'com.google.firebase.appdistribution'`

## Verification Plan

### Automated Tests
- Run `./gradlew :app:assembleDebug` to verify the build completes successfully.
- Trigger a Gradle Sync in Android Studio.
