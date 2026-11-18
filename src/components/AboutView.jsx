import React from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  WifiOff, 
  Smartphone, 
  Layers, 
  Code2, 
  Globe, 
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';

export default function AboutView() {
  return (
    <div className="flex flex-col h-full w-full bg-[#090d16] text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Hero Badge */}
      <div className="bg-gradient-to-br from-indigo-900/40 via-[#111827] to-[#090d16] border border-indigo-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">Isyaratku PWA</h1>
            <p className="text-xs text-indigo-300 font-medium">Penerjemah Bahasa Isyarat Real-Time</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-2">
          Aplikasi Web Progresif (PWA) penerjemah bahasa isyarat tangan lokal ke teks secara langsung tanpa menggunakan kunci API eksternal (100% Client-Side AI).
        </p>
      </div>

      {/* Keunggulan Teknis */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider px-1">
          Spesifikasi Teknis & Arsitektur
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Item 1 */}
          <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 mt-0.5">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">100% Client-Side AI & Computer Vision</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Menggunakan Google MediaPipe Hands untuk mendeteksi 21 koordinat 3D landmark tangan langsung di prosesor/GPU perangkat peramban, tanpa mengirim frame video ke server eksternal. Privasi pengguna 100% terlindungi.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 mt-0.5">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">Dukungan Mode Offline PWA (Service Worker)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Dikonfigurasi dengan <code>vite-plugin-pwa</code> dan Workbox caching. Asset WASM MediaPipe dan aplikasi dapat dipasang ke layar utama HP (Add to Home Screen) serta berjalan lancar meski tanpa internet.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">Penyimpanan Hybrid (LocalStorage + Express API)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Log terjemahan disimpan secara instan di LocalStorage peramban dan disinkronkan ke endpoint Express <code>/api/riwayat</code> (Vercel Serverless Function).
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">Debounced Rule-Based Pattern Matching</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Algoritma vektor geometris mandiri menghitung rasio jarak Euclidean dan sudut antar jari dengan peredam jitter (stabilizer) agar deteksi stabil dan responsif tanpa lag.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informasi Deploy */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Siap Deploy ke GitHub & Vercel</span>
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Struktur repositori monorepo terpadu: Frontend React + Vite di-build ke folder <code>/dist</code>, backend Express di <code>/api/index.js</code> sebagai Vercel Serverless Functions, diatur rapi oleh <code>vercel.json</code>.
        </p>
      </div>
    </div>
  );
}
