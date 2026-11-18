/**
 * ============================================================================
 * MESIN PENGENALAN GESTUR BAHASA ISYARAT (ACCURATE RULE-BASED PATTERN MATCHING)
 * ============================================================================
 * Menggunakan 21 Titik Landmark Tangan MediaPipe Hands:
 * 
 *  0: WRIST (Pergelangan tangan)
 *  1-4: THUMB (1: CMC, 2: MCP, 3: IP, 4: TIP)
 *  5-8: INDEX (5: MCP, 6: PIP, 7: DIP, 8: TIP)
 *  9-12: MIDDLE (9: MCP, 10: PIP, 11: DIP, 12: TIP)
 *  13-16: RING (13: MCP, 14: PIP, 15: DIP, 16: TIP)
 *  17-20: PINKY (17: MCP, 18: PIP, 19: DIP, 20: TIP)
 */

export function dist2D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function dist3D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Menganalisis kondisi geometris tangan secara presisi
 * Menggunakan normalisasi skala terhadap ukuran telapak tangan (Wrist ke Middle MCP)
 */
export function analyzeHand(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const lm = landmarks;
  const wrist = lm[0];

  // Titik kunci
  const thumbTip = lm[4];
  const thumbIP = lm[3];
  const thumbMCP = lm[2];
  const thumbCMC = lm[1];

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

  // Ukuran telapak tangan sebagai unit normalisasi standar
  const palmHeight = dist2D(wrist, middleMCP);
  const palmWidth = dist2D(indexMCP, pinkyMCP);

  if (palmHeight < 0.05) {
    // Tangan terlalu jauh atau tidak valid
    return null;
  }

  // Helper evaluasi kelurusan jari (Index, Middle, Ring, Pinky)
  // Jari benar-benar TEGAK jika jarak TIP ke Wrist lebih panjang dari PIP ke Wrist
  // dan TIP berada lebih tinggi secara signifikan dari DIP dan PIP
  const checkFingerExtension = (tip, dip, pip, mcp) => {
    const tipToWrist = dist2D(tip, wrist);
    const pipToWrist = dist2D(pip, wrist);
    const mcpToWrist = dist2D(mcp, wrist);

    // Rasio ekstensi terhadap pergelangan
    const isExtendedRatio = tipToWrist > pipToWrist * 1.25 && tipToWrist > mcpToWrist * 1.35;
    
    // Apakah ujung jari terlipat ke arah telapak?
    const tipToMcp = dist2D(tip, mcp);
    const pipToMcp = dist2D(pip, mcp);
    const isCurled = tipToMcp < pipToMcp * 0.95 || tipToWrist < pipToWrist * 1.05;

    // Evaluasi posisi vertikal (tip lebih tinggi dari pip)
    const isHigherThanPip = tip.y < pip.y;

    return {
      isExtended: isExtendedRatio && isHigherThanPip,
      isCurled: isCurled,
      tipToWrist,
      pipToWrist
    };
  };

  const indexState = checkFingerExtension(indexTip, indexDIP, indexPIP, indexMCP);
  const middleState = checkFingerExtension(middleTip, middleDIP, middlePIP, middleMCP);
  const ringState = checkFingerExtension(ringTip, ringDIP, ringPIP, ringMCP);
  const pinkyState = checkFingerExtension(pinkyTip, pinkyDIP, pinkyPIP, pinkyMCP);

  // Analisis Ibu Jari (Thumb)
  // 1. Thumb Upright (Thumbs up / Mantap)
  const isThumbPointingUp = thumbTip.y < thumbIP.y - (palmHeight * 0.1) &&
                            thumbTip.y < thumbMCP.y - (palmHeight * 0.2) &&
                            thumbTip.y < indexMCP.y;

  // 2. Thumb Extended Sideways (L, Y, ILY)
  const thumbDistFromIndex = dist2D(thumbTip, indexMCP);
  const isThumbOutward = thumbDistFromIndex > palmWidth * 0.7;

  // 3. Thumb Tucked across palm (Huruf B, dll)
  const thumbDistFromPalmCenter = dist2D(thumbTip, middleMCP);
  const isThumbTucked = thumbDistFromPalmCenter < palmWidth * 0.55;

  // 4. Thumb Resting beside index (Huruf A)
  const thumbBesideIndex = dist2D(thumbTip, indexPIP) < palmHeight * 0.4 &&
                           thumbTip.y < indexMCP.y + (palmHeight * 0.1) &&
                           !isThumbOutward;

  // Jarak antar ujung jari
  const distThumbIndex = dist2D(thumbTip, indexTip);
  const distIndexMiddle = dist2D(indexTip, middleTip);
  const distMiddleRing = dist2D(middleTip, ringTip);
  const distRingPinky = dist2D(ringTip, pinkyTip);
  const distThumbPinky = dist2D(thumbTip, pinkyTip);

  // Jumlah 4 jari utama yang tegak
  const extendedCount = 
    (indexState.isExtended ? 1 : 0) + 
    (middleState.isExtended ? 1 : 0) + 
    (ringState.isExtended ? 1 : 0) + 
    (pinkyState.isExtended ? 1 : 0);

  // Jumlah jari yang terlipat erat
  const curledCount = 
    (indexState.isCurled ? 1 : 0) + 
    (middleState.isCurled ? 1 : 0) + 
    (ringState.isCurled ? 1 : 0) + 
    (pinkyState.isCurled ? 1 : 0);

  return {
    lm,
    palmHeight,
    palmWidth,
    wrist,
    index: indexState,
    middle: middleState,
    ring: ringState,
    pinky: pinkyState,
    thumb: {
      tip: thumbTip,
      isPointingUp: isThumbPointingUp,
      isOutward: isThumbOutward,
      isTucked: isThumbTucked,
      isBesideIndex: thumbBesideIndex
    },
    counts: {
      extendedCount,
      curledCount
    },
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
 * Mengklasifikasikan gestur tangan berdasarkan aturan geometris yang ketat dan akurat
 */
export function classifyHandGesture(landmarks) {
  const analysis = analyzeHand(landmarks);
  if (!analysis) {
    return { gesture: null, confidence: 0, label: 'Tangan tidak terdeteksi' };
  }

  const { index, middle, ring, pinky, thumb, counts, distances, palmHeight, palmWidth, lm } = analysis;
  const { extendedCount, curledCount } = counts;

  // ==========================================================================
  // 1. KATA 'MANTAP' / THUMBS UP
  // Syarat KETAT: 4 jari (telunjuk-kelingking) HARUS tertekuk rapat ke telapak,
  // dan HANYA ibu jari yang tegak lurus ke atas dengan ujung lebih tinggi dari kepalan.
  // ==========================================================================
  if (
    curledCount >= 3 &&
    extendedCount === 0 &&
    thumb.isPointingUp &&
    thumb.tip.y < lm[6].y - (palmHeight * 0.15)
  ) {
    return {
      gesture: 'MANTAP',
      label: 'Mantap / Bagus',
      confidence: 0.95,
      category: 'Ekspresi',
      description: 'Ibu jari mengacung tegak ke atas (Jempol/Mantap)'
    };
  }

  // ==========================================================================
  // 2. KATA 'HALO' / SAPAAN
  // Syarat KETAT: Seluruh 5 jari tangan terbuka tegak ke atas menghadap kamera,
  // jarak antar jari merenggang wajar (bukan merapat seperti Huruf B).
  // ==========================================================================
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

  // ==========================================================================
  // 3. KATA 'I LOVE YOU' (ILY Sign)
  // Syarat: Ibu Jari, Telunjuk, dan Kelingking TEGAK; Tengah & Manis TERTEKUK RAPAT.
  // ==========================================================================
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

  // ==========================================================================
  // 4. HURUF 'V' (Peace Sign)
  // Syarat: Telunjuk & Jari Tengah lurus tegak terbuka memisah sudut V,
  // Jari Manis & Kelingking tertekuk rapat.
  // ==========================================================================
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

  // ==========================================================================
  // 5. HURUF 'L'
  // Syarat: Telunjuk tegak lurus ke atas, Ibu Jari terbuka 90 derajat ke samping,
  // Jari Tengah, Manis, dan Kelingking terlipat ke telapak.
  // ==========================================================================
  if (
    index.isExtended &&
    thumb.isOutward &&
    middle.isCurled &&
    ring.isCurled &&
    pinky.isCurled &&
    !pinky.isExtended
  ) {
    return {
      gesture: 'L',
      label: 'Huruf L',
      confidence: 0.93,
      category: 'Alfabet',
      description: 'Telunjuk tegak ke atas dan ibu jari menyiku 90° (Huruf L)'
    };
  }

  // ==========================================================================
  // 6. HURUF 'B'
  // Syarat: Keempat jari (telunjuk, tengah, manis, kelingking) tegak lurus RAPAT,
  // Ibu jari ditekuk melintang di depan telapak tangan.
  // ==========================================================================
  if (
    extendedCount === 4 &&
    distances.distIndexMiddle < palmWidth * 0.35 &&
    distances.distMiddleRing < palmWidth * 0.35 &&
    distances.distRingPinky < palmWidth * 0.35 &&
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

  // ==========================================================================
  // 7. HURUF 'Y' (Shaka / Telepon)
  // Syarat: HANYA Ibu Jari dan Kelingking yang terbuka lebar ke luar,
  // 3 jari tengah (telunjuk, tengah, manis) tertekuk erat.
  // ==========================================================================
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

  // ==========================================================================
  // 8. HURUF 'I'
  // Syarat: HANYA Kelingking yang tegak lurus ke atas,
  // Telunjuk, Tengah, Manis tertekuk erat, dan Ibu Jari tidak terentang.
  // ==========================================================================
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

  // ==========================================================================
  // 9. KATA 'OKE'
  // Syarat: Ujung Jempol dan Telunjuk saling bersentuhan membentuk bulatan,
  // Jari Tengah, Manis, dan Kelingking tegak lurus ke atas.
  // ==========================================================================
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

  // ==========================================================================
  // 10. HURUF 'O'
  // Syarat: Ujung jari melengkung bertemu atau sangat dekat dengan ujung ibu jari.
  // ==========================================================================
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
      description: 'Ujung semua jari melengkung bertemu ibu jari membentuk lingkaran'
    };
  }

  // ==========================================================================
  // 11. HURUF 'C'
  // Syarat: Jari-jari melengkung setengah lingkaran dengan celah terbuka antara jempol dan telunjuk.
  // ==========================================================================
  if (
    distances.distThumbIndex > palmHeight * 0.28 &&
    distances.distThumbIndex < palmHeight * 0.65 &&
    !index.isExtended &&
    !middle.isExtended &&
    !ring.isExtended &&
    !pinky.isExtended &&
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

  // ==========================================================================
  // 12. HURUF 'A'
  // Syarat: 4 jari terlipat rapat (kepalan), Ibu Jari berdiri tegak menempel di sisi telunjuk
  // (bukan mengacung tinggi seperti Mantap/Thumbs Up).
  // ==========================================================================
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

  // ==========================================================================
  // 13. KATA 'TERIMA KASIH'
  // Syarat: 4 jari rapat mendatar dengan orientasi telapak tangan condong ke arah dada/lawan bicara.
  // ==========================================================================
  if (
    extendedCount >= 3 &&
    Math.abs(analysis.lm[8].y - analysis.lm[20].y) < palmHeight * 0.28 &&
    distances.distIndexMiddle < palmWidth * 0.3
  ) {
    return {
      gesture: 'TERIMA KASIH',
      label: 'Terima Kasih',
      confidence: 0.86,
      category: 'Kata',
      description: 'Empat jari lurus rapat mendatar menyapa sopan'
    };
  }

  return {
    gesture: null,
    label: 'Menganalisis Gestur...',
    confidence: 0.2,
    category: null,
    description: 'Bentuk posisi tangan sesuai panduan di kamus'
  };
}

/**
 * Filter Stabilizer Gestur Anti-Flicker
 * Memerlukan penahanan gestur selama N frame sebelum dikunci
 */
export class GestureStabilizer {
  constructor(requiredHoldFrames = 25, confidenceThreshold = 0.85) {
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
      // Kunci gestur dan aktifkan cooldown 1.5 detik agar tidak berulang terus-menerus
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
