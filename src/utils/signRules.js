/**
 * ============================================================================
 * MESIN PENGENALAN GESTUR BAHASA ISYARAT (DUAL-HAND & SINGLE-HAND BISINDO/SIBI)
 * ============================================================================
 * Mendukung deteksi 1 tangan (SIBI/Alfabet) dan 2 tangan (BISINDO/Bahasa Isyarat Alami)
 * Menggunakan 21 Titik Landmark MediaPipe Hands:
 *  0: WRIST
 *  1-4: THUMB (Ibu Jari)
 *  5-8: INDEX (Telunjuk)
 *  9-12: MIDDLE (Jari Tengah)
 *  13-16: RING (Jari Manis)
 *  17-20: PINKY (Kelingking)
 */

export function dist2D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Menganalisis kondisi 1 tangan secara geometris
 */
export function analyzeHand(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const lm = landmarks;
  const wrist = lm[0];

  const thumbTip = lm[4];
  const thumbIP = lm[3];
  const thumbMCP = lm[2];

  const indexTip = lm[8];
  const indexDIP = lm[7];
  const indexPIP = lm[6];
  const indexMCP = lm[5];

  const middleTip = lm[12];
  const middleDIP = lm[11];
  const middlePIP = lm[10];
  const middleMCP = lm[9];

  const ringTip = lm[16];
  const ringDIP = lm[15];
  const ringPIP = lm[14];
  const ringMCP = lm[13];

  const pinkyTip = lm[20];
  const pinkyDIP = lm[19];
  const pinkyPIP = lm[18];
  const pinkyMCP = lm[17];

  const palmHeight = dist2D(wrist, middleMCP);
  const palmWidth = dist2D(indexMCP, pinkyMCP);

  if (palmHeight < 0.05) return null;

  const checkFingerExtension = (tip, dip, pip, mcp) => {
    const tipToWrist = dist2D(tip, wrist);
    const pipToWrist = dist2D(pip, wrist);
    const mcpToWrist = dist2D(mcp, wrist);

    const isExtendedRatio = tipToWrist > pipToWrist * 1.25 && tipToWrist > mcpToWrist * 1.35;
    const isHigherThanPip = tip.y < pip.y;

    const tipToMcp = dist2D(tip, mcp);
    const pipToMcp = dist2D(pip, mcp);
    const isCurled = tipToMcp < pipToMcp * 0.95 || tipToWrist < pipToWrist * 1.05;

    return {
      isExtended: isExtendedRatio && isHigherThanPip,
      isCurled,
      tipToWrist
    };
  };

  const indexState = checkFingerExtension(indexTip, indexDIP, indexPIP, indexMCP);
  const middleState = checkFingerExtension(middleTip, middleDIP, middlePIP, middleMCP);
  const ringState = checkFingerExtension(ringTip, ringDIP, ringPIP, ringMCP);
  const pinkyState = checkFingerExtension(pinkyTip, pinkyDIP, pinkyPIP, pinkyMCP);

  // Ibu Jari
  const isThumbPointingUp = thumbTip.y < thumbIP.y - (palmHeight * 0.1) &&
                            thumbTip.y < thumbMCP.y - (palmHeight * 0.2) &&
                            thumbTip.y < indexMCP.y;

  const thumbDistFromIndex = dist2D(thumbTip, indexMCP);
  const isThumbOutward = thumbDistFromIndex > palmWidth * 0.7;
  const isThumbTucked = dist2D(thumbTip, middleMCP) < palmWidth * 0.55;
  const isThumbBesideIndex = dist2D(thumbTip, indexPIP) < palmHeight * 0.4 &&
                             thumbTip.y < indexMCP.y + (palmHeight * 0.1) &&
                             !isThumbOutward;

  const distThumbIndex = dist2D(thumbTip, indexTip);
  const distIndexMiddle = dist2D(indexTip, middleTip);
  const distMiddleRing = dist2D(middleTip, ringTip);
  const distRingPinky = dist2D(ringTip, pinkyTip);
  const distThumbPinky = dist2D(thumbTip, pinkyTip);

  const extendedCount = 
    (indexState.isExtended ? 1 : 0) + 
    (middleState.isExtended ? 1 : 0) + 
    (ringState.isExtended ? 1 : 0) + 
    (pinkyState.isExtended ? 1 : 0);

  const curledCount = 
    (indexState.isCurled ? 1 : 0) + 
    (middleState.isCurled ? 1 : 0) + 
    (ringState.isCurled ? 1 : 0) + 
    (pinkyState.isCurled ? 1 : 0);

  return {
    lm,
    wrist,
    palmHeight,
    palmWidth,
    index: indexState,
    middle: middleState,
    ring: ringState,
    pinky: pinkyState,
    thumb: {
      tip: thumbTip,
      isPointingUp: isThumbPointingUp,
      isOutward: isThumbOutward,
      isTucked: isThumbTucked,
      isBesideIndex: isThumbBesideIndex
    },
    counts: { extendedCount, curledCount },
    distances: {
      distThumbIndex,
      distIndexMiddle,
      distMiddleRing,
      distRingPinky,
      distThumbPinky
    }
  };
}

