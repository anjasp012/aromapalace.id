# Aroma Palace

Toko parfum online Aroma Palace: website Laravel 13 + Inertia (React), plus aplikasi iOS & Android (Capacitor) yang membuka website live di dalam WebView.

- Website dan aplikasi memakai **satu kode** di repo ini (branch `main`).
- Perubahan di website langsung tampil di aplikasi tanpa update ke App Store / Play Store.
- Update aplikasi hanya perlu jika ada perubahan di folder `ios/`, `android/`, `mobile/`, atau `capacitor.config.ts`.

## Kebutuhan

| Untuk | Kebutuhan |
| --- | --- |
| Website | PHP 8.3+, Composer 2, Node.js 22+, npm, MySQL/MariaDB (atau SQLite untuk lokal) |
| Cache (opsional, disarankan di production) | Redis 6+ |
| Aplikasi iOS | macOS + Xcode 16+, akun Apple Developer Program berbayar (untuk upload) |
| Aplikasi Android | Android Studio (JDK 21 bawaan) + Android SDK |

## 1. Menjalankan website di lokal

```bash
git clone https://github.com/anjasp012/aromapalace.id.git
cd aromapalace.id

composer install
npm install

cp .env.example .env
php artisan key:generate
```

Atur database di `.env`. Cara paling cepat untuk lokal adalah SQLite:

```env
DB_CONNECTION=sqlite
```

```bash
touch database/database.sqlite
php artisan migrate --seed
php artisan storage:link
```

Jalankan server dan Vite:

```bash
composer run dev
```

Buka http://localhost:8000.

Build aset untuk production:

```bash
npm run build
```

### Menjalankan test

```bash
php artisan test
```

## 2. Redis (cache & session)

Website tetap jalan tanpa Redis (default `database`). Untuk production, aktifkan Redis agar halaman lebih cepat.

1. Pasang Redis di server, contoh Ubuntu/Debian:

   ```bash
   sudo apt install redis-server
   sudo systemctl enable --now redis-server
   ```

2. Ubah `.env`:

   ```env
   CACHE_STORE=redis
   SESSION_DRIVER=redis
   QUEUE_CONNECTION=redis

   REDIS_CLIENT=predis
   REDIS_HOST=127.0.0.1
   REDIS_PASSWORD=null
   REDIS_PORT=6379
   REDIS_PREFIX=aromapalace_
   ```

   `REDIS_CLIENT=predis` tidak butuh ekstensi PHP tambahan. Kalau ekstensi `phpredis` terpasang, pakai `REDIS_CLIENT=phpredis` (sedikit lebih cepat).

3. Terapkan:

   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

Jika `QUEUE_CONNECTION=redis`, worker queue harus dijalankan ulang (`php artisan queue:restart`).

Cara kerja cache katalog (`app/Support/CatalogCache.php`):

- Beranda, daftar produk (per kombinasi filter), dan detail produk disimpan di cache selama 10 menit.
- Setiap perubahan pada produk, varian, galeri, ulasan, kategori, brand, artikel, toko, atau voucher otomatis membuang cache lama. Admin tidak perlu clear cache manual.
- Cara ini bekerja di semua driver cache (redis, database, file).

### Checklist deploy production

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Aktifkan juga OPcache di PHP. `public/.htaccess` sudah memasang header cache untuk aset `build/` dan gambar, serta kompresi gzip (Apache).

## 3. Aplikasi mobile (Capacitor)

### Struktur

| Path | Isi |
| --- | --- |
| `capacitor.config.ts` | ID aplikasi, URL website, splash screen, status bar |
| `mobile/www/` | Halaman lokal di dalam aplikasi: `offline.html` tampil saat tidak ada internet |
| `resources/js/lib/native-app.ts` | Lifecycle aplikasi (hanya jalan di aplikasi, tidak berpengaruh ke website) |
| `ios/` | Project Xcode |
| `android/` | Project Android Studio |

Lifecycle di `native-app.ts`:

- Splash screen tetap tampil sampai halaman pertama siap, jadi tidak ada layar putih.
- Kembali dari background kurang dari 5 menit: tidak ada reload.
- Kembali dari background 5 menit atau lebih: hanya data halaman yang di-refresh, posisi scroll tetap.
- Kembali dari background 6 jam atau lebih: reload penuh.
- Saat koneksi putus muncul banner offline. Saat koneksi kembali, data di-refresh otomatis.

### URL website yang dibuka aplikasi

Default: `https://demo-aromapalace.gagasan.tech`. Untuk mengganti, isi `CAP_SERVER_URL` saat sync:

```bash
CAP_SERVER_URL=https://aromapalace.id npx cap sync
```

Jalankan `npx cap sync` setiap kali mengubah `capacitor.config.ts`, `mobile/www/`, atau plugin Capacitor.

### iOS

```bash
npm install
npx cap sync ios
npx cap open ios
```

Di Xcode:

1. Pilih target **App** → tab **Signing & Capabilities**.
2. Pilih **Team** dari akun Apple Developer Program berbayar. Tim "Personal Team" (akun gratis) hanya bisa run ke device sendiri dan tidak bisa upload.
3. Pastikan **Bundle Identifier** = `id.aromapalace.app` (sama dengan App ID di App Store Connect). Android tetap memakai package `com.aromapalace.app`.
4. Run ke simulator atau iPhone untuk tes.

Upload ke App Store:

1. Naikkan **Version** dan **Build** di tab **General** setiap upload baru.
2. Pilih tujuan **Any iOS Device (arm64)** → menu **Product → Archive**.
3. Di jendela Organizer: **Distribute App → App Store Connect → Upload**.
4. Lengkapi data di App Store Connect (deskripsi, keyword, privacy policy URL, support URL, screenshot, akun demo untuk reviewer), lalu **Submit for Review**.

Catatan review Apple:

- Fitur **Hapus Akun** sudah tersedia di halaman Akun (wajib menurut guideline 5.1.1(v)).
- Siapkan akun demo (email + password) untuk reviewer.

### Android

```bash
npm install
npx cap sync android
npx cap open android
```

APK debug (untuk tes cepat):

```bash
cd android
./gradlew assembleDebug
# hasil: android/app/build/outputs/apk/debug/app-debug.apk
```

APK / AAB release perlu keystore:

1. Simpan keystore di `android/aromapalace-release.jks`.
2. Buat `android/keystore.properties`:

   ```properties
   storeFile=../aromapalace-release.jks
   storePassword=PASSWORD_KEYSTORE
   keyAlias=aromapalace
   keyPassword=PASSWORD_KEY
   ```

3. Build:

   ```bash
   cd android
   ./gradlew assembleRelease   # APK: android/app/build/outputs/apk/release/app-release.apk
   ./gradlew bundleRelease     # AAB untuk Play Store: android/app/build/outputs/bundle/release/app-release.aab
   ```

Kedua file keystore tidak ikut ke git (`android/.gitignore`). Simpan cadangannya di tempat aman. Jika keystore hilang, update aplikasi di Play Store tidak bisa lagi ditandatangani dengan kunci yang sama.

Jika muncul `permission denied: ./gradlew`, jalankan `chmod +x android/gradlew`.
