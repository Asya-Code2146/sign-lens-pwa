# 🤟 Isyaratku - PWA Penerjemah Bahasa Isyarat Real-Time (100% Client-Side AI)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](https://web.dev/progressive-web-apps/)
[![100% Client--Side AI](https://img.shields.io/badge/AI-100%25%20Client--Side-indigo.svg)](https://developers.google.com/mediapipe)
[![Vercel Ready](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://vercel.com/)

Aplikasi **Progressive Web App (PWA)** penerjemah bahasa isyarat lokal (*Real-time Sign-to-Text*) secara langsung melalui kamera peramban tanpa memerlukan API Key AI eksternal berbayar (**100% Client-Side AI**). Proyek ini dirancang dalam arsitektur monorepo terpadu yang siap di-deploy langsung ke **GitHub** dan **Vercel**.

---

## 📱 Fitur Utama

1. **Deteksi Gestur Tangan Real-Time (100% Client-Side AI)**:
   - Menggunakan `@mediapipe/hands` dan `@mediapipe/camera_utils` untuk memetakan **21 titik landmark 3D jari tangan** secara instan langsung di browser pengguna.
   - Tanpa latensi jaringan & tanpa pengiriman video ke server luar — **privasi 100% terjaga**.
   - Dilengkapi *Debounced Gesture Stabilizer* untuk meredam jitter dan fluktuasi gerakan.

2. **Mesin Pengenalan Pola Aturan Geometris (Rule-Based Pattern Matching)**:
   - Algoritma vektor & jarak Euclidean mandiri di `src/utils/signRules.js` untuk mendeteksi:
     - **Alfabet**: Huruf **A**, **B**, **C**, **V**, **L**, **O**, **Y**, **I**.
     - **Kata Sapaan & Sopan Santun**: Kata **'HALO'**, **'TERIMA KASIH'**.
     - **Respon & Ekspresi**: Kata **'MANTAP / BAGUS'** (Thumbs Up), **'I LOVE YOU'** (Simbol ILY), dan **'OKE'**.

3. **Kotak Penyusun Kalimat & Riwayat (Hybrid Storage)**:
   - Akumulasi huruf/kata otomatis (tahan gestur selama 1 detik) atau manual.
   - Tombol kontrol: **Spasi**, **Hapus (Backspace)**, **Bersihkan (Clear)**.
   - **Text-to-Speech (TTS) Bahasa Indonesia**: Mengucapkan kalimat secara audio menggunakan Web Speech API bawaan.
   - **Penyimpanan Hybrid**: Menyimpan ke `localStorage` (agar 100% aktif saat offline) sekaligus menyinkronkan data ke backend Express (`/api/riwayat`).

4. **Kamus Bahasa Isyarat Interaktif**:
   - Menampilkan daftar peragaan gestur, langkah-langkah tangan, serta logika pembacaan AI.
   - Filter kategori (*Semua*, *Alfabet*, *Kata & Sapaan*, *Respon & Ekspresi*) dan pencarian instan.
   - Terintegrasi dengan endpoint `/api/kamus` dengan fallback data offline otomatis.

5. **Pengalaman Mobile-First & Native App Feel**:
   - Tampilan pas satu layar HP tanpa scroll berlebih pada halaman kamera.
   - **Bottom Navigation Bar** untuk berpindah antar halaman (*Deteksi*, *Kamus*, *Riwayat*, *Tentang*).
   - Dukungan **Switch Camera** (berpindah antara kamera depan dan kamera belakang HP).
   - Cermin (*Mirror mode*) dan efek audio sentuhan via Web Audio API.

6. **Progressive Web App (PWA) Penuh**:
   - Dikonfigurasi dengan `vite-plugin-pwa` dan Service Worker (Workbox).
   - Dukungan caching aset model MediaPipe WASM sehingga aplikasi tetap dapat berjalan saat offline.
   - Prompt instalasi satu-klik (*Add to Home Screen*) dan deteksi status offline.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Computer Vision & AI**: [@mediapipe/hands](https://www.npmjs.com/package/@mediapipe/hands) & [@mediapipe/camera_utils](https://www.npmjs.com/package/@mediapipe/camera_utils)
- **PWA & Service Worker**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + [Workbox](https://developer.chrome.com/docs/workbox/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) (ditempatkan di `/api/index.js` untuk Vercel Serverless Function)
- **Database Lokal**: File JSON (`/data/kamus.json` & `/data/riwayat.json`) dengan fallback in-memory untuk lingkungan read-only serverless.
- **Icons & Visual**: [lucide-react](https://lucide.dev/) + [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 📂 Struktur Direktori Proyek

```text
web-isyarat/
├── api/
│   ├── index.js             # Express API & Vercel Serverless Function (/api/kamus, /api/riwayat)
│   └── server.js            # Standalone server untuk pengembangan lokal (port 3001)
├── data/
│   ├── kamus.json           # Database lokal kosakata isyarat & panduan peragaan
│   └── riwayat.json         # Database lokal log hasil terjemahan
├── public/
│   ├── favicon.svg          # Favicon vektor aplikasi
│   └── icons/
│       ├── icon-192x192.png # Ikon PWA standar 192px
│       └── icon-512x512.png # Ikon PWA beresolusi tinggi 512px (maskable)
├── src/
│   ├── components/
│   │   ├── DetectionView.jsx     # Halaman utama: deteksi kamera, HUD, penyusun kalimat
│   │   ├── DictionaryView.jsx    # Halaman kamus isyarat & modal panduan
│   │   ├── HistoryView.jsx       # Halaman riwayat terjemahan (hybrid storage)
│   │   ├── AboutView.jsx         # Halaman informasi teknis & arsitektur sistem
│   │   ├── BottomNav.jsx         # Bottom Navigation Bar native mobile
│   │   └── PwaInstallPrompt.jsx  # Banner install PWA & status offline
│   ├── utils/
│   │   ├── signRules.js          # Mesin pola geometris 21 landmark & filter stabilizer
│   │   ├── mediapipeLoader.js    # Compatibility loader MediaPipe untuk Vite ESM
│   │   ├── storage.js            # Modul hybrid storage (LocalStorage + Express API)
│   │   ├── tts.js                # Web Speech API (Text-to-Speech id-ID)
│   │   └── soundEffects.js       # Efek audio taktil via Web Audio API
│   ├── App.jsx              # Komponen utama container mobile & tab router
│   ├── main.jsx             # Entry point React & registrasi Service Worker PWA
│   └── index.css            # Styling global Tailwind CSS & layout base
├── vercel.json              # Konfigurasi routing rewrite Vercel (Frontend SPA + Backend API)
├── vite.config.js           # Konfigurasi Vite & PWA runtimeCaching
├── tailwind.config.js       # Konfigurasi tema warna & styling
└── package.json             # Dependensi & script eksekusi
```

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- npm versi 9 atau lebih baru.

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Aplikasi (Frontend + Backend Secara Bersamaan)
```bash
npm run dev
```
Perintah di atas akan mengeksekusi dua proses sekaligus menggunakan `concurrently`:
- **Server Express**: Berjalan di `http://localhost:3001`
- **Frontend Vite PWA**: Berjalan di `http://localhost:5173` (dilengkapi proxy otomatis ke `/api`)

Buka browser Anda dan navigasikan ke:
```
http://localhost:5173
```
*Catatan: Pastikan Anda memberikan izin akses kamera (Webcam Permission) pada browser saat prompt muncul.*

---

## 🧠 Cara Kerja AI & Logika Pembacaan Landmark (21 Points)

Google MediaPipe memetakan tangan manusia ke dalam 21 titik koordinat normalized $x, y, z \in [0.0, 1.0]$:

```
          8 (INDEX_TIP)    12 (MID_TIP)   16 (RING_TIP)   20 (PINKY_TIP)
          |                |              |               |
          7 (DIP)          11 (DIP)       15 (DIP)        19 (DIP)
          |                |              |               |
   4(TIP) 6 (PIP)          10 (PIP)       14 (PIP)        18 (PIP)
     \    |                |              |               |
   3(IP)  5 (MCP) --------- 9 (MCP) ------ 13 (MCP) ------ 17 (MCP)
     \    /
    2(MCP)
       \
      1(CMC)
         \
          0 (WRIST - Pergelangan)
```

### Algoritma Heuristik di `src/utils/signRules.js`:

1. **Deteksi Jari Tegak (Extended) vs Tertekuk (Folded)**:
   - Jarak Euclidean dihitung antara ujung jari (*TIP*) dengan pergelangan tangan (*WRIST - landmark 0*) dibandingkan terhadap sendi tengah (*PIP*):
     $$\text{isExtended} = \text{dist}(P_{\text{tip}}, P_{\text{wrist}}) > 1.15 \times \text{dist}(P_{\text{pip}}, P_{\text{wrist}}) \land P_{\text{tip}}.y < P_{\text{pip}}.y$$
   - Ketika jari ditekuk ke dalam telapak tangan, jarak ujung jari ke pergelangan akan memendek secara drastis.

2. **Aturan Pola Huruf & Kata**:
   - **Huruf A**: Seluruh 4 jari ditekuk rapat ke telapak ($\text{extendedCount} = 0$), sementara ibu jari berdiri tegak di samping luar sendi telunjuk ($P_4.y < P_6.y$).
   - **Huruf B**: Keempat jari utama lurus tegak ke atas rapat ($\text{extendedCount} = 4$), sementara ibu jari ditekuk melintang di depan telapak tangan.
   - **Huruf V**: Jari telunjuk dan jari tengah lurus terangkat ke atas membuka sudut V, sedangkan jari manis dan kelingking terlipat ke dalam.
   - **Huruf L**: Telunjuk tegak ke atas dan ibu jari terentang menyiku 90° ke samping ($P_4$ dan $P_8$ membentuk sudut siku), 3 jari lainnya terlipat.
   - **Huruf Y**: Ibu jari dan kelingking terentang maksimal ke luar (*shaka sign*), sementara 3 jari tengah terlipat.
   - **Huruf I**: Hanya jari kelingking yang tegak lurus ke atas, keempat jari lainnya ditekuk.
   - **Kata 'HALO'**: Seluruh 5 jari tangan terbuka lebar dan tegak menghadap kamera.
   - **Kata 'MANTAP' (Thumbs Up)**: Keempat jari terkepal rapat, sementara ibu jari terangkat tinggi tegak ke atas melampaui seluruh jari lainnya.
   - **Kata 'I LOVE YOU'**: Ibu jari, telunjuk, dan kelingking terbuka bersamaan, jari tengah dan jari manis terlipat.
   - **Kata 'OKE'**: Ujung ibu jari dan telunjuk saling bersentuhan membentuk lingkaran ($\text{dist}(P_4, P_8) < 0.3 \times \text{palmSize}$), sementara 3 jari lainnya tegak ke atas.

3. **Stabilizer Anti-Flicker (`GestureStabilizer`)**:
   - Prediksi harus konsisten dipertahankan selama minimal $N$ frame berturut-turut sebelum huruf/kata secara otomatis ditambahkan ke kalimat.

---

## 🌐 Panduan Deployment

### A. Deploy ke GitHub
1. Inisialisasi Git di repositori lokal:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit PWA Penerjemah Bahasa Isyarat 100% Client-Side AI"
   ```
2. Buat repositori baru di GitHub, lalu hubungkan remote dan push:
   ```bash
   git remote add origin https://github.com/USERNAME/web-isyarat.git
   git branch -M main
   git push -u origin main
   ```

### B. Deploy ke Vercel (Satu Klik / Terintegrasi)
Aplikasi ini sudah dilengkapi konfigurasi `vercel.json` yang secara otomatis mengenali file `/api/index.js` sebagai *Vercel Serverless Function* dan mem-build frontend Vite ke direktori `/dist`:

1. Buka [Vercel Dashboard](https://vercel.com/) dan pilih **Add New Project**.
2. Impor repositori GitHub Anda.
3. Konfigurasi proyek di Vercel:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Klik **Deploy**.
5. Vercel akan otomatis menyediakan URL HTTPS aktif (misal: `https://web-isyarat.vercel.app`), di mana kamera dan Service Worker PWA langsung berfungsi penuh!

---

## 🔒 Bebas Biaya & Tanpa Ketergantungan API Key
Aplikasi ini 100% **Open-Source**, tidak memerlukan:
- Tidak perlu OpenAI API Key
- Tidak perlu Gemini API Key
- Tidak perlu Google Cloud Vision API Key
- Tidak memerlukan database berbayar eksternal

Seluruh inferensi kecerdasan buatan berjalan langsung di peramban pengguna (*Edge on Device*).
