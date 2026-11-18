/**
 * ============================================================================
 * HYBRID STORAGE & DATA SYNC (LOCALSTORAGE + BACKEND EXPRESS)
 * ============================================================================
 * Menjamin aplikasi tetap 100% berfungsi saat OFFLINE (PWA) sekaligus
 * tersinkronisasi dengan database backend (/api/riwayat & /api/kamus).
 */

const LOCAL_STORAGE_KEY = 'isyaratku_riwayat_v1';
const KAMUS_CACHE_KEY = 'isyaratku_kamus_cache_v1';

/**
 * Mengambil riwayat dari localStorage
 */
export function getLocalHistory() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Gagal membaca localStorage riwayat:', err);
    return [];
  }
}

/**
 * Menyimpan riwayat ke localStorage
 */
export function setLocalHistory(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Gagal menulis ke localStorage:', err);
  }
}

/**
 * Menyimpan entri baru ke Riwayat (Hybrid: LocalStorage + Backend API)
 */
export async function saveTranslationHistory(text, source = 'Kamera Real-time') {
  if (!text || !text.trim()) return null;

  const newItem = {
    id: 'riwayat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    text: text.trim(),
    timestamp: new Date().toISOString(),
    letterCount: text.trim().length,
    source
  };

  // 1. Simpan langsung ke LocalStorage (Instan & Offline First)
  const currentLocal = getLocalHistory();
  const updated = [newItem, ...currentLocal];
  setLocalHistory(updated);

  // 2. Sinkronkan ke Backend API Express (/api/riwayat)
  try {
    if (navigator.onLine) {
      const response = await fetch('/api/riwayat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: newItem.text,
          source: newItem.source,
          letterCount: newItem.letterCount
        })
      });

      if (response.ok) {
        const json = await response.json();
        // Perbarui ID dengan yang diberikan oleh backend jika ada
        if (json.data && json.data.id) {
          newItem.id = json.data.id;
        }
      }
    }
  } catch (apiError) {
    console.warn('Gagal kirim ke backend /api/riwayat (tersimpan di lokal):', apiError.message);
  }

  return newItem;
}

/**
 * Mengambil daftar riwayat lengkap (Hybrid Fetch: coba API backend, fallback ke LocalStorage)
 */
export async function fetchTranslationHistory() {
  const localData = getLocalHistory();

  try {
    if (navigator.onLine) {
      const response = await fetch('/api/riwayat');
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          // Gabungkan data unik dari server dan lokal
          const map = new Map();
          json.data.forEach(item => map.set(item.id, item));
          localData.forEach(item => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setLocalHistory(merged);
          return merged;
        }
      }
    }
  } catch (err) {
    console.warn('API backend /api/riwayat tidak terjangkau, menggunakan lokal:', err.message);
  }

  return localData;
}

/**
 * Menghapus riwayat (per item atau bersihkan semua)
 */
export async function deleteHistoryItem(id = null) {
  let updated = [];
  if (id) {
    const localData = getLocalHistory();
    updated = localData.filter(item => item.id !== id);
    setLocalHistory(updated);
  } else {
    setLocalHistory([]);
  }

  // Coba sinkronisasi hapus ke Backend API
  try {
    if (navigator.onLine) {
      const url = id ? `/api/riwayat?id=${id}` : '/api/riwayat';
      await fetch(url, { method: 'DELETE' });
    }
  } catch (err) {
    console.warn('Gagal sinkronkan penghapusan ke API backend:', err.message);
  }

  return updated;
}

/**
 * Mengambil data Kamus Isyarat dari backend dengan fallback cerdas
 */
export async function fetchDictionaryData(fallbackJson = []) {
  try {
    // 1. Coba dari cache lokal terlebih dahulu jika offline
    const cached = localStorage.getItem(KAMUS_CACHE_KEY);

    if (navigator.onLine) {
      const response = await fetch('/api/kamus');
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          localStorage.setItem(KAMUS_CACHE_KEY, JSON.stringify(json.data));
          return json.data;
        }
      }
    }

    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Kamus fetch gagal, memakai fallback bawaan:', err.message);
  }

  // Gunakan data bawaan jika server/cache tidak ada
  return fallbackJson;
}
