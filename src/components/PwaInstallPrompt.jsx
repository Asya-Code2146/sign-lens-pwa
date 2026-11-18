import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X, Sparkles, Check } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Deteksi jika sudah berjalan dalam mode standalone (sudah terpasang di HP)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    // Tangkap event install PWA dari browser
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Tampilkan banner jika belum ditolak di sesi ini
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    // Tangkap status konektivitas jaringan
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Badge Mode Offline Jika Jaringan Terputus */}
      {isOffline && (
        <div className="bg-amber-600/90 text-white text-[11px] font-semibold py-1 px-3 text-center flex items-center justify-center gap-1.5 shadow-md z-50 animate-in fade-in">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Offline Aktif — AI & Kamus tetap berfungsi penuh!</span>
        </div>
      )}

      {/* Banner Pasang Aplikasi PWA (Mobile Native Feel) */}
      {showPrompt && !isInstalled && (
        <div className="absolute top-3 inset-x-3 z-50 max-w-sm mx-auto bg-[#111827]/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 shadow">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Pasang Isyaratku</h4>
              <p className="text-[10px] text-slate-300 truncate">
                Install di layar HP untuk akses instan & offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
