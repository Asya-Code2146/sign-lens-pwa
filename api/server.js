/**
 * Standalone Local Development Server
 * Menjalankan server Express di port 3001
 */

import app from './index.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 [BACKEND] Server Express berjalan di http://localhost:${PORT}`);
  console.log(`   - Endpoint Kamus:   http://localhost:${PORT}/api/kamus`);
  console.log(`   - Endpoint Riwayat: http://localhost:${PORT}/api/riwayat`);
  console.log(`   - Endpoint Health:  http://localhost:${PORT}/api/health`);
});
