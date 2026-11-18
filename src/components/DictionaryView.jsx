import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Camera, 
  Sparkles, 
  Info, 
  X, 
  ArrowRight,
  HandMetal,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { fetchDictionaryData } from '../utils/storage';
import fallbackKamusData from '../../data/kamus.json';

export default function DictionaryView({ onSwitchToCamera }) {
  const [kamusList, setKamusList] = useState(fallbackKamusData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeItemModal, setActiveItemModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['Semua', 'Alfabet', 'Kata & Sapaan', 'Respon & Ekspresi'];

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
    <div className="w-full flex-1 flex flex-col gap-5 overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <span>Kamus Bahasa Isyarat SIBI / BISINDO</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Panduan posisi jari tangan dan logika pengenalan kamera real-time
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari huruf, kata, atau gestur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
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
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-slate-800 text-teal-400 border border-teal-500/30 shadow-sm'
                : 'bg-[#111827] text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-auto hidden sm:inline">
          Menampilkan {filteredList.length} Isyarat
        </span>
      </div>

      {/* Grid Kosakata Kamus (Desktop 3 Kolom, Tablet 2 Kolom, HP 1 Kolom) */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-20 pr-1">
        {filteredList.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveItemModal(item)}
            className="bg-[#111827] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition shadow-sm cursor-pointer flex flex-col justify-between gap-3 group active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0b0f19] border border-slate-700/80 flex items-center justify-center text-xl font-bold text-teal-400 flex-shrink-0 group-hover:border-teal-500/40 transition">
                {item.kode.length <= 2 ? item.kode : <HandMetal className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-teal-300 transition">
                    {item.label}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                    {item.kategori}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.gerakan}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Kamera Real-time
              </span>
              <span className="text-slate-400 group-hover:text-white flex items-center gap-1 transition">
                Lihat Panduan <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail Peragaan & Aturan AI */}
      {activeItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0b0f19] border border-teal-500/40 flex items-center justify-center text-xl font-black text-teal-400">
                  {activeItemModal.kode.length <= 2 ? activeItemModal.kode : <HandMetal className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeItemModal.label}</h3>
                  <span className="text-xs text-slate-400">{activeItemModal.kategori}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveItemModal(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800">
                <span className="font-bold text-white block mb-1">Panduan Posisi Jari:</span>
                <p className="leading-relaxed text-slate-300">{activeItemModal.gerakan}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800">
                <span className="font-bold text-teal-400 block mb-1">Logika Sensor AI (Landmark):</span>
                <p className="leading-relaxed text-slate-300">{activeItemModal.ruleDeskripsi}</p>
              </div>

              {activeItemModal.tips && (
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300 leading-relaxed">
                    <strong>Tips Deteksi:</strong> {activeItemModal.tips}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setActiveItemModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setActiveItemModal(null);
                  onSwitchToCamera();
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" /> Coba di Kamera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