/**
 * Klasifikasi Gestur DUA TANGAN (BISINDO & Isyarat Alami Komunitas Tuli)
 */
export function classifyTwoHandsGesture(hand1Lm, hand2Lm) {
  const h1 = analyzeHand(hand1Lm);
  const h2 = analyzeHand(hand2Lm);
  if (!h1 || !h2) return null;

  const distWrists = dist2D(h1.wrist, h2.wrist);
  const distThumbTips = dist2D(h1.thumb.tip, h2.thumb.tip);
  const distIndexTips = dist2D(h1.lm[8], h2.lm[8]);
  const distMiddleTips = dist2D(h1.lm[12], h2.lm[12]);

  // 1. DUA JEMPOL (MANTAP BANGET / BISINDO)
  if (
    h1.thumb.isPointingUp && h1.counts.curledCount >= 3 &&
    h2.thumb.isPointingUp && h2.counts.curledCount >= 3
  ) {
    return {
      gesture: 'MANTAP',
      label: 'Mantap / Dua Jempol',
      confidence: 0.98,
      category: 'Dua Tangan (BISINDO)',
      description: 'Kedua tangan mengacungkan jempol ke atas secara serentak'
    };
  }

  // 2. CINTA / BENTUK HATI (Heart Hand Sign)
  if (
    distThumbTips < 0.18 &&
    distIndexTips < 0.20 &&
    Math.abs(h1.wrist.y - h2.wrist.y) < 0.25
  ) {
    return {
      gesture: 'CINTA',
      label: 'Cinta / Lambang Hati',
      confidence: 0.96,
      category: 'Dua Tangan (BISINDO)',
      description: 'Kedua tangan menyatu membentuk lambang hati cinta'
    };
  }

  // 3. SAMA-SAMA (Kedua telapak menangkup di depan dada)
  if (
    distWrists < 0.35 &&
    distMiddleTips < 0.25 &&
    h1.counts.extendedCount >= 3 &&
    h2.counts.extendedCount >= 3
  ) {
    return {
      gesture: 'SAMA-SAMA',
      label: 'Sama-Sama / Santun',
      confidence: 0.95,
      category: 'Dua Tangan (BISINDO)',
      description: 'Kedua telapak tangan menangkup di depan dada'
    };
  }

  // 4. TERIMA KASIH (Dua Tangan BISINDO)
  if (
    h1.counts.extendedCount >= 3 &&
    h2.counts.extendedCount >= 3 &&
    Math.abs(h1.wrist.y - h2.wrist.y) < 0.22 &&
    distWrists > 0.25 && distWrists < 0.65
  ) {
    return {
      gesture: 'TERIMA KASIH',
      label: 'Terima Kasih (Dua Tangan)',
      confidence: 0.94,
      category: 'Dua Tangan (BISINDO)',
      description: 'Kedua telapak tangan terbuka datar menyapu ke depan'
    };
  }

  // 5. HALO / SELAMAT DATANG (Dua Tangan)
  if (
    h1.counts.extendedCount === 4 && h1.thumb.isOutward &&
    h2.counts.extendedCount === 4 && h2.thumb.isOutward
  ) {
    return {
      gesture: 'HALO',
      label: 'Halo / Selamat Datang',
      confidence: 0.95,
      category: 'Dua Tangan (BISINDO)',
      description: 'Kedua telapak tangan terbuka menyapa lawan bicara'
    };
  }

  return null;
}

