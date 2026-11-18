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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const stabilizerRef = useRef(new GestureStabilizer(30, 0.85));

  const [cameraFacing, setCameraFacing] = useState('user');
  const [isMirror, setIsMirror] = useState(true);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAutoAppend, setIsAutoAppend] = useState(false);

  const [detectedGesture, setDetectedGesture] = useState(null);
  const [gestureProgress, setGestureProgress] = useState(0);
  const [sentence, setSentence] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [fps, setFps] = useState(0);
  const [handCount, setHandCount] = useState(0);

  const lastFrameTimeRef = useRef(performance.now());
  const lastAddedRef = useRef({ symbol: null, time: 0 });

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

  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    const shouldMirror = isMirror && cameraFacing === 'user';
    if (shouldMirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(results.image, 0, 0, width, height);

    const detectedHands = results.multiHandLandmarks || [];
    setHandCount(detectedHands.length);

    if (detectedHands.length > 0) {
      detectedHands.forEach((landmarks, idx) => {
        const lineColor = idx === 0 ? '#06b6d4' : '#a855f7';
        const dotColor = idx === 0 ? '#10b981' : '#f59e0b';

        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: lineColor,
          lineWidth: 2.5
        });

        drawLandmarks(ctx, landmarks, {
          color: dotColor,
          lineWidth: 1.5,
          radius: 3.5
        });
      });

      ctx.restore();

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
            } catch (err) {}
            isProcessing = false;
          }
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        setIsLoadingModel(false);
      } catch (err) {
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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#ffffff']
      });

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2200);
    } catch (err) {}
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-5 overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      <div className="lg:col-span-7 flex flex-col bg-[#121215] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm relative min-h-[340px] sm:min-h-[460px]">
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />

          {isLoadingModel && (
            <div className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center">
              <div className="w-9 h-9 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-3" />
              <h3 className="text-xs font-semibold text-white tracking-wide">Menyiapkan Sensor Landmark</h3>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                Memuat pustaka MediaPipe di browser...
              </p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
              <h3 className="text-xs font-semibold text-white">Akses Kamera Diperlukan</h3>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">{cameraError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Muat Ulang
              </button>
            </div>
          )}

          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 backdrop-blur-md border border-zinc-800 flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${handCount > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                <span className="font-medium text-zinc-200">
                  {handCount === 0 && 'Mencari Tangan'}
                  {handCount === 1 && '1 Tangan'}
                  {handCount >= 2 && '2 Tangan (Dual-Hand)'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono border-l border-zinc-800 pl-2">{fps} FPS</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMirror(!isMirror)}
                title="Cermin Kamera"
                className={`p-2 rounded-lg bg-zinc-900/90 backdrop-blur-md border border-zinc-800 transition ${isMirror ? 'text-emerald-400 border-zinc-700' : 'text-zinc-400'}`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleToggleCameraFacing}
                title="Ganti Kamera"
                className="p-2 rounded-lg bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <CameraIcon className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                title="Suara"
                className="p-2 rounded-lg bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white transition"
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#121215] px-4 py-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Users className="w-3.5 h-3.5 text-zinc-400" /> SIBI (1 Tangan) & BISINDO (2 Tangan)
          </span>
          <button
            onClick={() => setShowQuickGuide(true)}
            className="text-zinc-300 hover:text-white flex items-center gap-1 text-[11px]"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Panduan
          </button>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Hasil Deteksi Real-Time
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Auto Tambah:</span>
              <button
                onClick={() => setIsAutoAppend(!isAutoAppend)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                  isAutoAppend ? 'bg-emerald-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isAutoAppend ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3 min-h-[64px]">
            {detectedGesture ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-emerald-400 flex-shrink-0">
                    {detectedGesture.gesture}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {detectedGesture.label}
                      </span>
                      {detectedGesture.category && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 flex-shrink-0">
                          {detectedGesture.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {detectedGesture.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAppendSymbol(detectedGesture.gesture)}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-semibold transition flex items-center gap-1 flex-shrink-0 active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <HandMetal className="w-4 h-4 text-zinc-600" />
                <span>Posisikan isyarat tangan di depan kamera</span>
              </div>
            )}
          </div>

          {isAutoAppend && (
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full transition-all duration-75"
                style={{ width: `${gestureProgress * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Kotak Kalimat Terjemahan
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {sentence.trim().length} Karakter
            </span>
          </div>

          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-3 min-h-[90px] flex-1 flex flex-col justify-between">
            <p className="text-xs font-medium text-white tracking-wide break-words leading-relaxed font-mono">
              {sentence ? (
                <>
                  {sentence}
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />
                </>
              ) : (
                <span className="text-zinc-600 italic font-sans font-normal text-xs">
                  Kata dan huruf terjemahan akan tersusun di sini...
                </span>
              )}
            </p>

            {sentence && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSpeak}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Play className="w-3 h-3 fill-current" /> Suarakan
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              onClick={handleAddSpace}
              className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition active:scale-95"
            >
              <Space className="w-3.5 h-3.5 text-zinc-400" />
              <span>Spasi</span>
            </button>

            <button
              onClick={handleBackspace}
              disabled={!sentence}
              className="py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 border border-zinc-700/80 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition active:scale-95"
            >
              <Delete className="w-3.5 h-3.5 text-zinc-400" />
              <span>Hapus</span>
            </button>

            <button
              onClick={handleClearSentence}
              disabled={!sentence}
              className="py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-400 hover:text-white border border-zinc-700/80 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition active:scale-95"
              title="Bersihkan"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSaveToHistory}
              disabled={!sentence.trim()}
              className="py-2 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </div>

        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-400 text-[11px]">Dukungan 1 & 2 Tangan:</span>
            <button
              onClick={onNavigateToDictionary}
              className="text-zinc-300 hover:text-white text-[11px]"
            >
              Buka Kamus →
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {['A', 'B', 'C', 'V', 'L', 'O', 'Y', 'I', 'TERIMA KASIH (2 Tangan)', 'SAMA-SAMA (2 Tangan)', 'HALO', 'MANTAP', 'CINTA (2 Tangan)', 'OKE'].map(code => (
              <span
                key={code}
                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Tersimpan di Riwayat</span>
        </div>
      )}

      {showQuickGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" /> Panduan Gestur
              </h3>
              <button
                onClick={() => setShowQuickGuide(false)}
                className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
            <div className="text-xs text-zinc-300 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-2.5 rounded-lg bg-[#18181b] border border-zinc-800">
                <strong className="text-white block mb-0.5">Terima Kasih (2 Tangan / BISINDO):</strong>
                Buka kedua telapak tangan mendatar sejajar di depan dada, gerakkan maju perlahan.
              </div>
              <div className="p-2.5 rounded-lg bg-[#18181b] border border-zinc-800">
                <strong className="text-white block mb-0.5">Sama-Sama (2 Tangan / BISINDO):</strong>
                Satukan kedua telapak tangan menangkup di depan dada.
              </div>
              <div className="p-2.5 rounded-lg bg-[#18181b] border border-zinc-800">
                <strong className="text-white block mb-0.5">Cinta / Hati (2 Tangan):</strong>
                Satukan kedua tangan membentuk lekukan lambang hati.
              </div>
              <div className="p-2.5 rounded-lg bg-[#18181b] border border-zinc-800">
                <strong className="text-white block mb-0.5">Huruf A, B, C, V, L, O, Y, I (SIBI):</strong>
                Gunakan 1 tangan sesuai alfabet baku isyarat.
              </div>
            </div>
            <button
              onClick={() => {
                setShowQuickGuide(false);
                onNavigateToDictionary();
              }}
              className="w-full py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-semibold text-center"
            >
              Buka Kamus Isyarat Lengkap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
