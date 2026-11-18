/**
 * ============================================================================
 * BACKEND SERVERLESS FUNCTION / EXPRESS API
 * ============================================================================
 * Lokasi: /api/index.js (Otomatis dideteksi oleh Vercel sebagai Serverless Function)
 * 
 * Fitur:
 * 1. GET /api/kamus   -> Mengembalikan data kamus isyarat dari /data/kamus.json
 * 2. GET /api/riwayat -> Mengembalikan daftar riwayat terjemahan
 * 3. POST /api/riwayat -> Menyimpan riwayat baru (Hybrid: disk + in-memory fallback)
 * 4. DELETE /api/riwayat -> Menghapus riwayat (per ID atau hapus semua)
 * 5. GET /api/health  -> Health check status backend
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Path direktori data lokal
const dataDir = path.resolve(__dirname, '../data');
const kamusPath = path.join(dataDir, 'kamus.json');
const riwayatPath = path.join(dataDir, 'riwayat.json');

// In-Memory cache sebagai fallback tangguh untuk Vercel Serverless (Read-only disk)
let inMemoryKamus = null;
let inMemoryRiwayat = null;

/**
 * Helper: Membaca file JSON dengan aman
 */
function readJsonFileSync(filePath, fallbackData = []) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`[WARN] Gagal membaca file ${filePath}:`, error.message);
  }
  return fallbackData;
}

/**
 * Helper: Menulis file JSON dengan aman (aman dari batasan read-only Vercel)
 */
function writeJsonFileSync(filePath, data) {
  try {
    // Coba tulis ke disk (berfungsi di local dev atau writable server)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    // Pada Vercel Serverless, filesystem bersifat read-only. Fallback ke in-memory.
    console.warn(`[INFO] Disk read-only (lingkungan Vercel), menyimpan ke in-memory cache.`);
    return false;
  }
}

// Inisialisasi data awal
inMemoryKamus = readJsonFileSync(kamusPath, []);
inMemoryRiwayat = readJsonFileSync(riwayatPath, []);

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /api/health
 * Endpoint pemeriksaan kesehatan API
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend Penerjemah Bahasa Isyarat aktif',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local / Custom Server'
  });
});

/**
 * GET /api/kamus
 * Mengambil daftar kosakata alfabet dan gerakan isyarat
 */
app.get('/api/kamus', (req, res) => {
  try {
    // Selalu refresh jika file berubah di mode local dev
    if (!process.env.VERCEL && fs.existsSync(kamusPath)) {
      inMemoryKamus = readJsonFileSync(kamusPath, inMemoryKamus);
    }

    res.json({
      success: true,
      total: inMemoryKamus.length,
      data: inMemoryKamus
    });
  } catch (error) {
    console.error('Error membaca kamus:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data kamus',
      error: error.message
    });
  }
});

/**
 * GET /api/riwayat
 * Mengambil daftar log terjemahan kalimat yang tersimpan
 */
app.get('/api/riwayat', (req, res) => {
  try {
    if (!process.env.VERCEL && fs.existsSync(riwayatPath)) {
      inMemoryRiwayat = readJsonFileSync(riwayatPath, inMemoryRiwayat);
    }

    // Urutkan riwayat dari yang terbaru
    const sorted = [...inMemoryRiwayat].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    res.json({
      success: true,
      total: sorted.length,
      data: sorted
    });
  } catch (error) {
    console.error('Error membaca riwayat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data riwayat',
      error: error.message
    });
  }
});

/**
 * POST /api/riwayat
 * Menyimpan kalimat baru hasil deteksi isyarat
 */
app.post('/api/riwayat', (req, res) => {
  try {
    const { text, source, letterCount } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Teks terjemahan tidak boleh kosong'
      });
    }

    const newItem = {
      id: 'riwayat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      letterCount: letterCount || text.trim().length,
      source: source || 'Kamera Real-time'
    };

    // Tambahkan ke in-memory cache
    inMemoryRiwayat.unshift(newItem);

    // Coba persistensi ke disk file JSON
    writeJsonFileSync(riwayatPath, inMemoryRiwayat);

    res.status(201).json({
      success: true,
      message: 'Riwayat terjemahan berhasil disimpan',
      data: newItem
    });
  } catch (error) {
    console.error('Error menyimpan riwayat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan riwayat',
      error: error.message
    });
  }
});

/**
 * DELETE /api/riwayat
 * Menghapus riwayat (semua atau per ID via query ?id=xxx)
 */
app.delete('/api/riwayat', (req, res) => {
  try {
    const { id } = req.query;

    if (id) {
      // Hapus satu entri spesifik
      inMemoryRiwayat = inMemoryRiwayat.filter(item => item.id !== id);
      writeJsonFileSync(riwayatPath, inMemoryRiwayat);

      return res.json({
        success: true,
        message: `Entri riwayat dengan id ${id} berhasil dihapus`
      });
    }

    // Jika tidak ada ID, bersihkan seluruh riwayat
    inMemoryRiwayat = [];
    writeJsonFileSync(riwayatPath, inMemoryRiwayat);

    res.json({
      success: true,
      message: 'Semua riwayat terjemahan berhasil dibersihkan'
    });
  } catch (error) {
    console.error('Error menghapus riwayat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus riwayat',
      error: error.message
    });
  }
});

// Export default untuk Vercel Serverless Functions
export default app;
