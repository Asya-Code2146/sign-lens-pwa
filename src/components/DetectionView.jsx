import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera as CameraIcon, 
  FlipHorizontal, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Trash2, 
  Delete, 
  Save, 
  Space, 
  HelpCircle, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Hands, 
  Camera, 
  drawConnectors, 
  drawLandmarks, 
  HAND_CONNECTIONS 
} from '../utils/mediapipeLoader';
import { classifyHandGesture, GestureStabilizer } from '../utils/signRules';
import { saveTranslationHistory } from '../utils/storage';
import { speakText, stopSpeaking } from '../utils/tts';
import { soundFX } from '../utils/soundEffects';

export default function DetectionView({ onNavigateToHistory, onNavigateToDictionary }) {
  // Referensi DOM elemen kamera & kanvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const stabilizerRef = useRef(new GestureStabilizer(12, 0.75));

  // State Kamera & Model
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' (depan) atau 'environment' (belakang)
  const [isMirror, setIsMirror] = useState(true);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAutoAppend, setIsAutoAppend] = useState(true);

  // State Deteksi & Kalimat
  const [detectedGesture, setDetectedGesture] = useState(null);
  const [gestureProgress, setGestureProgress] = useState(0);
  const [sentence, setSentence] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [fps, setFps] = useState(0);

  // Perhitungan FPS & Debounce
  const lastFrameTimeRef = useRef(performance.now());
  const lastAddedGestureRef = useRef({ gesture: null, time: 0 });

  // Fungsi Tambah Huruf / Kata ke Kalimat
  const handleAppendSymbol = useCallback((symbol) => {
    if (!symbol) return;
    setSentence((prev) => {
      // Jika kata panjang seperti 'HALO' atau 'TERIMA KASIH', tambahkan dengan spasi jika sudah ada kata
      if (symbol.length > 1) {
        return prev ? `${prev} ${symbol} ` : `${symbol} `;
      }
      return prev + symbol;
    });

    if (isSoundEnabled) {
      soundFX.playPop();
    }
  }, [isSoundEnabled]);

  // Callback Hasil Deteksi dari MediaPipe Hands
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hitung estimasi FPS real-time
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    if (delta > 0) {
      setFps(Math.round(1000 / delta));
    }

    // Sesuaikan ukuran kanvas dengan video feed
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Gambar frame video ke kanvas
    if (isMirror && cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(results.image, 0, 0, width, height);

    if (isMirror && cameraFacing === 'user') {
      ctx.restore();
      ctx.save();
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Ambil landmark tangan pertama yang terdeteksi
      const landmarks = results.multiHandLandmarks[0];

      // Gambar konektor & titik koordinat landmark tangan
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: '#06b6d4',
        lineWidth: 3
      });
      drawLandmarks(ctx, landmarks, {
        color: '#6366f1',
        lineWidth: 1.5,
        radius: 4
      });

      ctx.restore();

      // Klasifikasikan gestur tangan menggunakan aturan geometris lokal
      const prediction = classifyHandGesture(landmarks);
      const stability = stabilizerRef.current.update(prediction);

      setGestureProgress(stability.progress);

      if (prediction.gesture) {
        setDetectedGesture(prediction);

        // Jika mode Auto-Append aktif dan gestur telah stabil dipertahankan
        if (isAutoAppend && stability.stableGesture) {
          const nowTime = Date.now();
          const last = lastAddedGestureRef.current;

          // Hindari penambahan berulang secara instan (jeda minimal 1.2 detik untuk gestur yang sama)
          if (last.gesture !== stability.stableGesture.gesture || (nowTime - last.time > 1200)) {
            lastAddedGestureRef.current = {
              gesture: stability.stableGesture.gesture,
              time: nowTime
            };
            handleAppendSymbol(stability.stableGesture.gesture);
            stabilizerRef.current.reset();
          }
        }
      } else {
        setDetectedGesture(null);
      }
    } else {
      ctx.restore();
      stabilizerRef.current.reset();
      setDetectedGesture(null);
      setGestureProgress(0);
    }
  }, [isMirror, cameraFacing, isAutoAppend, handleAppendSymbol]);

  // Inisialisasi MediaPipe Hands & Kamera Web
  useEffect(() => {
    let isMounted = true;
    setIsLoadingModel(true);
    setCameraError(null);

    async function initMediaPipe() {
      try {
        if (!Hands) {
          throw new Error('Modul MediaPipe Hands tidak dapat dimuat.');
        }

        // Konfigurasi instance Hands
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.65
        });

        hands.onResults(onResults);
        handsInstanceRef.current = hands;

        const video = videoRef.current;
        if (!video) return;

        // Dapatkan stream kamera dengan constraints facingMode (depan/belakang)
        const constraints = {
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();

        // Atur ukuran kanvas sesuai resolusi asli video stream
        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth || 640;
          canvasRef.current.height = video.videoHeight || 480;
        }

        // Loop frame kamera ke MediaPipe Hands
        let isProcessing = false;
        const processFrame = async () => {
          if (!isMounted) return;
          if (video && video.readyState >= 2 && !isProcessing && handsInstanceRef.current) {
            isProcessing = true;
            try {
              await handsInstanceRef.current.send({ image: video });
            } catch (err) {
              console.warn('Frame processing dropped:', err);
            }
            isProcessing = false;
          }
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        setIsLoadingModel(false);
      } catch (err) {
        console.error('Inisialisasi kamera / MediaPipe gagal:', err);
        if (isMounted) {
          setCameraError(err.message || 'Gagal mengakses kamera perangkat.');
          setIsLoadingModel(false);
        }
      }
    }

    initMediaPipe();

    // Cleanup saat unmount atau saat ganti kamera
    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(t => t.stop());
      }
      if (handsInstanceRef.current) {
        try {
          handsInstanceRef.current.close();
        } catch (e) {}
      }
    };
  }, [cameraFacing, onResults]);

  // Tombol Ganti Kamera Depan / Belakang
  const handleToggleCameraFacing = () => {
    if (isSoundEnabled) soundFX.playTap();
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
    setIsMirror(prev => !prev);
  };

  // Tombol Tambah Spasi
  const handleAddSpace = () => {
    if (isSoundEnabled) soundFX.playTap();
    setSentence(prev => (prev && !prev.endsWith(' ') ? prev + ' ' : prev));
  };

  // Tombol Hapus Karakter Terakhir (Backspace)
  const handleBackspace = () => {
    if (isSoundEnabled) soundFX.playTap();
    setSentence(prev => {
      if (!prev) return '';
      // Jika diakhiri spasi, hapus spasi terlebih dahulu
      if (prev.endsWith(' ')) {
        return prev.slice(0, -1);
      }
      return prev.slice(0, -1);
    });
  };

  // Tombol Bersihkan Kalimat
  const handleClearSentence = () => {
    if (isSoundEnabled) soundFX.playTap();
    setSentence('');
  };

  // Tombol Suarakan Teks (Text-to-Speech)
  const handleSpeak = () => {
    if (!sentence.trim()) return;
    speakText(sentence);
  };

  // Tombol Simpan ke Riwayat (Hybrid: LocalStorage + Backend)
  const handleSaveToHistory = async () => {
    if (!sentence.trim()) return;

    try {
      await saveTranslationHistory(sentence.trim(), 'Kamera Real-time');

      if (isSoundEnabled) {
        soundFX.playSuccess();
      }

      // Efek konfeti visual selebrasi
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#06b6d4', '#10b981']
      });

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2400);
    } catch (err) {
      console.error('Gagal menyimpan riwayat:', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#090d16] select-none overflow-hidden relative">
      {/* Video stream element (diproses tersembunyi, dirender via canvas) */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      {/* Area Kamera & Canvas Overlay */}
      <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
        {/* Kanvas MediaPipe & Landmark */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover sm:object-contain"
        />

        {/* Loading Overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 bg-[#090d16]/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-full border-4 border-t-indigo-500 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">Menyiapkan AI Lokal</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Memuat model MediaPipe 21 Landmark Tangan langsung di peramban Anda (100% Offline & Aman)...
            </p>
          </div>
        )}

        {/* Error Kamera */}
        {cameraError && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mb-3" />
            <h3 className="text-base font-bold text-white">Akses Kamera Diperlukan</h3>
            <p className="text-xs text-rose-200 mt-1 max-w-xs">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-4 h-4" /> Coba Lagi
            </button>
          </div>
        )}

        {/* Top Controls Overlay di atas kamera */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
          {/* Status AI & FPS Badge */}
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center gap-1.5 shadow-lg">
              <span className={`w-2 h-2 rounded-full ${isLoadingModel ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase">
                {isLoadingModel ? 'Memuat AI' : 'AI Aktif'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono ml-0.5">{fps} FPS</span>
            </div>
          </div>

          {/* Tombol Aksi Kamera Cepat */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Panduan Cepat */}
            <button
              onClick={() => setShowQuickGuide(!showQuickGuide)}
              title="Panduan Gestur"
              className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Toggle Suara FX */}
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              title={isSoundEnabled ? 'Suara Aktif' : 'Suara Bisu'}
              className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg"
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Toggle Cermin (Mirror) */}
            <button
              onClick={() => setIsMirror(!isMirror)}
              title="Balikkan Cermin"
              className={`w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center transition shadow-lg ${isMirror ? 'text-indigo-400' : 'text-slate-400'}`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Tombol Ganti Kamera Depan / Belakang (Khusus HP / Mobile) */}
            <button
              onClick={handleToggleCameraFacing}
              title="Ganti Kamera Depan/Belakang"
              className="w-9 h-9 rounded-full bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400/40 flex items-center justify-center text-white transition shadow-lg"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HUD Deteksi Real-Time di Bawah Kanvas */}
        <div className="absolute bottom-3 inset-x-3 flex flex-col items-center pointer-events-none z-20">
          {detectedGesture ? (
            <div className="w-full max-w-sm bg-slate-900/85 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Badge Huruf / Simbol Terdeteksi */}
              <div className="relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg border border-white/20">
                <span className="text-2xl font-black text-white tracking-wider">
                  {detectedGesture.gesture}
                </span>

                {/* Lingkaran Progress Debounce / Penahanan Gestur */}
                {isAutoAppend && (
                  <svg className="absolute -inset-1 w-16 h-16 pointer-events-none -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="3"
                      fill="transparent"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      stroke="#38bdf8"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray="188.4"
                      strokeDashoffset={188.4 * (1 - gestureProgress)}
                      strokeLinecap="round"
                      className="transition-all duration-75"
                    />
                  </svg>
                )}
              </div>

              {/* Info Detail Gestur */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">
                    {detectedGesture.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-semibold border border-indigo-400/20">
                    {Math.round(detectedGesture.confidence * 100)}% Cocok
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  {detectedGesture.description}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {isAutoAppend ? 'Tahan 1 detik untuk menyusun' : 'Klik tanda + untuk menambah'}
                  </span>
                </div>
              </div>

              {/* Tombol Manual Tambah (Jika Auto-Append Nonaktif) */}
              {!isAutoAppend && (
                <button
                  onClick={() => handleAppendSymbol(detectedGesture.gesture)}
                  className="pointer-events-auto px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  + Tambah
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 rounded-full bg-slate-900/75 backdrop-blur-md border border-slate-700/60 text-slate-300 text-xs font-medium flex items-center gap-2 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Arahkan tangan ke depan kamera</span>
            </div>
          )}
        </div>
      </div>

      {/* Bagian Penyusun Kalimat (Sentence Builder Box) */}
      <div className="w-full bg-[#111827] border-t border-slate-800 p-3 flex flex-col gap-2.5 z-20 shadow-xl">
        {/* Tampilan Kalimat yang sedang disusun */}
        <div className="flex items-center justify-between bg-[#090d16] border border-slate-700/80 rounded-xl px-3 py-2.5 min-h-[50px] shadow-inner">
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Hasil Terjemahan:
            </span>
            <p className="text-sm font-semibold text-white tracking-wide break-words">
              {sentence ? (
                <>
                  {sentence}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                </>
              ) : (
                <span className="text-slate-500 italic text-xs font-normal">
                  Huruf dan kata yang terdeteksi akan tersusun di sini...
                </span>
              )}
            </p>
          </div>

          {/* Tombol Suara TTS Langsung */}
          {sentence && (
            <button
              onClick={handleSpeak}
              title="Dengarkan Suara Kalimat"
              className="p-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>

        {/* Baris Tombol Kontrol Penyusun Kalimat */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Tombol Spasi */}
          <button
            onClick={handleAddSpace}
            className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Space className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spasi</span>
          </button>

          {/* Tombol Hapus 1 Karakter */}
          <button
            onClick={handleBackspace}
            disabled={!sentence}
            className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Delete className="w-3.5 h-3.5 text-amber-400" />
            <span>Hapus</span>
          </button>

          {/* Tombol Bersihkan Kalimat */}
          <button
            onClick={handleClearSentence}
            disabled={!sentence}
            className="py-2 px-3 bg-slate-800 hover:bg-rose-900/40 disabled:opacity-40 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-rose-300 flex items-center justify-center gap-1 active:scale-95 transition"
            title="Bersihkan Semua"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Tombol Simpan ke Riwayat (Paling Utama) */}
          <button
            onClick={handleSaveToHistory}
            disabled={!sentence.trim()}
            className="flex-[1.5] py-2 px-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 active:scale-95 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Pop-up Notifikasi Berhasil Disimpan */}
      {saveSuccessNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Tersimpan di Riwayat (Lokal & Server)!</span>
        </div>
      )}

      {/* Modal Drawer Panduan Gestur Singkat (Quick Guide) */}
      {showQuickGuide && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl p-5 max-h-[80%] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h4 className="text-base font-bold text-white">Panduan Gestur Kamera</h4>
              </div>
              <button
                onClick={() => setShowQuickGuide(false)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Tutup
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2.5 text-xs text-slate-300 pr-1">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-bold text-indigo-300 block mb-0.5">Huruf A, B, C, V, L, O, Y, I</span>
                <p className="text-slate-400">
                  Peragakan gestur dengan jarak ~30-70 cm dari kamera. Pastikan pencahayaan cukup dan jari tidak terhalang.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-bold text-cyan-300 block mb-0.5">Kata 'Halo' & 'Terima Kasih'</span>
                <p className="text-slate-400">
                  Buka kelima jari tegak untuk <strong className="text-white">'Halo'</strong>. Rapatkan jari mendatar untuk <strong className="text-white">'Terima Kasih'</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-bold text-emerald-300 block mb-0.5">Ekspresi 'Mantap', 'I Love You', 'Oke'</span>
                <p className="text-slate-400">
                  Jempol ke atas untuk <strong className="text-white">'Mantap'</strong>. Buka jempol, telunjuk, & kelingking untuk <strong className="text-white">'I Love You'</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowQuickGuide(false);
                if (onNavigateToDictionary) onNavigateToDictionary();
              }}
              className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition text-center shadow-lg"
            >
              Buka Kamus Isyarat Lengkap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
