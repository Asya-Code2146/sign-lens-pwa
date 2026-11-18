/**
 * ============================================================================
 * MODUL TEXT-TO-SPEECH (TTS) NATIVE BROWSER
 * ============================================================================
 * Menggunakan Web Speech API bawaan peramban (100% offline, tanpa kuota API)
 * Dioptimalkan untuk suara Bahasa Indonesia (id-ID)
 */

export function speakText(text, onEnd = null) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API tidak didukung di browser ini.');
    return false;
  }

  // Batalkan suara sebelumnya yang masih berjalan
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) return false;

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'id-ID';
  utterance.rate = 0.95; // Kecepatan bicara natural
  utterance.pitch = 1.0;

  // Pilih suara Bahasa Indonesia jika tersedia di peramban
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('Indonesian'));
  if (idVoice) {
    utterance.voice = idVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
