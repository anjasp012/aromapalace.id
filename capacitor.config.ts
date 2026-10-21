import type { CapacitorConfig } from '@capacitor/cli';
import { writeFileSync } from 'node:fs';

/**
 * The app is a native shell (iOS & Android) around the live Laravel website.
 * Change the site URL with: CAP_SERVER_URL=https://aromapalace.id npx cap sync
 */
const serverUrl = process.env.CAP_SERVER_URL || 'https://demo-aromapalace.gagasan.tech';

// The offline page reads this to know where "Coba Lagi" should go.
writeFileSync('mobile/www/server-url.js', `window.APP_SERVER_URL = ${JSON.stringify(serverUrl)};\n`);

const config: CapacitorConfig = {
  // Android package id. The iOS bundle id is aromapalace.app (com.aromapalace.app was taken
  // on the App Store) and is set in ios/App/App.xcodeproj.
  appId: 'com.aromapalace.app',
  appName: 'Aroma Palace',
  // Local fallback pages only (offline screen). The real content comes from serverUrl.
  webDir: 'mobile/www',
  // Lets the website detect the app via the User-Agent if ever needed.
  appendUserAgent: 'AromaPalaceApp',
  backgroundColor: '#4A070B',
  server: {
    url: serverUrl,
    // Shown by the WebView when the site cannot be loaded (no internet, server down).
    errorPath: 'offline.html',
    cleartext: serverUrl.startsWith('http://'),
    // Only the shop's own domains stay inside the app. WhatsApp, maps and other
    // external links open in their native apps / system browser.
    allowNavigation: [
      new URL(serverUrl).hostname,
      'aromapalace.id',
      '*.aromapalace.id',
    ],
  },
  ios: {
    // Safe areas (notch, home bar) are handled in CSS: html.native-app body in resources/css/app.css.
    contentInset: 'never',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // Hidden from JS (resources/js/lib/native-app.ts) once the first page is painted.
      launchAutoHide: false,
      launchShowDuration: 8000,
      backgroundColor: '#4A070B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      showSpinner: false,
    },
    StatusBar: {
      // DARK = white text, for the burgundy bar.
      style: 'DARK',
      backgroundColor: '#360407',
      overlaysWebView: true,
    },
  },
};

export default config;
