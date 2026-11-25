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

export default function DictionaryView({ signSystem, onSwitchToCamera }) {
  const [kamusList, setKamusList] = useState(fallbackKamusData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeItemModal, setActiveItemModal] = useState(null);

  const categories = ['Semua', 'Alfabet', 'Kata & Sapaan', 'Aktivitas & Sehari-hari', 'Respon & Ekspresi'];

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
    <div className="w-full flex-1 flex flex-col gap-5">
      <div className="bg-white border border-[#ede8e1] rounded-[24px] sm:rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Kamus Bahasa Isyarat</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Pelajari setiap gerakan isyarat standar SIBI dan BISINDO
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari isyarat, huruf, atau kata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fbf9f5] border border-[#e5dfd7] rounded-full pl-9 pr-8 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#c84b1a] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-[#c84b1a] text-white shadow-sm'
                : 'bg-white text-stone-600 border border-[#e5dfd7] hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="text-xs text-stone-400 ml-auto hidden sm:inline">
          {filteredList.length} Isyarat
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
        {filteredList.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveItemModal(item)}
            className="bg-white hover:border-[#c84b1a]/40 border border-[#ede8e1] rounded-[22px] p-5 transition shadow-[0_4px_16px_rgba(0,0,0,0.02)] cursor-pointer flex flex-col justify-between gap-4 group active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fbf9f5] border border-[#ede8e1] flex items-center justify-center text-lg font-black text-[#c84b1a] flex-shrink-0 group-hover:bg-orange-50 transition">
                {item.kode.length <= 2 ? item.kode : (item.icon || <HandMetal className="w-5 h-5 text-[#c84b1a]" />)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 truncate group-hover:text-[#c84b1a] transition">
                    {item.label}
                  </h3>
                </div>
                <span className="inline-block text-[10px] font-semibold text-stone-400 mt-0.5">
                  {item.standar || item.kategori}
                </span>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                  {item.gerakan}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Didukung AI
              </span>
              <span className="text-stone-500 group-hover:text-stone-900 font-semibold flex items-center gap-1 transition text-[11px]">
                Panduan <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {activeItemModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#ede8e1] w-full max-w-lg rounded-[28px] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#fbf9f5] border border-[#ede8e1] flex items-center justify-center text-2xl font-black text-[#c84b1a]">
                  {activeItemModal.kode.length <= 2 ? activeItemModal.kode : (activeItemModal.icon || <HandMetal className="w-6 h-6" />)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">{activeItemModal.label}</h3>
                  <span className="text-xs font-semibold text-stone-400">{activeItemModal.standar || activeItemModal.kategori}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveItemModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#ede8e1]">
                <span className="font-bold text-stone-900 block mb-1">Panduan Langkah:</span>
                <p className="leading-relaxed text-stone-700">{activeItemModal.gerakan}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#ede8e1]">
                <span className="font-bold text-[#c84b1a] block mb-1">Logika Sensor AI:</span>
                <p className="leading-relaxed text-stone-700">{activeItemModal.ruleDeskripsi}</p>
              </div>

              {activeItemModal.tips && (
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#c84b1a] flex-shrink-0 mt-0.5" />
                  <p className="text-stone-700 leading-relaxed">
                    <strong>Tips:</strong> {activeItemModal.tips}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setActiveItemModal(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-xs font-bold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setActiveItemModal(null);
                  onSwitchToCamera();
                }}
                className="flex-1 py-2.5 bg-[#c84b1a] hover:bg-[#b53f12] text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" /> Praktikkan di Kamera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
