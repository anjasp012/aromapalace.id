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
  appId: 'com.aromapalace.app',
  appName: 'Aroma Palace',
  // Local fallback pages only (offline screen). The real content comes from serverUrl.
  webDir: 'mobile/www',
  // Lets the website detect the app via the User-Agent if ever needed.
  appendUserAgent: 'AromaPalaceApp',
  backgroundColor: '#360407',
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
    // Keep page content below the status bar / notch (the site has no safe-area padding).
    contentInset: 'automatic',
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
      backgroundColor: '#650506',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#360407',
      overlaysWebView: false,
    },
  },
};

export default config;
