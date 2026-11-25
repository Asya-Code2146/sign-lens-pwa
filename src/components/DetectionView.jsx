import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Volume2, 
  Trash2, 
  Delete, 
  Save, 
  Space, 
  Copy, 
  Check, 
  RotateCw, 
  Pause, 
  Play, 
  AlertTriangle,
  RefreshCw
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

export default function DetectionView({ signSystem, onNavigateToHistory, onNavigateToDictionary }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const stabilizerRef = useRef(new GestureStabilizer(25, 0.85));

  const [cameraFacing, setCameraFacing] = useState('user');
  const [isMirror, setIsMirror] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  const [detectedGesture, setDetectedGesture] = useState(null);
  const [confidenceRate, setConfidenceRate] = useState(92);
  const [sentence, setSentence] = useState('HALO APA KABAR');
  const [handCount, setHandCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const lastAddedRef = useRef({ symbol: null, time: 0 });

  const handleAppendSymbol = useCallback((symbol) => {
    if (!symbol) return;
    setSentence((prev) => {
      if (symbol.length > 1) {
        return prev ? `${prev} ${symbol} ` : `${symbol} `;
      }
      return prev ? `${prev}${symbol}` : symbol;
    });
    soundFX.playPop();
  }, []);

  const onResults = useCallback((results) => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
        const lineColor = idx === 0 ? '#c84b1a' : '#d97706';
        const dotColor = idx === 0 ? '#ea580c' : '#f59e0b';

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

      if (prediction.gesture) {
        setDetectedGesture(prediction);
        setConfidenceRate(Math.min(99, Math.round(prediction.confidence * 100)));

        if (stability.stableGesture) {
          const nowTime = Date.now();
          const last = lastAddedRef.current;
          if (last.symbol !== stability.stableGesture.gesture || (nowTime - last.time > 1800)) {
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
      stabilizerRef.current.reset();
    }
  }, [isMirror, cameraFacing, isPaused, handleAppendSymbol]);

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
          if (video && video.readyState >= 2 && !isProcessing && handsInstanceRef.current && !isPaused) {
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
  }, [cameraFacing, onResults, isPaused]);

  const handleToggleCameraFacing = () => {
    soundFX.playTap();
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
    setIsMirror(prev => !prev);
  };

  const handleAddSpace = () => {
    soundFX.playTap();
    setSentence(prev => (prev && !prev.endsWith(' ') ? `${prev} ` : prev));
  };

  const handleBackspace = () => {
    soundFX.playTap();
    setSentence(prev => {
      if (!prev) return '';
      if (prev.endsWith(' ')) return prev.slice(0, -1);
      return prev.slice(0, -1);
    });
  };

  const handleSpeak = () => {
    if (!sentence.trim()) return;
    speakText(sentence);
  };

  const handleCopySentence = () => {
    if (!sentence.trim()) return;
    navigator.clipboard.writeText(sentence.trim());
    soundFX.playPop();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToHistory = async () => {
    if (!sentence.trim()) return;

    try {
      await saveTranslationHistory(sentence.trim(), 'Kamera');
      soundFX.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#c84b1a', '#ea580c', '#f59e0b']
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2000);
    } catch (err) {}
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-6">
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-[#1a1614] rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-sm flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
            />

            <div className="absolute top-4 left-4 z-20">
              <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse" />
                <span>AI aktif · Mode offline</span>
              </div>
            </div>

            {handCount > 0 && (
              <div className="hidden sm:block absolute top-4 right-4 z-20">
                <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium">
                  {handCount >= 2 ? '2 Tangan terdeteksi' : 'Tangan terdeteksi'}
                </div>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#c84b1a] rounded-tl-2xl" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#c84b1a] rounded-tr-2xl" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#c84b1a] rounded-bl-2xl" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#c84b1a] rounded-br-2xl" />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {detectedGesture ? detectedGesture.gesture : 'B'}
              </span>
            </div>

            <button
              onClick={handleToggleCameraFacing}
              className="sm:hidden absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-stone-800"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {isLoadingModel && (
              <div className="absolute inset-0 bg-[#1a1614]/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center">
                <div className="w-9 h-9 rounded-full border-2 border-stone-600 border-t-[#c84b1a] animate-spin mb-3" />
                <h4 className="text-xs font-semibold text-white">Menyiapkan Kamera AI</h4>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center z-30 p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-[#ea580c] mb-2" />
                <p className="text-xs text-stone-200 mb-3">{cameraError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#c84b1a] text-white text-xs font-semibold rounded-full flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang
                </button>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center justify-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-11 h-11 rounded-full bg-white border border-[#e5dfd7] shadow-sm flex items-center justify-center text-stone-700 hover:bg-stone-50 transition"
              title={isPaused ? "Lanjutkan" : "Jeda"}
            >
              {isPaused ? <Play className="w-4 h-4 ml-0.5 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleAppendSymbol(detectedGesture ? detectedGesture.gesture : 'B')}
              className="px-6 py-2.5 rounded-full bg-[#c84b1a] hover:bg-[#b53f12] text-white font-bold text-xs shadow-sm transition active:scale-95"
            >
              Mulai terjemahkan
            </button>

            <button
              onClick={handleToggleCameraFacing}
              className="w-11 h-11 rounded-full bg-white border border-[#e5dfd7] shadow-sm flex items-center justify-center text-stone-700 hover:bg-stone-50 transition"
              title="Ganti Kamera"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-[#ede8e1] rounded-[24px] sm:rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">
                Terdeteksi sekarang
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-[#c84b1a] tracking-tight">
                {detectedGesture ? detectedGesture.gesture : 'B'}
              </span>
              <span className="text-xs text-stone-500">
                {detectedGesture ? detectedGesture.label : 'Kandidat lain: D, F'}
              </span>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-stone-700">Tingkat keyakinan</span>
                <span className="text-[#c84b1a]">{confidenceRate}%</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#c84b1a] h-full rounded-full transition-all duration-300"
                  style={{ width: `${confidenceRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#ede8e1] rounded-[24px] sm:rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-5 flex-1 min-h-[220px]">
            <div>
              <span className="text-xs font-medium text-stone-500 block mb-2">
                Kalimat
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight break-words">
                {sentence ? (
                  <>
                    {sentence}
                    <span className="inline-block w-0.5 h-6 sm:h-7 ml-0.5 bg-[#c84b1a] animate-pulse align-middle" />
                  </>
                ) : (
                  <span className="text-stone-300 font-normal text-base">
                    Hasil terjemahan akan tersusun di sini...
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={handleAddSpace}
                className="px-4 py-2 rounded-full bg-white border border-[#e5dfd7] text-stone-800 text-xs font-semibold hover:bg-stone-50 transition active:scale-95"
              >
                Spasi
              </button>

              <button
                onClick={handleBackspace}
                disabled={!sentence}
                className="px-4 py-2 rounded-full bg-white border border-[#e5dfd7] disabled:opacity-40 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition active:scale-95"
              >
                Hapus
              </button>

              <button
                onClick={handleCopySentence}
                disabled={!sentence}
                className="px-4 py-2 rounded-full bg-white border border-[#e5dfd7] disabled:opacity-40 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition active:scale-95"
              >
                {isCopied ? 'Tersalin' : 'Salin'}
              </button>

              <button
                onClick={handleSaveToHistory}
                disabled={!sentence.trim()}
                className="px-4 py-2 rounded-full bg-white border border-[#e5dfd7] disabled:opacity-40 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition active:scale-95"
              >
                Simpan
              </button>

              <button
                onClick={handleSpeak}
                disabled={!sentence.trim()}
                className="ml-auto px-5 py-2 rounded-full bg-[#c84b1a] hover:bg-[#b53f12] disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Bacakan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="fixed top-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Tersimpan di riwayat</span>
        </div>
      )}
    </div>
  );
}
