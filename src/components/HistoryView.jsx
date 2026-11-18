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
    <div className="w-full flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Riwayat Terjemahan</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log kalimat tersimpan di peramban dan server
          </p>
        </div>

        {historyList.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>
            <button
              onClick={() => setShowConfirmClear(true)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pb-20 pr-1">
        {historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#121215] border border-zinc-800/80 rounded-2xl p-6">
            <Clock className="w-8 h-8 text-zinc-600 mb-2" />
            <h3 className="text-sm font-semibold text-white">Belum Ada Riwayat</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Gunakan kamera untuk menerjemahkan gestur dan simpan hasil kalimat Anda.
            </p>
            <button
              onClick={onSwitchToCamera}
              className="mt-4 px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5" /> Buka Kamera
            </button>
          </div>
        ) : (
          historyList.map((item) => (
            <div
              key={item.id}
              className="bg-[#121215] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition"
            >
              <div className="flex-1">
                <p className="text-xs font-mono font-medium text-white tracking-wide">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatTime(item.timestamp)}
                  </span>
                  <span>•</span>
                  <span>{item.letterCount || item.text.length} Karakter</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                <button
                  onClick={() => handleSpeak(item.text)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3 h-3 text-emerald-400" /> Suarakan
                </button>

                <button
                  onClick={() => handleCopy(item)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" /> Salin
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="p-1 text-zinc-500 hover:text-white rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-zinc-400" />
            <h4 className="text-xs font-semibold text-white">Kosongkan Seluruh Riwayat?</h4>
            <p className="text-[11px] text-zinc-400">
              Semua log terjemahan kalimat yang tersimpan akan dihapus.
            </p>
            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-semibold"
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
