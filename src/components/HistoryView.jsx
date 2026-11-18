import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  Download, 
  Camera, 
  Sparkles,
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

  // Ambil data riwayat hybrid
  const loadHistory = async () => {
    setIsLoading(true);
    const data = await fetchTranslationHistory();
    setHistoryList(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Format Waktu ke Bahasa Indonesia yang rapi
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

  // Suarakan Kalimat
  const handleSpeak = (text) => {
    soundFX.playPop();
    speakText(text);
  };

  // Salin ke Clipboard
  const handleCopy = (item) => {
    navigator.clipboard.writeText(item.text);
    soundFX.playPop();
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Hapus satu entri
  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    soundFX.playTap();
    const updated = await deleteHistoryItem(id);
    setHistoryList(updated);
  };

  // Bersihkan semua riwayat
  const handleClearAll = async () => {
    soundFX.playTap();
    await deleteHistoryItem(null);
    setHistoryList([]);
    setShowConfirmClear(false);
  };

  // Ekspor Riwayat ke File TXT
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
    <div className="flex flex-col h-full w-full bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Top Header Riwayat */}
      <div className="p-4 bg-[#111827] border-b border-slate-800 shadow-md flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Riwayat Terjemahan</h2>
              <p className="text-[11px] text-slate-400">Penyimpanan Hybrid (Lokal & Server)</p>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-2">
            {historyList.length > 0 && (
              <>
                <button
                  onClick={handleExportText}
                  title="Ekspor ke Teks"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirmClear(true)}
                  title="Bersihkan Semua"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Konten Riwayat (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-xs">Memuat data riwayat...</p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-slate-500">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Belum Ada Riwayat</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Kalimat yang Anda susun dan simpan di halaman kamera akan otomatis tercatat di sini secara aman.
            </p>
            <button
              onClick={onSwitchToCamera}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Camera className="w-4 h-4" />
              <span>Buka Kamera Sekarang</span>
            </button>
          </div>
        ) : (
          historyList.map((item) => (
            <div
              key={item.id}
              className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition flex flex-col gap-3"
            >
              {/* Teks Kalimat Hasil Terjemahan */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="text-xs font-bold text-white block tracking-wide leading-snug">
                    "{item.text}"
                  </span>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatTime(item.timestamp)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.letterCount || item.text.length} Huruf
                    </span>
                    <span className="text-indigo-400">
                      {item.source || 'Kamera Real-time'}
                    </span>
                  </div>
                </div>

                {/* Tombol Hapus per Item */}
                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Bar Bawah Card */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                {/* Tombol Dengarkan TTS */}
                <button
                  onClick={() => handleSpeak(item.text)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dengarkan</span>
                </button>

                {/* Tombol Salin */}
                <button
                  onClick={() => handleCopy(item)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-cyan-600/20 text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Konfirmasi Hapus Semua */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/60 flex items-center justify-center mb-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Hapus Semua Riwayat?</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tindakan ini akan mengosongkan seluruh log hasil terjemahan dari penyimpanan lokal dan server.
            </p>
            <div className="mt-5 flex items-center gap-2 w-full">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
