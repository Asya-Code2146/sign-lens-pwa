import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera as CameraIcon, 
  FlipHorizontal, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Delete, 
  Save, 
  Space, 
  HelpCircle, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  HandMetal,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Hands, 
  drawConnectors, 
  drawLandmarks, 
  HAND_CONNECTIONS 
} from '../utils/mediapipeLoader';
import { classifyMultiHands, GestureStabilizer } from '../utils/signRules';
import { saveTranslationHistory } from '../utils/storage';
import { speakText } from '../utils/tts';
import { soundFX } from '../utils/soundEffects';

export default function DetectionView({ onNavigateToHistory, onNavigateToDictionary }) {
  // Referensi DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  
  // Stabilizer anti-flicker
  const stabilizerRef = useRef(new GestureStabilizer(30, 0.85));

  // State Kamera & Model
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' (depan) atau 'environment' (belakang)
  const [isMirror, setIsMirror] = useState(true);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAutoAppend, setIsAutoAppend] = useState(false); // Default Manual agar pengguna memegang kendali penuh

  // State Deteksi & Kalimat
  const [detectedGesture, setDetectedGesture] = useState(null);
  const [gestureProgress, setGestureProgress] = useState(0);
  const [sentence, setSentence] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [fps, setFps] = useState(0);
  const [handCount, setHandCount] = useState(0);

  // Perhitungan FPS & Debounce
  const lastFrameTimeRef = useRef(performance.now());
  const lastAddedRef = useRef({ symbol: null, time: 0 });

  // Fungsi Tambah Huruf / Kata ke Kalimat
  const handleAppendSymbol = useCallback((symbol) => {
    if (!symbol) return;
    setSentence((prev) => {
      if (symbol.length > 1) {
        return prev ? `${prev} ${symbol} ` : `${symbol} `;
      }
      return prev + symbol;
    });

    if (isSoundEnabled) {
      soundFX.playPop();
    }
  }, [isSoundEnabled]);

  // Callback Hasil Deteksi dari MediaPipe Hands (Dua Tangan)
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hitung FPS
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    if (delta > 0) {
      setFps(Math.round(1000 / delta));
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // KUNCI MIRRORING: Terapkan transformasi cermin ke KANVAS SEBELUM menggambar video dan landmark
    const shouldMirror = isMirror && cameraFacing === 'user';
    if (shouldMirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Gambar frame video
    ctx.drawImage(results.image, 0, 0, width, height);

    // 2. Gambar garis & titik sensor untuk KEDUA TANGAN
    const detectedHands = results.multiHandLandmarks || [];
    setHandCount(detectedHands.length);

    if (detectedHands.length > 0) {
      detectedHands.forEach((landmarks, idx) => {
        // Tangan 1: Cyan/Emerald, Tangan 2: Purple/Amber
        const lineColor = idx === 0 ? '#06b6d4' : '#a855f7';
        const dotColor = idx === 0 ? '#10b981' : '#f59e0b';

        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: lineColor,
          lineWidth: 3
        });

        drawLandmarks(ctx, landmarks, {
          color: dotColor,
          lineWidth: 1.5,
          radius: 4
        });
      });

      ctx.restore(); // Kembalikan konteks kanvas ke normal

      // 3. Klasifikasikan gestur (otomatis mengenali 1 tangan atau 2 tangan)
      const prediction = classifyMultiHands(detectedHands);
      const stability = stabilizerRef.current.update(prediction);

      setGestureProgress(stability.progress);

      if (prediction.gesture) {
        setDetectedGesture(prediction);

        if (isAutoAppend && stability.stableGesture) {
          const nowTime = Date.now();
          const last = lastAddedRef.current;

          if (last.symbol !== stability.stableGesture.gesture || (nowTime - last.time > 1500)) {
            lastAddedRef.current = {
              symbol: stability.stableGesture.gesture,
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
      setDetectedGesture(null);
      setGestureProgress(0);
      stabilizerRef.current.reset();
    }
  }, [isMirror, cameraFacing, isAutoAppend, handleAppendSymbol]);

  // Inisialisasi MediaPipe Hands (Mendukung hingga 2 tangan secara simultan)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingModel(true);
    setCameraError(null);

    async function initMediaPipe() {
      try {
        if (!Hands) {
          throw new Error('Modul MediaPipe Hands tidak dapat dimuat.');
        }

        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        // Konfigurasi DUA TANGAN (maxNumHands: 2)
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.65
        });

        hands.onResults(onResults);
        handsInstanceRef.current = hands;

        const video = videoRef.current;
        if (!video) return;

        const constraints = {
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
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

        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth || 1280;
          canvasRef.current.height = video.videoHeight || 720;
        }

        let isProcessing = false;
        const processFrame = async () => {
          if (!isMounted) return;
          if (video && video.readyState >= 2 && !isProcessing && handsInstanceRef.current) {
            isProcessing = true;
            try {
              await handsInstanceRef.current.send({ image: video });
            } catch (err) {
              console.warn('Frame dropped:', err);
            }
            isProcessing = false;
          }
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        setIsLoadingModel(false);
      } catch (err) {
        console.error('Inisialisasi kamera gagal:', err);
        if (isMounted) {
          setCameraError(err.message || 'Gagal mengakses kamera perangkat.');
          setIsLoadingModel(false);
        }
      }
    }

    initMediaPipe();

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

  const handleToggleCameraFacing = () => {
    if (isSoundEnabled) soundFX.playTap();
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
    setIsMirror(prev => !prev);
  };

  const handleAddSpace = () => {
    if (isSoundEnabled) soundFX.playTap();
    setSentence(prev => (prev && !prev.endsWith(' ') ? prev + ' ' : prev));
  };

  const handleBackspace = () => {
    if (isSoundEnabled) soundFX.playTap();
    setSentence(prev => {
      if (!prev) return '';
      if (prev.endsWith(' ')) return prev.slice(0, -1);
      return prev.slice(0, -1);
    });
  };

  const handleClearSentence = () => {
    if (isSoundEnabled) soundFX.playTap();
    setSentence('');
  };

  const handleSpeak = () => {
    if (!sentence.trim()) return;
    speakText(sentence);
  };

  const handleSaveToHistory = async () => {
    if (!sentence.trim()) return;

    try {
      await saveTranslationHistory(sentence.trim(), 'Kamera Real-time');

      if (isSoundEnabled) {
        soundFX.playSuccess();
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#6366f1']
      });

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch (err) {
      console.error('Gagal menyimpan riwayat:', err);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-5 overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* KOLOM KIRI (7/12 Desktop): FEED KAMERA & CANVAS OVERLAY DUA TANGAN */}
      {/* ==================================================================== */}
      <div className="lg:col-span-7 flex flex-col bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-lg relative min-h-[340px] sm:min-h-[460px]">
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />

          {isLoadingModel && (
            <div className="absolute inset-0 bg-[#0b0f19]/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-teal-400 animate-spin mb-3" />
              <h3 className="text-sm font-bold text-white tracking-wide">Menyiapkan Sensor Dua Tangan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Memuat modul MediaPipe Dual-Hand Landmark (1 & 2 Tangan)...
              </p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Akses Kamera Diperlukan</h3>
              <p className="text-xs text-rose-200 mt-1 max-w-sm">{cameraError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Kamera
              </button>
            </div>
          )}

          {/* HUD Status Bar di Atas Kamera */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700 flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${handCount > 0 ? (handCount >= 2 ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-pulse') : 'bg-slate-500'}`} />
                <span className="font-semibold text-slate-200">
                  {handCount === 0 && 'Mencari Tangan'}
                  {handCount === 1 && '1 Tangan Terdeteksi'}
                  {handCount >= 2 && '2 Tangan Terdeteksi (Dual-Hand)'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono border-l border-slate-700 pl-2">{fps} FPS</span>
              </div>
            </div>

            {/* Tombol Kontrol Kamera */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMirror(!isMirror)}
                title="Cermin Horizontal (Mirror)"
                className={`p-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 transition ${isMirror ? 'text-teal-400 border-teal-500/40' : 'text-slate-400'}`}
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleCameraFacing}
                title="Ganti Kamera Depan / Belakang"
                className="p-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white transition"
              >
                <CameraIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                title={isSoundEnabled ? 'Suara Aktif' : 'Suara Bisu'}
                className="p-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white transition"
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* Petunjuk Posisi Tangan di Bawah Feed */}
        <div className="bg-[#0b0f19] px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-400" /> Mendukung isyarat 1 tangan (SIBI) & 2 tangan (BISINDO)
          </span>
          <button
            onClick={() => setShowQuickGuide(true)}
            className="text-teal-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Panduan Gestur
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* KOLOM KANAN (5/12 Desktop): WORKSPACE DETEKSI & PENYUSUN KALIMAT */}
      {/* ==================================================================== */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Card Status Deteksi Real-Time */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Hasil Deteksi Real-Time
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Auto Tambah:</span>
              <button
                onClick={() => setIsAutoAppend(!isAutoAppend)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isAutoAppend ? 'bg-teal-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isAutoAppend ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Area Simbol yang Terdeteksi */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 min-h-[78px]">
            {detectedGesture ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-teal-500/40 flex items-center justify-center text-xl font-black text-teal-400">
                    {detectedGesture.gesture}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {detectedGesture.label}
                      </h4>
                      {detectedGesture.category && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-teal-400 font-semibold border border-teal-500/20">
                          {detectedGesture.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {detectedGesture.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAppendSymbol(detectedGesture.gesture)}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <HandMetal className="w-4 h-4 text-slate-600" />
                <span>Bentuk isyarat tangan (misal: Huruf A, V, Halo, Terima Kasih, Mantap)</span>
              </div>
            )}
          </div>

          {isAutoAppend && (
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-teal-400 h-full transition-all duration-75"
                style={{ width: `${gestureProgress * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Card Penyusun Kalimat (Sentence Builder) */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Kotak Kalimat Terjemahan
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {sentence.trim().length} Karakter
            </span>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 min-h-[90px] flex-1 flex flex-col justify-between">
            <p className="text-sm font-semibold text-white tracking-wide break-words leading-relaxed">
              {sentence ? (
                <>
                  {sentence}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-teal-400 animate-pulse align-middle" />
                </>
              ) : (
                <span className="text-slate-600 italic font-normal text-xs">
                  Kata dan huruf yang Anda pilih akan tertulis di sini...
                </span>
              )}
            </p>

            {sentence && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSpeak}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Dengarkan
                </button>
              </div>
            )}
          </div>

          {/* Baris Tombol Aksi */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              onClick={handleAddSpace}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Space className="w-3.5 h-3.5 text-teal-400" />
              <span>Spasi</span>
            </button>

            <button
              onClick={handleBackspace}
              disabled={!sentence}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Delete className="w-3.5 h-3.5 text-amber-400" />
              <span>Hapus</span>
            </button>

            <button
              onClick={handleClearSentence}
              disabled={!sentence}
              className="py-2.5 bg-slate-800 hover:bg-rose-950/40 disabled:opacity-40 text-slate-300 hover:text-rose-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95"
              title="Bersihkan Semua"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSaveToHistory}
              disabled={!sentence.trim()}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </div>

        {/* Quick Reference Mini Cards */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Dukungan 1 & 2 Tangan:</span>
            <button
              onClick={onNavigateToDictionary}
              className="text-teal-400 hover:underline text-[11px]"
            >
              Buka Kamus SIBI/BISINDO →
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['A', 'B', 'C', 'V', 'L', 'O', 'Y', 'I', 'TERIMA KASIH (2 Tangan)', 'SAMA-SAMA (2 Tangan)', 'HALO', 'MANTAP', 'CINTA (2 Tangan)', 'OKE'].map(code => (
              <span
                key={code}
                className="px-2 py-1 rounded-md bg-[#0b0f19] border border-slate-800 text-[10px] font-mono text-slate-300"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Tersimpan di Riwayat (Lokal & Server)!</span>
        </div>
      )}

      {showQuickGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-400" /> Panduan Pembacaan 1 & 2 Tangan
              </h3>
              <button
                onClick={() => setShowQuickGuide(false)}
                className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800">
                <strong className="text-teal-400 block mb-0.5">Terima Kasih (Dua Tangan / BISINDO):</strong>
                Buka kedua telapak tangan mendatar sejajar di depan dada, gerakkan maju perlahan menyapa sopan.
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800">
                <strong className="text-teal-400 block mb-0.5">Sama-Sama (Dua Tangan / BISINDO):</strong>
                Satukan kedua telapak tangan menangkup di depan dada.
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800">
                <strong className="text-teal-400 block mb-0.5">Cinta / Bentuk Hati (Dua Tangan):</strong>
                Satukan kedua tangan membentuk lekukan lambang hati di depan dada.
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800">
                <strong className="text-white block mb-0.5">Huruf A, B, C, V, L, O, Y, I (SIBI):</strong>
                Cukup gunakan 1 tangan sesuai alfabet baku isyarat.
              </div>
            </div>
            <button
              onClick={() => {
                setShowQuickGuide(false);
                onNavigateToDictionary();
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold text-center"
            >
              Buka Kamus Isyarat Lengkap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
