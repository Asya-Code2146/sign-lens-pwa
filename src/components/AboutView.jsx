import React from 'react';
import { 
  Cpu, 
  Users, 
  WifiOff, 
  Layers, 
  Globe, 
  CheckCircle2,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function AboutView() {
  return (
    <div className="w-full flex-1 flex flex-col gap-5 overflow-y-auto pb-20 pr-1">
      {/* Hero Badge */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white tracking-tight">Isyaratku PWA</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Mendukung 1 & 2 Tangan
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Aplikasi Progressive Web App penerjemah bahasa isyarat standar SIBI (Satu Tangan) dan BISINDO (Dua Tangan) berbasis Computer Vision 100% Client-Side di peramban.
          </p>
        </div>
      </div>

      {/* Standar Bahasa Isyarat Indonesia (SIBI & BISINDO) */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-400" />
          <span>Kesesuaian dengan Standar Bahasa Orang Isyarat</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Di Indonesia, terdapat dua sistem bahasa isyarat utama yang digunakan oleh komunitas Tuli:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800">
            <div className="flex items-center gap-2 mb-1 text-teal-400 font-bold text-xs">
              <Users className="w-4 h-4" />
              <span>BISINDO (Bahasa Isyarat Indonesia)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bahasa isyarat alami ibu komunitas Tuli di Indonesia. Sangat kaya menggunakan <strong>dua tangan</strong> secara simultan untuk kata sapaan, respon, ekspresi, dan alfabet. Sistem kami kini mendeteksi kedua tangan untuk isyarat seperti <em>'Terima Kasih'</em>, <em>'Sama-Sama'</em>, <em>'Dua Jempol'</em>, dan <em>'Cinta/Hati'</em>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800">
            <div className="flex items-center gap-2 mb-1 text-indigo-400 font-bold text-xs">
              <Layers className="w-4 h-4" />
              <span>SIBI (Sistem Isyarat Bahasa Indonesia)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem isyarat formal berbasis tata bahasa Indonesia yang dibakukan oleh pemerintah, dominan menggunakan <strong>satu tangan</strong> untuk alfabet daktilologi (A–Z) dan kosa kata dasar.
            </p>
          </div>
        </div>
      </div>

      {/* Fitur Teknis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
            <Cpu className="w-4 h-4" /> 100% Client-Side AI
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            MediaPipe Hands memproses 21 titik koordinat langsung di peramban tanpa mengirim video keluar. Aman, bebas biaya API, dan cepat tanpa latensi server.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <WifiOff className="w-4 h-4" /> Dukungan Mode Offline
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dikonfigurasi dengan Service Worker untuk mencadangkan aset web dan pustaka AI, sehingga aplikasi tetap berfungsi walau jaringan terputus.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" /> PWA Installable
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dapat dipasang ke layar beranda HP atau desktop melalui tombol di bilah navigasi atas (Navbar).
          </p>
        </div>
      </div>
    </div>
  );
}
