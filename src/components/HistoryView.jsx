import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  Download, 
  Camera, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { fetchTranslationHistory, deleteHistoryItem } from '../utils/storage';
import { speakText } from '../utils/tts';
import { soundFX } from '../utils/soundEffects';

export default function HistoryView({ onSwitchToCamera }) {
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await fetchTranslationHistory();
    setHistoryList(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return isoString || 'Baru saja';
    }
  };

  const handleSpeak = (text) => {
    soundFX.playPop();
    speakText(text);
  };

  const handleCopy = (item) => {
    navigator.clipboard.writeText(item.text);
    soundFX.playPop();
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    soundFX.playTap();
    const updated = await deleteHistoryItem(id);
    setHistoryList(updated);
  };

  const handleClearAll = async () => {
    soundFX.playTap();
    await deleteHistoryItem(null);
    setHistoryList([]);
    setShowConfirmClear(false);
  };

  const handleExportText = () => {
    if (historyList.length === 0) return;
    const content = historyList
      .map(
        (item, idx) =>
          `[${idx + 1}] ${formatTime(item.timestamp)} | ${item.text} (${item.letterCount} karakter)`
      )
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-isyaratku-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-5 overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            <span>Riwayat Terjemahan Kalimat</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tersimpan otomatis di penyimpanan lokal dan server backend
          </p>
        </div>

        {historyList.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>
            <button
              onClick={() => setShowConfirmClear(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </div>
        )}
      </div>

      {/* Konten Riwayat */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-20 pr-1">
        {historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#111827] border border-slate-800 rounded-2xl p-8">
            <Clock className="w-10 h-10 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">Belum Ada Riwayat</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Gunakan kamera untuk menerjemahkan gestur tangan menjadi kalimat dan klik "Simpan".
            </p>
            <button
              onClick={onSwitchToCamera}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              <Camera className="w-4 h-4" /> Buka Kamera
            </button>
          </div>
        ) : (
          historyList.map((item) => (
            <div
              key={item.id}
              className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-white tracking-wide">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatTime(item.timestamp)}
                  </span>
                  <span>•</span>
                  <span>{item.letterCount || item.text.length} Karakter</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <button
                  onClick={() => handleSpeak(item.text)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Suarakan
                </button>

                <button
                  onClick={() => handleCopy(item)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Hapus Semua */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <h4 className="text-sm font-bold text-white">Kosongkan Seluruh Riwayat?</h4>
            <p className="text-xs text-slate-400">
              Semua log terjemahan kalimat yang tersimpan akan dihapus dari perangkat dan database.
            </p>
            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
