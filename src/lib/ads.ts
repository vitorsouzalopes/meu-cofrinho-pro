import { AdMob, BannerAdPosition, BannerAdSize, AdMobBannerSize } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Production IDs
const BANNER_ID = 'ca-app-pub-2069353543110701/8184697025';
const INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';

export async function initializeAds() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Request Tracking Authorization and UMP Consent
    // This is required for GDPR compliance and personalized ads
    const consentInfo = await AdMob.requestConsentInfo();

    if (consentInfo.isConsentFormAvailable && consentInfo.status === 'required') {
      await AdMob.showConsentForm();
    }

    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: false,
    });

    console.log('[AdMob] Initialized with consent info');
  } catch (e) {
    console.error('[AdMob] Init error:', e);
  }
}

export async function showBannerAd() {
  if (!Capacitor.isNativePlatform()) return;

  const options = {
    adId: BANNER_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 60, // Above bottom navigation
    isTesting: false,
  };

  try {
    await AdMob.showBanner(options);
  } catch (e) {
    console.error('[AdMob] Banner show error:', e);
  }
}

export async function hideBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.warn('[AdMob] Banner hide error:', e);
  }
}

export async function showInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_TEST_ID,
      isTesting: false,
    });
    await AdMob.showInterstitial();
  } catch (e) {
    console.error('[AdMob] Interstitial show error:', e);
  }
}
