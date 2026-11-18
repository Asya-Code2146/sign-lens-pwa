/**
 * ============================================================================
 * MESIN PENGENALAN GESTUR BAHASA ISYARAT (RULE-BASED PATTERN MATCHING)
 * ============================================================================
 * Menggunakan 21 Titik Landmark Tangan dari Google MediaPipe Hands:
 * 
 *  0: WRIST (Pergelangan tangan)
 *  1-4: THUMB (Ibu jari: CMC, MCP, IP, TIP)
 *  5-8: INDEX (Telunjuk: MCP, PIP, DIP, TIP)
 *  9-12: MIDDLE (Jari tengah: MCP, PIP, DIP, TIP)
 *  13-16: RING (Jari manis: MCP, PIP, DIP, TIP)
 *  17-20: PINKY (Kelingking: MCP, PIP, DIP, TIP)
 * 
 * 100% Client-Side AI tanpa API Key eksternal!
 */

/**
 * Menghitung jarak Euclidean 2D antara dua titik landmark
 */
export function calculateDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Menghitung jarak Euclidean 3D (memanfaatkan sumbu z untuk kedalaman tangan)
 */
export function calculateDistance3D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Menghitung sudut (dalam derajat) antara 3 titik: p1 - pCenter - p2
 */
export function calculateAngle(p1, pCenter, p2) {
  const v1 = { x: p1.x - pCenter.x, y: p1.y - pCenter.y };
  const v2 = { x: p2.x - pCenter.x, y: p2.y - pCenter.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Menganalisis status keterbukaan/tekukan setiap jari
 * @param {Array} lm - 21 array landmark tangan
 * @returns {Object} status ekstensi jari, jarak, dan orientasi
 */
export function analyzeHandLandmarks(lm) {
  if (!lm || lm.length < 21) return null;

  const wrist = lm[0];
  
  // Titik ujung (TIP) & Titik sendi tengah (PIP / IP) & Pangkal (MCP)
  const thumbTip = lm[4];
  const thumbIP = lm[3];
  const thumbMCP = lm[2];

  const indexTip = lm[8];
  const indexDIP = lm[7];
  const indexPIP = lm[6];
  const indexMCP = lm[5];

  const middleTip = lm[12];
  const middlePIP = lm[10];
  const middleMCP = lm[9];

  const ringTip = lm[16];
  const ringPIP = lm[14];
  const ringMCP = lm[13];

  const pinkyTip = lm[20];
  const pinkyPIP = lm[18];
  const pinkyMCP = lm[17];

  // Skala ukuran telapak tangan sebagai acuan normalisasi jarak
  const palmSize = calculateDistance(wrist, middleMCP);

  // Status Ekstensi Jari Telunjuk, Tengah, Manis, Kelingking
  // Jari dianggap TEGAK (extended) jika jarak Tip ke Wrist lebih jauh dari PIP ke Wrist
  // dan posisi y Tip berada di atas posisi PIP (pada kanvas orientasi tegak)
  const isIndexExtended = 
    calculateDistance(indexTip, wrist) > calculateDistance(indexPIP, wrist) * 1.15 &&
    indexTip.y < indexPIP.y;

  const isMiddleExtended = 
    calculateDistance(middleTip, wrist) > calculateDistance(middlePIP, wrist) * 1.15 &&
    middleTip.y < middlePIP.y;

  const isRingExtended = 
    calculateDistance(ringTip, wrist) > calculateDistance(ringPIP, wrist) * 1.15 &&
    ringTip.y < ringPIP.y;

  const isPinkyExtended = 
    calculateDistance(pinkyTip, wrist) > calculateDistance(pinkyPIP, wrist) * 1.15 &&
    pinkyTip.y < pinkyPIP.y;

  // Analisis Ibu Jari (Thumb):
  // Ibu jari tegak ke atas (untuk Thumbs Up / Huruf A)
  const isThumbUp = thumbTip.y < thumbIP.y && thumbTip.y < thumbMCP.y;
  
  // Ibu jari merentang ke samping (extended outward)
  const isThumbExtendedOutward = 
    calculateDistance(thumbTip, indexMCP) > palmSize * 0.55 &&
    calculateDistance(thumbTip, pinkyMCP) > palmSize * 0.7;

  // Ibu jari terlipat di depan telapak tangan (tucked in)
  const isThumbTucked = calculateDistance(thumbTip, middleMCP) < palmSize * 0.5;

  // Jarak antar ujung jari penting
  const distThumbIndex = calculateDistance(thumbTip, indexTip);
  const distIndexMiddle = calculateDistance(indexTip, middleTip);
  const distMiddleRing = calculateDistance(middleTip, ringTip);
  const distRingPinky = calculateDistance(ringTip, pinkyTip);
  const distThumbPinky = calculateDistance(thumbTip, pinkyTip);

  // Jumlah 4 jari utama yang tegak
  const extendedFingersCount = 
    (isIndexExtended ? 1 : 0) + 
    (isMiddleExtended ? 1 : 0) + 
    (isRingExtended ? 1 : 0) + 
    (isPinkyExtended ? 1 : 0);

  return {
    lm,
    palmSize,
    wrist,
    fingers: {
      thumb: { tip: thumbTip, isUp: isThumbUp, isOutward: isThumbExtendedOutward, isTucked: isThumbTucked },
      index: { tip: indexTip, isExtended: isIndexExtended },
      middle: { tip: middleTip, isExtended: isMiddleExtended },
      ring: { tip: ringTip, isExtended: isRingExtended },
      pinky: { tip: pinkyTip, isExtended: isPinkyExtended },
    },
    counts: {
      extendedFingersCount,
      allFiveExtended: extendedFingersCount === 4 && isThumbExtendedOutward
    },
    distances: {
      distThumbIndex,
      distIndexMiddle,
      distMiddleRing,
      distRingPinky,
      distThumbPinky,
    }
  };
}

/**
 * Klasifikasi Gestur berdasarkan Heuristik Geometris Landmark Tangan
 * Menghasilkan objek { gesture, confidence, description, label }
 */
export function classifyHandGesture(landmarks) {
  const analysis = analyzeHandLandmarks(landmarks);
  if (!analysis) {
    return { gesture: null, confidence: 0, label: 'Tangan tidak terdeteksi' };
  }

  const { fingers, counts, distances, palmSize, lm } = analysis;
  const { thumb, index, middle, ring, pinky } = fingers;
  const { extendedFingersCount, allFiveExtended } = counts;

  // --------------------------------------------------------------------------
  // 1. KATA 'HALO' / Sapaan (Semua 5 jari terbuka tegak menghadap kamera)
  // --------------------------------------------------------------------------
  if (
    extendedFingersCount === 4 &&
    thumb.isOutward &&
    distances.distIndexMiddle > palmSize * 0.12
  ) {
    return {
      gesture: 'HALO',
      label: 'Halo / Hai',
      confidence: 0.94,
      category: 'Kata',
      description: 'Kelima jari terbuka penuh menghadap kamera (Sapaan Halo)'
    };
  }

  // --------------------------------------------------------------------------
  // 2. KATA 'MANTAP' / THUMBS UP (Semua 4 jari ditekuk, ibu jari mengacung ke atas)
  // --------------------------------------------------------------------------
  if (
    extendedFingersCount === 0 &&
    thumb.isUp &&
    thumb.tip.y < lm[0].y - palmSize * 0.4
  ) {
    return {
      gesture: 'MANTAP',
      label: 'Mantap / Bagus',
      confidence: 0.96,
      category: 'Ekspresi',
      description: 'Ibu jari tegak mengacung ke atas (Bagus / Mantap)'
    };
  }

  // --------------------------------------------------------------------------
  // 3. KATA 'I LOVE YOU' (ILY Sign: Ibu Jari, Telunjuk, Kelingking TEGAK; Tengah & Manis LIPAT)
  // --------------------------------------------------------------------------
  if (
    index.isExtended &&
    pinky.isExtended &&
    !middle.isExtended &&
    !ring.isExtended &&
    thumb.isOutward
  ) {
    return {
      gesture: 'I LOVE YOU',
      label: 'I Love You (Sayang)',
      confidence: 0.95,
      category: 'Ekspresi',
      description: 'Jempol, telunjuk, dan kelingking terbuka (Simbol Cinta ILY)'
    };
  }

  // --------------------------------------------------------------------------
  // 4. KATA 'OKE' (Ujung jempol dan telunjuk bersentuhan membentuk bulatan, 3 jari lain tegak)
  // --------------------------------------------------------------------------
  if (
    middle.isExtended &&
    ring.isExtended &&
    pinky.isExtended &&
    distances.distThumbIndex < palmSize * 0.32
  ) {
    return {
      gesture: 'OKE',
      label: 'Oke / Sempurna',
      confidence: 0.92,
      category: 'Ekspresi',
      description: 'Ujung jempol & telunjuk bertaut lingkaran, jari lain tegak'
    };
  }

  // --------------------------------------------------------------------------
  // 5. HURUF 'V' (Telunjuk & Tengah tegak memisah huruf V, Manis & Kelingking terlipat)
  // --------------------------------------------------------------------------
  if (
    index.isExtended &&
    middle.isExtended &&
    !ring.isExtended &&
    !pinky.isExtended
  ) {
    return {
      gesture: 'V',
      label: 'Huruf V',
      confidence: 0.95,
      category: 'Alfabet',
      description: 'Telunjuk dan jari tengah tegak memisah membentuk huruf V (Peace)'
    };
  }

  // --------------------------------------------------------------------------
  // 6. HURUF 'L' (Telunjuk tegak ke atas, Jempol terentang 90 derajat ke samping)
  // --------------------------------------------------------------------------
  if (
    index.isExtended &&
    thumb.isOutward &&
    !middle.isExtended &&
    !ring.isExtended &&
    !pinky.isExtended
  ) {
    return {
      gesture: 'L',
      label: 'Huruf L',
      confidence: 0.94,
      category: 'Alfabet',
      description: 'Telunjuk tegak dan ibu jari terbuka membentuk sudut siku L'
    };
  }

  // --------------------------------------------------------------------------
  // 7. HURUF 'B' (Keempat jari tegak lurus rapat ke atas, Ibu jari terlipat di depan)
  // --------------------------------------------------------------------------
  if (
    extendedFingersCount === 4 &&
    distances.distIndexMiddle < palmSize * 0.35 &&
    distances.distMiddleRing < palmSize * 0.35 &&
    (thumb.isTucked || !thumb.isOutward)
  ) {
    return {
      gesture: 'B',
      label: 'Huruf B',
      confidence: 0.92,
      category: 'Alfabet',
      description: 'Empat jari lurus rapat ke atas, jempol terlipat di telapak'
    };
  }

  // --------------------------------------------------------------------------
  // 8. HURUF 'Y' (Ibu jari dan kelingking merentang ke luar, 3 jari tengah terlipat)
  // --------------------------------------------------------------------------
  if (
    pinky.isExtended &&
    thumb.isOutward &&
    !index.isExtended &&
    !middle.isExtended &&
    !ring.isExtended
  ) {
    return {
      gesture: 'Y',
      label: 'Huruf Y',
      confidence: 0.93,
      category: 'Alfabet',
      description: 'Jempol dan kelingking terbuka lebar, 3 jari tengah terlipat'
    };
  }

  // --------------------------------------------------------------------------
  // 9. HURUF 'I' (Hanya kelingking yang tegak lurus ke atas, jari lainnya tertekuk)
  // --------------------------------------------------------------------------
  if (
    pinky.isExtended &&
    !index.isExtended &&
    !middle.isExtended &&
    !ring.isExtended &&
    !thumb.isOutward
  ) {
    return {
      gesture: 'I',
      label: 'Huruf I',
      confidence: 0.91,
      category: 'Alfabet',
      description: 'Hanya jari kelingking tegak lurus ke atas'
    };
  }

  // --------------------------------------------------------------------------
  // 10. HURUF 'A' (Kepalan tangan tertutup dengan ibu jari tegak di samping telunjuk)
  // --------------------------------------------------------------------------
  if (
    extendedFingersCount === 0 &&
    !thumb.isTucked &&
    thumb.tip.y < lm[6].y // jempol berada di samping/atas sendi telunjuk
  ) {
    return {
      gesture: 'A',
      label: 'Huruf A',
      confidence: 0.88,
      category: 'Alfabet',
      description: 'Empat jari terlipat rapat, jempol tegak di sisi telunjuk'
    };
  }

  // --------------------------------------------------------------------------
  // 11. HURUF 'O' (Ujung jempol dan semua ujung jari melingkar membentuk 'O')
  // --------------------------------------------------------------------------
  if (
    distances.distThumbIndex < palmSize * 0.28 &&
    distances.distThumbPinky < palmSize * 0.55 &&
    extendedFingersCount <= 2
  ) {
    return {
      gesture: 'O',
      label: 'Huruf O',
      confidence: 0.86,
      category: 'Alfabet',
      description: 'Ujung jari melengkung bertemu ibu jari membentuk lingkaran O'
    };
  }

  // --------------------------------------------------------------------------
  // 12. HURUF 'C' (Semua jari melengkung setengah lingkaran berhadapan dengan jempol)
  // --------------------------------------------------------------------------
  if (
    distances.distThumbIndex > palmSize * 0.28 &&
    distances.distThumbIndex < palmSize * 0.65 &&
    index.tip.x !== thumb.tip.x &&
    !index.isExtended &&
    !pinky.isExtended
  ) {
    return {
      gesture: 'C',
      label: 'Huruf C',
      confidence: 0.82,
      category: 'Alfabet',
      description: 'Jari melengkung membentuk lengkungan setengah lingkaran C'
    };
  }

  // --------------------------------------------------------------------------
  // 13. KATA 'TERIMA KASIH' (Tangan mendatar miring dengan 4 jari rapat menyapa ke depan)
  // --------------------------------------------------------------------------
  if (
    extendedFingersCount >= 3 &&
    Math.abs(index.tip.y - pinky.tip.y) < palmSize * 0.35 &&
    distances.distIndexMiddle < palmSize * 0.28
  ) {
    return {
      gesture: 'TERIMA KASIH',
      label: 'Terima Kasih',
      confidence: 0.84,
      category: 'Kata',
      description: 'Empat jari rapat diarahkan dengan sopan (Terima Kasih)'
    };
  }

  return {
    gesture: null,
    label: 'Menunggu Gerakan...',
    confidence: 0.3,
    category: null,
    description: 'Posisikan tangan di depan kamera dengan gestur yang jelas'
  };
}

/**
 * Filter Peredam Jitter / Debounce Gesture Stabilizer
 * Menghindari pergantian huruf yang terlalu cepat/flicker
 */
export class GestureStabilizer {
  constructor(holdFrames = 10, confidenceThreshold = 0.8) {
    this.holdFrames = holdFrames;
    this.confidenceThreshold = confidenceThreshold;
    this.currentCandidate = null;
    this.frameCount = 0;
    this.lastEmittedGesture = null;
  }

  update(prediction) {
    if (!prediction || !prediction.gesture || prediction.confidence < this.confidenceThreshold) {
      this.frameCount = Math.max(0, this.frameCount - 1);
      return {
        stableGesture: null,
        progress: 0,
        candidate: this.currentCandidate
      };
    }

    if (prediction.gesture === this.currentCandidate) {
      this.frameCount++;
    } else {
      this.currentCandidate = prediction.gesture;
      this.frameCount = 1;
    }

    const progress = Math.min(1, this.frameCount / this.holdFrames);

    if (this.frameCount >= this.holdFrames) {
      this.lastEmittedGesture = prediction;
      return {
        stableGesture: prediction,
        progress: 1.0,
        candidate: this.currentCandidate
      };
    }

    return {
      stableGesture: null,
      progress,
      candidate: this.currentCandidate
    };
  }

  reset() {
    this.currentCandidate = null;
    this.frameCount = 0;
    this.lastEmittedGesture = null;
  }
}
