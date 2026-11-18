export function dist2D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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

    const isExtendedRatio = tipToWrist > pipToWrist * 1.2 && tipToWrist > mcpToWrist * 1.3;
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

  const isThumbPointingUp = thumbTip.y < thumbIP.y - (palmHeight * 0.1) &&
                            thumbTip.y < thumbMCP.y - (palmHeight * 0.2) &&
                            thumbTip.y < indexMCP.y;

  const thumbDistFromIndex = dist2D(thumbTip, indexMCP);
  const isThumbOutward = thumbDistFromIndex > palmWidth * 0.75;
  const isThumbTucked = dist2D(thumbTip, middleMCP) < palmWidth * 0.65 || thumbDistFromIndex < palmWidth * 0.6;
  const isThumbBesideIndex = dist2D(thumbTip, indexPIP) < palmHeight * 0.4 &&
                             thumbTip.y < indexMCP.y + (palmHeight * 0.1) &&
                             !isThumbOutward;

  const distThumbIndex = dist2D(thumbTip, indexTip);
  const distIndexMiddle = dist2D(indexTip, middleTip);
  const distMiddleRing = dist2D(middleTip, ringTip);
  const distRingPinky = dist2D(ringTip, pinkyTip);
  const distThumbPinky = dist2D(thumbTip, pinkyTip);

  const isTipsPunchedTogether = 
    distThumbIndex < palmHeight * 0.35 &&
    distIndexMiddle < palmHeight * 0.28 &&
    distMiddleRing < palmHeight * 0.28;

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
    },
    isTipsPunchedTogether
  };
}

export function classifyTwoHandsGesture(hand1Lm, hand2Lm) {
  const h1 = analyzeHand(hand1Lm);
  const h2 = analyzeHand(hand2Lm);
  if (!h1 || !h2) return null;

  const distWrists = dist2D(h1.wrist, h2.wrist);
  const distThumbTips = dist2D(h1.thumb.tip, h2.thumb.tip);
  const distIndexTips = dist2D(h1.lm[8], h2.lm[8]);
  const distMiddleTips = dist2D(h1.lm[12], h2.lm[12]);

  if (
    h1.thumb.isPointingUp && h1.counts.curledCount >= 3 &&
    h2.thumb.isPointingUp && h2.counts.curledCount >= 3
  ) {
    return {
      gesture: 'MANTAP',
      label: 'Mantap',
      confidence: 0.98,
      category: 'BISINDO (2 Tangan)',
      description: 'Kedua ibu jari mengacung ke atas'
    };
  }

  if (
    distThumbTips < 0.18 &&
    distIndexTips < 0.20 &&
    Math.abs(h1.wrist.y - h2.wrist.y) < 0.25
  ) {
    return {
      gesture: 'CINTA',
      label: 'Cinta / Hati',
      confidence: 0.96,
      category: 'BISINDO (2 Tangan)',
      description: 'Kedua tangan membentuk simbol hati'
    };
  }

  if (
    distWrists < 0.35 &&
    distMiddleTips < 0.25 &&
    h1.counts.extendedCount >= 3 &&
    h2.counts.extendedCount >= 3
  ) {
    return {
      gesture: 'SAMA-SAMA',
      label: 'Sama-Sama',
      confidence: 0.95,
      category: 'BISINDO (2 Tangan)',
      description: 'Kedua telapak tangan menangkup di depan dada'
    };
  }

  if (
    h1.counts.extendedCount >= 3 &&
    h2.counts.extendedCount >= 3 &&
    Math.abs(h1.wrist.y - h2.wrist.y) < 0.22 &&
    distWrists > 0.25 && distWrists < 0.65
  ) {
    return {
      gesture: 'TERIMA KASIH',
      label: 'Terima Kasih',
      confidence: 0.94,
      category: 'BISINDO (2 Tangan)',
      description: 'Kedua telapak tangan terbuka menyapu ke depan'
    };
  }

  if (
    h1.counts.extendedCount === 4 && h1.thumb.isOutward &&
    h2.counts.extendedCount === 4 && h2.thumb.isOutward
  ) {
    return {
      gesture: 'HALO',
      label: 'Halo',
      confidence: 0.95,
      category: 'BISINDO (2 Tangan)',
      description: 'Kedua telapak tangan terbuka menyapa'
    };
  }

  return null;
}

