const LOCAL_STORAGE_KEY = 'isyaratku_riwayat_v1';
const KAMUS_CACHE_KEY = 'isyaratku_kamus_cache_v1';

export function getLocalHistory() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function setLocalHistory(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {}
}

export async function saveTranslationHistory(text, source = 'Kamera Real-time') {
  if (!text || !text.trim()) return null;

  const newItem = {
    id: 'riwayat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    text: text.trim(),
    timestamp: new Date().toISOString(),
    letterCount: text.trim().length,
    source
  };

  const currentLocal = getLocalHistory();
  const updated = [newItem, ...currentLocal];
  setLocalHistory(updated);

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
        if (json.data && json.data.id) {
          newItem.id = json.data.id;
        }
      }
    }
  } catch (apiError) {}

  return newItem;
}

export async function fetchTranslationHistory() {
  const localData = getLocalHistory();

  try {
    if (navigator.onLine) {
      const response = await fetch('/api/riwayat');
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
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
  } catch (err) {}

  return localData;
}

export async function deleteHistoryItem(id = null) {
  let updated = [];
  if (id) {
    const localData = getLocalHistory();
    updated = localData.filter(item => item.id !== id);
    setLocalHistory(updated);
  } else {
    setLocalHistory([]);
  }

  try {
    if (navigator.onLine) {
      const url = id ? `/api/riwayat?id=${id}` : '/api/riwayat';
      await fetch(url, { method: 'DELETE' });
    }
  } catch (err) {}

  return updated;
}

export async function fetchDictionaryData(fallbackJson = []) {
  try {
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
  } catch (err) {}

  return fallbackJson;
}
