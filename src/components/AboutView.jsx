import React from 'react';
import { 
  WifiOff, 
  Scan, 
  BookOpen, 
  Download, 
  CheckCircle2
} from 'lucide-react';
import { usePwaInstall } from '../utils/pwaInstall';

export default function AboutView() {
  const { isInstalled, triggerInstall } = usePwaInstall();

  return (
    <div className="w-full flex-1 flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      <div className="text-center sm:text-left py-4 sm:py-8 flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#c84b1a] text-xs font-bold w-fit mx-auto sm:mx-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c84b1a]" />
          <span>Berjalan di browser, tanpa internet</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Setiap isyarat<br />layak didengar.
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed">
          Arahkan kamera ke tanganmu, dan gerakan SIBI atau BISINDO langsung berubah jadi teks dan suara. Semua berjalan di perangkatmu, tanpa akun dan tanpa API key.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
          {isInstalled ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Aplikasi Sudah Diinstall</span>
            </div>
          ) : (
            <button
              onClick={triggerInstall}
              className="px-6 py-2.5 rounded-full bg-[#c84b1a] hover:bg-[#b53f12] text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Install Aplikasi ke Perangkat</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#ede8e1] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#c84b1a] flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-stone-900 text-base">100% offline</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Model berjalan di perangkatmu. Tidak ada video yang dikirim ke server dan tidak perlu API key.
          </p>
        </div>

        <div className="bg-white border border-[#ede8e1] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#c84b1a] flex items-center justify-center">
            <Scan className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-stone-900 text-base">Computer vision real-time</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            21 titik sendi tangan dibaca langsung dari kamera dan diterjemahkan saat kamu bergerak.
          </p>
        </div>

        <div className="bg-white border border-[#ede8e1] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#c84b1a] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-stone-900 text-base">Kamus SIBI dan BISINDO</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Pelajari setiap isyarat lewat kamus, lalu ganti sistem isyarat kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
}
