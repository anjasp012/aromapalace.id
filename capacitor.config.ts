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
  }
};

export default config;