export function classifySingleHandGesture(landmarks) {
  const analysis = analyzeHand(landmarks);
  if (!analysis) {
    return { gesture: null, confidence: 0, label: 'Tangan tidak terdeteksi' };
  }

  const { index, middle, ring, pinky, thumb, counts, distances, palmHeight, palmWidth, lm, isTipsPunchedTogether } = analysis;
  const { extendedCount, curledCount } = counts;

  if (
    isTipsPunchedTogether &&
    lm[8].y < 0.52 &&
    !thumb.isPointingUp
  ) {
    return {
      gesture: 'MAKAN',
      label: 'Makan',
      confidence: 0.94,
      category: 'Aktivitas (BISINDO)',
      description: 'Ujung-ujung jari menguncup mengarah ke dekat mulut'
    };
  }

  if (
    curledCount >= 3 &&
    extendedCount === 0 &&
    thumb.isPointingUp &&
    thumb.tip.y < lm[6].y - (palmHeight * 0.15)
  ) {
    return {
      gesture: 'MANTAP',
      label: 'Mantap',
      confidence: 0.95,
      category: 'Ekspresi',
      description: 'Ibu jari mengacung ke atas'
    };
  }

  if (
    extendedCount === 4 &&
    thumb.isTucked
  ) {
    return {
      gesture: 'B',
      label: 'Huruf B',
      confidence: 0.94,
      category: 'Alfabet',
      description: 'Empat jari tegak lurus, ibu jari terlipat di telapak'
    };
  }

  if (
    extendedCount === 4 &&
    thumb.isOutward &&
    distances.distIndexMiddle > palmWidth * 0.22
  ) {
    return {
      gesture: 'HALO',
      label: 'Halo',
      confidence: 0.94,
      category: 'Sapaan',
      description: 'Lima jari terbuka ke arah kamera'
    };
  }

  if (
    index.isExtended &&
    pinky.isExtended &&
    middle.isCurled &&
    ring.isCurled &&
    thumb.isOutward
  ) {
    return {
      gesture: 'I LOVE YOU',
      label: 'I Love You',
      confidence: 0.95,
      category: 'Ekspresi',
      description: 'Jempol, telunjuk, dan kelingking terbuka'
    };
  }

  if (
    index.isExtended &&
    middle.isExtended &&
    ring.isCurled &&
    pinky.isCurled &&
    distances.distIndexMiddle > palmWidth * 0.2
  ) {
    return {
      gesture: 'V',
      label: 'Huruf V',
      confidence: 0.94,
      category: 'Alfabet',
      description: 'Telunjuk dan jari tengah membentuk huruf V'
    };
  }

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
      description: 'Telunjuk dan ibu jari menyiku 90°'
    };
  }

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
      description: 'Ibu jari dan kelingking terentang keluar'
    };
  }

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
      description: 'Jari kelingking tegak ke atas'
    };
  }

  if (
    middle.isExtended &&
    ring.isExtended &&
    pinky.isExtended &&
    distances.distThumbIndex < palmHeight * 0.35
  ) {
    return {
      gesture: 'OKE',
      label: 'Oke',
      confidence: 0.92,
      category: 'Ekspresi',
      description: 'Ujung jempol dan telunjuk bersentuhan lingkaran'
    };
  }

  if (
    distances.distThumbIndex < palmHeight * 0.28 &&
    distances.distThumbPinky < palmHeight * 0.45 &&
    extendedCount <= 1 &&
    !isTipsPunchedTogether
  ) {
    return {
      gesture: 'O',
      label: 'Huruf O',
      confidence: 0.88,
      category: 'Alfabet',
      description: 'Ujung jari melengkung bertemu ibu jari'
    };
  }

  if (
    distances.distThumbIndex > palmHeight * 0.28 &&
    distances.distThumbIndex < palmHeight * 0.65 &&
    !index.isExtended && !middle.isExtended && !ring.isExtended && !pinky.isExtended &&
    !thumb.isPointingUp
  ) {
    if (lm[8].y < 0.45) {
      return {
        gesture: 'MINUM',
        label: 'Minum',
        confidence: 0.91,
        category: 'Aktivitas (BISINDO)',
        description: 'Tangan melengkung seperti memegang cangkir di dekat mulut'
      };
    }
    return {
      gesture: 'C',
      label: 'Huruf C',
      confidence: 0.85,
      category: 'Alfabet',
      description: 'Jari melengkung membentuk siluet C'
    };
  }

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
      description: 'Kepalan tangan dengan jempol di sisi telunjuk'
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

export function classifyMultiHands(multiHandLandmarks) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return { gesture: null, confidence: 0, label: 'Tangan tidak terdeteksi' };
  }

  if (multiHandLandmarks.length >= 2) {
    const twoHandResult = classifyTwoHandsGesture(multiHandLandmarks[0], multiHandLandmarks[1]);
    if (twoHandResult) {
      return twoHandResult;
    }
  }

  return classifySingleHandGesture(multiHandLandmarks[0]);
}

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
