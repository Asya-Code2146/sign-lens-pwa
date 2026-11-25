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
  const [copiedId, setCopiedId] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await fetchTranslationHistory();
      setHistoryList(data);
    }
    loadData();
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
    a.download = `riwayat-isyarat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-5">
      <div className="bg-white border border-[#ede8e1] rounded-[24px] sm:rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Riwayat Terjemahan</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Log kalimat tersimpan di peramban dan server lokal
          </p>
        </div>

        {historyList.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              className="px-4 py-2 bg-white border border-[#e5dfd7] hover:bg-stone-50 text-stone-800 rounded-full text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>
            <button
              onClick={() => setShowConfirmClear(true)}
              className="px-4 py-2 bg-white border border-[#e5dfd7] hover:bg-red-50 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-12">
        {historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-[#ede8e1] rounded-[28px] p-8">
            <Clock className="w-10 h-10 text-stone-300 mb-2" />
            <h3 className="text-sm font-bold text-stone-800">Belum Ada Riwayat</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              Gunakan kamera untuk menerjemahkan gerakan isyarat dan simpan ke riwayat.
            </p>
            <button
              onClick={onSwitchToCamera}
              className="mt-4 px-5 py-2.5 bg-[#c84b1a] hover:bg-[#b53f12] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Camera className="w-3.5 h-3.5" /> Buka Kamera
            </button>
          </div>
        ) : (
          historyList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#ede8e1] rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
            >
              <div className="flex-1">
                <p className="text-sm font-extrabold text-stone-900 tracking-tight">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatTime(item.timestamp)}
                  </span>
                  <span>•</span>
                  <span>{item.letterCount || item.text.length} Karakter</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <button
                  onClick={() => handleSpeak(item.text)}
                  className="px-3 py-1.5 bg-[#fbf9f5] border border-[#ede8e1] hover:bg-stone-100 text-stone-700 rounded-full text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#c84b1a]" /> Suarakan
                </button>

                <button
                  onClick={() => handleCopy(item)}
                  className="px-3 py-1.5 bg-[#fbf9f5] border border-[#ede8e1] hover:bg-stone-100 text-stone-700 rounded-full text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" /> Salin
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="p-2 text-stone-400 hover:text-red-600 rounded-full transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#ede8e1] w-full max-w-sm rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-[#c84b1a]" />
            <h4 className="text-sm font-bold text-stone-900">Kosongkan Riwayat?</h4>
            <p className="text-xs text-stone-500">
              Semua kalimat terjemahan yang tersimpan akan dihapus permanen.
            </p>
            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 bg-stone-100 text-stone-700 rounded-full text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold shadow-sm"
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
