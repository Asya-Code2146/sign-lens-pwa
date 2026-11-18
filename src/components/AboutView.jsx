import React from 'react';
import { 
  Cpu, 
  Users, 
  WifiOff, 
  Layers, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export default function AboutView() {
  return (
    <div className="w-full flex-1 flex flex-col gap-4 overflow-y-auto pb-20 pr-1">
      <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-white tracking-tight">Isyaratku PWA</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              1 & 2 Tangan
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Aplikasi web penerjemah bahasa isyarat SIBI dan BISINDO berbasis Computer Vision 100% Client-Side.
          </p>
        </div>
      </div>

      <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Standar Bahasa Isyarat SIBI & BISINDO</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-400 font-semibold text-xs">
              <Users className="w-3.5 h-3.5" />
              <span>BISINDO (Bahasa Isyarat Indonesia)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Bahasa isyarat alami komunitas Tuli yang banyak memanfaatkan kedua tangan untuk kata sapaan, respon, dan ekspresi.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800">
            <div className="flex items-center gap-1.5 mb-1 text-zinc-200 font-semibold text-xs">
              <Layers className="w-3.5 h-3.5" />
              <span>SIBI (Sistem Isyarat Bahasa Indonesia)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Sistem isyarat formal berbasis tata bahasa yang dominan memakai satu tangan untuk alfabet daktilologi.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800/80 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" /> 100% Client-Side AI
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            MediaPipe Hands memproses koordinat langsung di peramban tanpa koneksi server eksternal.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800/80 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-xs">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" /> Dukungan Mode Offline
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Service Worker mencadangkan aset sehingga aplikasi tetap dapat dibuka saat offline.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800/80 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PWA Installable
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Dapat dipasang ke layar beranda HP atau desktop melalui tombol di bilah navigasi.
          </p>
        </div>
      </div>
    </div>
  );
}
