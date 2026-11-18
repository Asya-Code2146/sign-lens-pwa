import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Camera, 
  Sparkles, 
  Info, 
  X, 
  CheckCircle, 
  Lightbulb,
  Layers,
  ArrowRight
} from 'lucide-react';
import { fetchDictionaryData } from '../utils/storage';
import fallbackKamusData from '../../data/kamus.json';

export default function DictionaryView({ onSwitchToCamera }) {
  const [kamusList, setKamusList] = useState(fallbackKamusData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeItemModal, setActiveItemModal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kategori Filter
  const categories = ['Semua', 'Alfabet', 'Kata & Sapaan', 'Respon & Ekspresi'];

  // Ambil data kamus dari Backend (/api/kamus) dengan fallback cerdas
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const data = await fetchDictionaryData(fallbackKamusData);
      if (isMounted) {
        setKamusList(data);
        setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Filter pencarian dan kategori
  const filteredList = kamusList.filter(item => {
    const matchesSearch = 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'Semua' || 
      item.kategori === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Top Header Kamus */}
      <div className="p-4 bg-[#111827] border-b border-slate-800 shadow-md flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Kamus Bahasa Isyarat</h2>
              <p className="text-[11px] text-slate-400">Panduan Peragaan Gerakan & Aturan AI</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
            {filteredList.length} Kosakata
          </span>
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari huruf, kata, atau gestur (mis: A, Halo, V)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090d16] border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Kosakata Kamus (Scrollable Content) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-xs">Memuat daftar kamus...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Info className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Tidak ada isyarat yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci pencarian atau kategori lain</p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItemModal(item)}
              className="group bg-[#111827] hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 transition shadow-sm cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
            >
              {/* Icon / Simbol Isyarat */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-900/60 to-slate-800 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition shadow">
                {item.icon || '✋'}
              </div>

              {/* Detail Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                    {item.label}
                  </h3>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                    {item.kategori}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {item.gerakan}
                </p>
                {item.isRealtimeSupported && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-400 font-medium">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Dapat Dideteksi Kamera Real-time</span>
                  </div>
                )}
              </div>

              {/* Panah Buka */}
              <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center flex-shrink-0 transition">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal Peragaan & Penjelasan AI */}
      {activeItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[88vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg border border-white/20">
                  {activeItemModal.icon || '✋'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">
                      {activeItemModal.label}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      {activeItemModal.kode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activeItemModal.deskripsi}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveItemModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-4 space-y-3.5 pr-1 text-xs">
              {/* Cara Peragaan Tangan */}
              <div className="p-3.5 rounded-2xl bg-[#090d16] border border-slate-700/80">
                <div className="flex items-center gap-2 text-indigo-300 font-bold mb-1.5 text-xs">
                  <Layers className="w-4 h-4" />
                  <span>Panduan Langkah Peragaan:</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {activeItemModal.gerakan}
                </p>
              </div>

              {/* Penjelasan Aturan Pola AI (Pattern Matching Logic) */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40">
                <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1.5 text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Logika Deteksi Landmark AI:</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {activeItemModal.ruleDeskripsi || 'Dianalisis melalui 21 titik koordinat MediaPipe Hands.'}
                </p>
              </div>

              {/* Tips Praktis */}
              {activeItemModal.tips && (
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-200/90 text-[11px] leading-relaxed">
                    <strong>Tips:</strong> {activeItemModal.tips}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer: Action Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setActiveItemModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Kembali
              </button>
              {activeItemModal.isRealtimeSupported && (
                <button
                  onClick={() => {
                    setActiveItemModal(null);
                    if (onSwitchToCamera) onSwitchToCamera();
                  }}
                  className="flex-[2] py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Camera className="w-4 h-4" />
                  <span>Coba di Kamera Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
