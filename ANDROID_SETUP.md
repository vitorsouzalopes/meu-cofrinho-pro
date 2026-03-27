# Android Studio Setup for Meu Cofrinho Pro

This project is already configured with Capacitor and includes the Android platform in `android/`.

## 1. Prerequisites

- Android Studio installed
- Android SDK and Android SDK Platform-Tools installed
- JDK 17 or newer (Android Studio manages this)
- A connected Android device or emulator
- Node.js and npm installed

## 2. Install dependencies

From the project root:

```bash
npm install
```

## 3. Build the web app and copy assets to Android

Run:

```bash
npm run build:android
```

This executes a production build and copies the generated web files into the Capacitor Android app.

## 4. Open the Android project in Android Studio

Run:

```bash
npx cap open android
```

Or open the `android/` folder directly from Android Studio.

## 5. Configure Android Studio (first time)

In Android Studio, allow Gradle to sync. If prompted, install:

- Android SDK Platform 33 or 34
- Android SDK Build-Tools 34.0.0
- Android SDK Platform-Tools
- Android SDK Tools
- Android Emulator (optional)

## 6. Run the app on device or emulator

In Android Studio:

- Select your device or emulator
- Click Run ▶

This builds and installs the debug app automatically.

## 7. Release signing setup

The Android project is configured to use a `keystore.properties` file for release signing.

Create a file named `android/keystore.properties` with these values:

```properties
storeFile=release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=YOUR_KEY_ALIAS
keyPassword=YOUR_KEY_PASSWORD
```

Place your keystore file in the `android/` folder or update `storeFile` with the correct relative path.

The file `android/.gitignore` already ignores `keystore.properties`.

## 7. Generate an installable APK

### Debug APK

1. In Android Studio, go to `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
2. After build completes, click `Locate` or find the file at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK

1. In Android Studio, go to `Build` > `Generate Signed Bundle / APK...`.
2. Choose `APK` and click Next.
3. Create or select a signing key (keystore).
4. Choose `release` build type.
5. Finish and wait for the build.
6. The signed APK is generated at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## 8. Install the APK on a device

Use ADB:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or use the generated release APK path.

## 9. Update app web assets after changes

Every time you change the React app, run:

```bash
npm run build:android
```

Then rebuild the Android app in Android Studio.

## 10. Deep Links

The app is configured for deep links using:

- `meucofrinho://...`
- `https://meucofrinho.com/...`

Example:

```text
meucofrinho://accounts
```

These will open the app and route to the corresponding screen.