/**
 * Klasifikasi Gestur SATU TANGAN (SIBI & Alfabet)
 */
export function classifySingleHandGesture(landmarks) {
  const analysis = analyzeHand(landmarks);
  if (!analysis) {
    return { gesture: null, confidence: 0, label: 'Tangan tidak terdeteksi' };
  }

  const { index, middle, ring, pinky, thumb, counts, distances, palmHeight, palmWidth, lm } = analysis;
  const { extendedCount, curledCount } = counts;

  // 1. MANTAP (Satu Jempol)
  if (
    curledCount >= 3 &&
    extendedCount === 0 &&
    thumb.isPointingUp &&
    thumb.tip.y < lm[6].y - (palmHeight * 0.15)
  ) {
    return {
      gesture: 'MANTAP',
      label: 'Mantap / Jempol',
      confidence: 0.95,
      category: 'Ekspresi',
      description: 'Ibu jari mengacung tegak ke atas'
    };
  }

  // 2. HALO (Satu Tangan)
  if (
    extendedCount === 4 &&
    thumb.isOutward &&
    distances.distIndexMiddle > palmWidth * 0.22 &&
    distances.distMiddleRing > palmWidth * 0.22
  ) {
    return {
      gesture: 'HALO',
      label: 'Halo / Hai',
      confidence: 0.94,
      category: 'Kata',
      description: 'Seluruh lima jari terbuka lebar menghadap kamera'
    };
  }

  // 3. I LOVE YOU (ILY Sign)
  if (
    index.isExtended &&
    pinky.isExtended &&
    middle.isCurled &&
    ring.isCurled &&
    thumb.isOutward
  ) {
    return {
      gesture: 'I LOVE YOU',
      label: 'I Love You (Sayang)',
      confidence: 0.95,
      category: 'Ekspresi',
      description: 'Jempol, telunjuk, dan kelingking terbuka (Simbol ILY)'
    };
  }

  // 4. HURUF V
  if (
    index.isExtended &&
    middle.isExtended &&
    ring.isCurled &&
    pinky.isCurled &&
    distances.distIndexMiddle > palmWidth * 0.25
  ) {
    return {
      gesture: 'V',
      label: 'Huruf V',
      confidence: 0.94,
      category: 'Alfabet',
      description: 'Telunjuk dan jari tengah tegak memisah membentuk huruf V'
    };
  }

  // 5. HURUF L
  if (
    index.isExtended &&
    thumb.isOutward &&
    middle.isCurled &&
    ring.isCurled &&
    pinky.isCurled
  ) {
    return {
      gesture: 'L',
      label: 'Huruf L',
      confidence: 0.93,
      category: 'Alfabet',
      description: 'Telunjuk tegak ke atas dan ibu jari menyiku 90° (Huruf L)'
    };
  }

  // 6. HURUF B
  if (
    extendedCount === 4 &&
    distances.distIndexMiddle < palmWidth * 0.35 &&
    distances.distMiddleRing < palmWidth * 0.35 &&
    !thumb.isOutward
  ) {
    return {
      gesture: 'B',
      label: 'Huruf B',
      confidence: 0.92,
      category: 'Alfabet',
      description: 'Empat jari tegak lurus rapat ke atas, jempol melipat di telapak'
    };
  }

  // 7. HURUF Y (Shaka)
  if (
    pinky.isExtended &&
    thumb.isOutward &&
    index.isCurled &&
    middle.isCurled &&
    ring.isCurled
  ) {
    return {
      gesture: 'Y',
      label: 'Huruf Y',
      confidence: 0.93,
      category: 'Alfabet',
      description: 'Ibu jari dan kelingking terentang keluar (Huruf Y)'
    };
  }

  // 8. HURUF I
  if (
    pinky.isExtended &&
    index.isCurled &&
    middle.isCurled &&
    ring.isCurled &&
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

  // 9. KATA OKE
  if (
    middle.isExtended &&
    ring.isExtended &&
    pinky.isExtended &&
    distances.distThumbIndex < palmHeight * 0.35
  ) {
    return {
      gesture: 'OKE',
      label: 'Oke / Sempurna',
      confidence: 0.92,
      category: 'Ekspresi',
      description: 'Ujung jempol dan telunjuk bertaut lingkaran, 3 jari lain tegak'
    };
  }

  // 10. HURUF O
  if (
    distances.distThumbIndex < palmHeight * 0.28 &&
    distances.distThumbPinky < palmHeight * 0.45 &&
    extendedCount <= 1
  ) {
    return {
      gesture: 'O',
      label: 'Huruf O',
      confidence: 0.88,
      category: 'Alfabet',
      description: 'Ujung semua jari melengkung bertemu ibu jari'
    };
  }

  // 11. HURUF C
  if (
    distances.distThumbIndex > palmHeight * 0.28 &&
    distances.distThumbIndex < palmHeight * 0.65 &&
    !index.isExtended && !middle.isExtended && !ring.isExtended && !pinky.isExtended &&
    !thumb.isPointingUp
  ) {
    return {
      gesture: 'C',
      label: 'Huruf C',
      confidence: 0.85,
      category: 'Alfabet',
      description: 'Jari melengkung membentuk siluet huruf C'
    };
  }

  // 12. HURUF A
  if (
    curledCount >= 3 &&
    extendedCount === 0 &&
    thumb.isBesideIndex &&
    !thumb.isPointingUp
  ) {
    return {
      gesture: 'A',
      label: 'Huruf A',
      confidence: 0.89,
      category: 'Alfabet',
      description: 'Kepalan tangan rapat, ibu jari tegak di samping jari telunjuk'
    };
  }

  return {
    gesture: null,
    label: 'Menganalisis Gestur...',
    confidence: 0.2,
    category: null,
    description: 'Bentuk posisi isyarat sesuai panduan kamus'
  };
}

/**
 * Entry Point Utama: Otomatis mendeteksi 1 atau 2 Tangan!
 */
export function classifyMultiHands(multiHandLandmarks) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return { gesture: null, confidence: 0, label: 'Tangan tidak terdeteksi' };
  }

  // Jika terdeteksi 2 tangan, prioritaskan isyarat dua tangan (BISINDO)
  if (multiHandLandmarks.length >= 2) {
    const twoHandResult = classifyTwoHandsGesture(multiHandLandmarks[0], multiHandLandmarks[1]);
    if (twoHandResult) {
      return twoHandResult;
    }
  }

  // Fallback: deteksi tangan pertama yang terdeteksi
  return classifySingleHandGesture(multiHandLandmarks[0]);
}

