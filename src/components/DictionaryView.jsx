import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Camera, 
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

  const categories = ['Semua', 'Alfabet', 'Kata & Sapaan', 'Respon & Ekspresi'];

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const data = await fetchDictionaryData(fallbackKamusData);
      if (isMounted) {
        setKamusList(data);
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
    <div className="w-full flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Kamus Bahasa Isyarat SIBI & BISINDO</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daftar kosakata isyarat 1 tangan dan 2 tangan
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari huruf atau kata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'bg-[#121215] text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="text-[11px] text-zinc-500 ml-auto hidden sm:inline">
          {filteredList.length} Isyarat
        </span>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20 pr-1">
        {filteredList.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveItemModal(item)}
            className="bg-[#121215] hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3.5 transition shadow-sm cursor-pointer flex flex-col justify-between gap-2.5 group active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-white flex-shrink-0 group-hover:border-zinc-700 transition">
                {item.kode.length <= 2 ? item.kode : <HandMetal className="w-4 h-4 text-emerald-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition">
                    {item.label}
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-850 text-zinc-400 border border-zinc-800">
                    {item.standar || item.kategori}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.gerakan}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-medium flex items-center gap-1 text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> Kamera Real-time
              </span>
              <span className="text-zinc-400 group-hover:text-white flex items-center gap-1 transition text-[10px]">
                Lihat Panduan <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {activeItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-zinc-800 flex items-center justify-center text-sm font-mono font-bold text-emerald-400">
                  {activeItemModal.kode.length <= 2 ? activeItemModal.kode : <HandMetal className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{activeItemModal.label}</h3>
                  <span className="text-xs text-zinc-400">{activeItemModal.standar || activeItemModal.kategori}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveItemModal(null)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="p-3 rounded-lg bg-[#18181b] border border-zinc-800">
                <span className="font-semibold text-white block mb-1">Panduan Posisi Jari:</span>
                <p className="leading-relaxed text-zinc-300 text-[11px]">{activeItemModal.gerakan}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#18181b] border border-zinc-800">
                <span className="font-semibold text-emerald-400 block mb-1">Logika Sensor AI:</span>
                <p className="leading-relaxed text-zinc-300 text-[11px]">{activeItemModal.ruleDeskripsi}</p>
              </div>

              {activeItemModal.tips && (
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    <strong>Tips:</strong> {activeItemModal.tips}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setActiveItemModal(null)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setActiveItemModal(null);
                  onSwitchToCamera();
                }}
                className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" /> Coba di Kamera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
