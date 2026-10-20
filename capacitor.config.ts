import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aromapalace.app',
  appName: 'Aroma Palace',
  webDir: 'public',
  server: {
    // Ganti dengan URL domain live website kamu:
    // CONTOH LIVE: 'https://aromapalace.id'
    // CONTOH LOKAL (Android Emulator): 'http://10.0.2.2:8000'
    // CONTOH LOKAL (HP fisik 1 Wi-Fi): 'http://192.168.1.xxx:8000'
    url: 'https://demo-aromapalace.gagasan.tech',
    cleartext: true, // Mengizinkan http:// jika masih pengujian lokal
    allowNavigation: [
      'aromapalace.id',
      '*.aromapalace.id',
      'wa.me',
      'api.whatsapp.com',
      '*.google.com'
    ]
  },
  plugins: {
    SplashScreen: {
      // Durasi tampil splash screen (ms) sebelum di-hide
      launchShowDuration: 2500,
      // Tetap tampil sampai secara manual di-hide via JS
      launchAutoHide: false,
      // Warna background saat splash (harus sama dengan warna splash image)
      backgroundColor: '#4A070B',
      // Android: gunakan splash.png di drawable
      androidSplashResourceName: 'splash',
      // Splash mengisi penuh layar (full screen)
      splashFullScreen: true,
      // Sembunyikan status bar saat splash
      splashImmersive: true,
      // Animasi fade-out saat splash selesai
      showSpinner: false,
      // Durasi fade-out (ms)
      fadeOutDuration: 400,
    },
    StatusBar: {
      // Style teks status bar: DARK (teks hitam) atau LIGHT (teks putih)
      style: 'LIGHT',
      // Warna background status bar (Android M+)
      backgroundColor: '#4A070B',
      // Status bar overlay di atas konten (false = ada ruang untuk status bar)
      overlaysWebView: false,
    },
  },
};

export default config;