/**
 * Filter Stabilizer Anti-Flicker
 */
export class GestureStabilizer {
  constructor(requiredHoldFrames = 30, confidenceThreshold = 0.85) {
    this.requiredHoldFrames = requiredHoldFrames;
    this.confidenceThreshold = confidenceThreshold;
    this.candidateGesture = null;
    this.holdCount = 0;
    this.cooldownUntil = 0;
  }

  update(prediction) {
    const now = Date.now();
    if (now < this.cooldownUntil) {
      return {
        stableGesture: null,
        progress: 0,
        candidate: null,
        isCooldown: true
      };
    }

    if (!prediction || !prediction.gesture || prediction.confidence < this.confidenceThreshold) {
      this.holdCount = Math.max(0, this.holdCount - 2);
      if (this.holdCount === 0) {
        this.candidateGesture = null;
      }
      return {
        stableGesture: null,
        progress: this.holdCount / this.requiredHoldFrames,
        candidate: this.candidateGesture,
        isCooldown: false
      };
    }

    if (prediction.gesture === this.candidateGesture) {
      this.holdCount++;
    } else {
      this.candidateGesture = prediction.gesture;
      this.holdCount = 1;
    }

    const progress = Math.min(1.0, this.holdCount / this.requiredHoldFrames);

    if (this.holdCount >= this.requiredHoldFrames) {
      this.cooldownUntil = now + 1500;
      this.holdCount = 0;
      return {
        stableGesture: prediction,
        progress: 1.0,
        candidate: this.candidateGesture,
        isCooldown: false
      };
    }

    return {
      stableGesture: null,
      progress,
      candidate: this.candidateGesture,
      isCooldown: false
    };
  }

  reset() {
    this.candidateGesture = null;
    this.holdCount = 0;
  }
}
