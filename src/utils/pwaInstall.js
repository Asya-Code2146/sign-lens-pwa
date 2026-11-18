/**
 * PWA Install Manager & State Handler
 */

import { useState, useEffect } from 'react';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah berjalan dalam mode standalone (terpasang di HP/Desktop)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      localStorage.getItem('isyaratku_pwa_installed') === 'true';

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Tangkap event beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Jika event ini muncul, berarti aplikasi belum terpasang
      if (!isStandalone) {
        setIsInstalled(false);
      }
    };

    // 3. Tangkap event saat aplikasi selesai di-install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('isyaratku_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      // Jika browser tidak mendukung prompt atau sudah diinstall
      if (isInstalled) return;
      alert('Untuk memasang aplikasi ini, silakan klik ikon pasang di bilah alamat browser (URL bar) atau pilih menu browser > "Tambahkan ke Layar Utama / Install".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      localStorage.setItem('isyaratku_pwa_installed', 'true');
    }
    setDeferredPrompt(null);
  };

  return {
    isInstalled,
    canInstall: !!deferredPrompt || !isInstalled,
    triggerInstall
  };
}
