import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  const scanlineLength = width * 4 + 1;
  const rawBuffer = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawBuffer[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawBuffer[pixelOffset] = r;
      rawBuffer[pixelOffset + 1] = g;
      rawBuffer[pixelOffset + 2] = b;
      rawBuffer[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawBuffer);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function iconPainter(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const inSquircle = (Math.abs(dx) <= w * 0.48 && Math.abs(dy) <= h * 0.48);
  if (!inSquircle) return [0, 0, 0, 0];

  let r = 9, g = 13, b = 22, a = 255;

  const ringDist = Math.abs(dist - w * 0.38);
  if (ringDist < w * 0.04) {
    const factor = 1 - (ringDist / (w * 0.04));
    r = Math.floor(r * (1 - factor) + 99 * factor);
    g = Math.floor(g * (1 - factor) + 102 * factor);
    b = Math.floor(b * (1 - factor) + 241 * factor);
  }

  if (dist < w * 0.32) {
    const t = (y / h);
    r = Math.floor(79 * (1 - t) + 6 * t);
    g = Math.floor(70 * (1 - t) + 182 * t);
    b = Math.floor(229 * (1 - t) + 212 * t);
  }

  const nodes = [
    [cx, cy - h * 0.15],
    [cx - w * 0.1, cy - h * 0.05],
    [cx + w * 0.1, cy - h * 0.05],
    [cx - w * 0.05, cy + h * 0.08],
    [cx + w * 0.05, cy + h * 0.08],
    [cx, cy + h * 0.18]
  ];

  for (const [nx, ny] of nodes) {
    const ndist = Math.sqrt((x - nx) * (x - nx) + (y - ny) * (y - ny));
    if (ndist <= w * 0.028) {
      return [255, 255, 255, 255];
    }
  }

  return [r, g, b, a];
}

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192x192.png'), createPNG(192, 192, iconPainter));
fs.writeFileSync(path.join(outDir, 'icon-512x512.png'), createPNG(512, 512, iconPainter));
