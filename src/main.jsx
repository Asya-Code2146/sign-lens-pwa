import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registrasi Service Worker PWA otomatis melalui vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

// Konfigurasi update Service Worker otomatis
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 Versi baru aplikasi Isyaratku tersedia, memperbarui...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('⚡ Aplikasi siap digunakan dalam mode Offline (PWA Cache aktif).');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
