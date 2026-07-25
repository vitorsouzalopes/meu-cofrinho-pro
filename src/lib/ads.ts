import { AdMob, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents, AdMobBannerSize } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Test IDs provided by Google
const INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';
const BANNER_TEST_ID = 'ca-app-pub-3940256099942544/6300978111';

export async function initializeAds() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: true,
    });
  } catch (e) {
    console.error('AdMob init error:', e);
  }
}

export async function showBannerAd() {
  if (!Capacitor.isNativePlatform()) return;

  const options = {
    adId: BANNER_TEST_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 60, // Above bottom navigation
    isTesting: true,
  };

  try {
    await AdMob.showBanner(options);
  } catch (e) {
    console.error('Banner show error:', e);
  }
}

export async function hideBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.warn('Banner hide error:', e);
  }
}

export async function showInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_TEST_ID,
      isTesting: true,
    });
    await AdMob.showInterstitial();
  } catch (e) {
    console.error('Interstitial show error:', e);
  }
}
