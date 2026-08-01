# Walkthrough - AdMob Production Configuration

The application has been updated with the real AdMob IDs provided, transitioning from test mode to production mode in preparation for the Play Store launch.

## Changes

### Android Manifest
- **File**: `android/app/src/main/AndroidManifest.xml`
- Updated the `com.google.android.gms.ads.APPLICATION_ID` with the production App ID: `ca-app-pub-2069353543110701~5558799613`.

### Capacitor Configuration
- **File**: `capacitor.config.ts`
- Added the AdMob plugin configuration to ensure the App ID is correctly recognized by the Capacitor bridge.

### AdMob Service (Web/Capacitor)
- **File**: `src/lib/ads.ts`
- Replaced the test Banner ID with the production ID: `ca-app-pub-2069353543110701/8184697025`.
- Disabled `initializeForTesting`.
- Set `isTesting: false` for banner and interstitial ads.

## Verification Results

### Automated Sync
- Executed `npm run build:android`: **Success**. The production IDs are now bundled into the Android assets.

> [!CAUTION]
> **Production Ads Warning**: Real ads may take a few hours to start appearing. Avoid clicking on ads in your own device/emulator to prevent account suspension. It is recommended to add your device as a "Test Device" in the AdMob console if you need to test production IDs safely.
