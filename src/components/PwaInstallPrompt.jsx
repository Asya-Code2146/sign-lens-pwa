import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

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
      {isOffline && (
        <div className="bg-stone-800 text-stone-200 text-xs font-medium py-1 px-3 text-center flex items-center justify-center gap-1.5 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Offline Aktif</span>
        </div>
      )}

      {showPrompt && !isInstalled && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto bg-white border border-[#ede8e1] rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#c84b1a] flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-stone-900 truncate">Pasang Isyarat</h4>
              <p className="text-[11px] text-stone-500 truncate">
                Install di layar beranda untuk akses instan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-[#c84b1a] hover:bg-[#b53f12] text-white text-xs font-bold rounded-full shadow-sm transition"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
