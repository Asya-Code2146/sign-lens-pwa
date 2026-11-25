import React from 'react';
import { 
  WifiOff, 
  Scan, 
  BookOpen, 
  Volume2, 
  ArrowRight,
  HandMetal
} from 'lucide-react';

export default function LandingPage({ onOpenApp, onOpenDictionary }) {
  return (
    <div className="w-full flex-1 flex flex-col gap-12 sm:gap-16 max-w-7xl mx-auto py-2 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#c84b1a] text-xs font-bold w-fit">
            <span className="w-2 h-2 rounded-full bg-[#c84b1a]" />
            <span>Berjalan di browser, tanpa internet</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
            Setiap isyarat<br />layak didengar.
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed">
            Arahkan kamera ke tanganmu, dan gerakan SIBI atau BISINDO langsung berubah jadi teks dan suara. Semua berjalan di perangkatmu, tanpa akun dan tanpa API key.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenApp}
              className="px-6 py-3 rounded-full bg-[#c84b1a] hover:bg-[#b53f12] text-white text-sm font-bold shadow-sm transition active:scale-95 flex items-center gap-2"
            >
              <span>Coba sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenDictionary}
              className="px-6 py-3 rounded-full bg-white hover:bg-stone-50 text-stone-800 border border-[#e5dfd7] text-sm font-bold shadow-sm transition"
            >
              Lihat kamus isyarat
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-md aspect-square bg-[#1a1614] rounded-[36px] p-6 shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between z-20">
              <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse" />
                <span>AI aktif · Mode offline</span>
              </div>
            </div>

            <div className="absolute top-12 left-6 z-30 bg-white rounded-2xl p-3 shadow-lg border border-stone-100 flex items-center gap-3">
              <div>
                <span className="text-[10px] text-stone-400 font-semibold uppercase block">Terjemahan</span>
                <span className="text-base font-extrabold text-stone-900">Halo</span>
              </div>
              <span className="text-xs font-bold text-[#c84b1a] bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                98% akurat
              </span>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#c84b1a] rounded-tl-2xl" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#c84b1a] rounded-tr-2xl" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#c84b1a] rounded-bl-2xl" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#c84b1a] rounded-br-2xl" />
                
                <div className="w-36 h-36 rounded-full bg-[#332219] flex items-center justify-center opacity-80">
                  <HandMetal className="w-20 h-20 text-[#e0a98b]" />
                </div>
              </div>
            </div>

            <div className="z-20 bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-stone-900 tracking-tight block">HALO</span>
              </div>
              <span className="text-xs text-stone-400 font-medium">Huruf terakhir: O</span>
            </div>

            <div className="absolute -bottom-2 -right-2 z-30">
              <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-stone-100 flex items-center gap-2 text-xs font-bold text-stone-800">
                <Volume2 className="w-4 h-4 text-[#c84b1a]" />
                <span>Bacakan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-[#ede8e1] rounded-[28px] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#c84b1a] flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-stone-900 text-lg">100% offline</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Model berjalan di perangkatmu. Tidak ada video yang dikirim ke server dan tidak perlu API key.
          </p>
        </div>

        <div className="bg-white border border-[#ede8e1] rounded-[28px] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#c84b1a] flex items-center justify-center">
            <Scan className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-stone-900 text-lg">Computer vision real-time</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            21 titik sendi tangan dibaca langsung dari kamera dan diterjemahkan saat kamu bergerak.
          </p>
        </div>

        <div className="bg-white border border-[#ede8e1] rounded-[28px] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#c84b1a] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-stone-900 text-lg">Kamus SIBI dan BISINDO</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Pelajari setiap isyarat lewat kamus, lalu ganti sistem isyarat kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
}
