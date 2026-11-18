import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

const dataDir = path.resolve(__dirname, '../data');
const kamusPath = path.join(dataDir, 'kamus.json');
const riwayatPath = path.join(dataDir, 'riwayat.json');

let inMemoryKamus = null;
let inMemoryRiwayat = null;

function readJsonFileSync(filePath, fallbackData = []) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {}
  return fallbackData;
}

function writeJsonFileSync(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

inMemoryKamus = readJsonFileSync(kamusPath, []);
inMemoryRiwayat = readJsonFileSync(riwayatPath, []);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend Penerjemah Bahasa Isyarat aktif',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local / Custom Server'
  });
});

app.get('/api/kamus', (req, res) => {
  try {
    if (!process.env.VERCEL && fs.existsSync(kamusPath)) {
      inMemoryKamus = readJsonFileSync(kamusPath, inMemoryKamus);
    }

    res.json({
      success: true,
      total: inMemoryKamus.length,
      data: inMemoryKamus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data kamus',
      error: error.message
    });
  }
});

app.get('/api/riwayat', (req, res) => {
  try {
    if (!process.env.VERCEL && fs.existsSync(riwayatPath)) {
      inMemoryRiwayat = readJsonFileSync(riwayatPath, inMemoryRiwayat);
    }

    const sorted = [...inMemoryRiwayat].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    res.json({
      success: true,
      total: sorted.length,
      data: sorted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data riwayat',
      error: error.message
    });
  }
});

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

    inMemoryRiwayat.unshift(newItem);
    writeJsonFileSync(riwayatPath, inMemoryRiwayat);

    res.status(201).json({
      success: true,
      message: 'Riwayat terjemahan berhasil disimpan',
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan riwayat',
      error: error.message
    });
  }
});

app.delete('/api/riwayat', (req, res) => {
  try {
    const { id } = req.query;

    if (id) {
      inMemoryRiwayat = inMemoryRiwayat.filter(item => item.id !== id);
      writeJsonFileSync(riwayatPath, inMemoryRiwayat);

      return res.json({
        success: true,
        message: `Entri riwayat dengan id ${id} berhasil dihapus`
      });
    }

    inMemoryRiwayat = [];
    writeJsonFileSync(riwayatPath, inMemoryRiwayat);

    res.json({
      success: true,
      message: 'Semua riwayat terjemahan berhasil dibersihkan'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus riwayat',
      error: error.message
    });
  }
});

export default app;
