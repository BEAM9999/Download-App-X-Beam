#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════
   generate-icons.js — สร้าง PWA icons (ไม่ต้องใช้ package ภายนอก!)
   วิธีใช้: node generate-icons.js
   สร้าง: icons/icon-192.png  icons/icon-512.png
          icons/icon-512-maskable.png  icons/apple-touch-icon.png
   ══════════════════════════════════════════════════════════ */
'use strict';
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ╔══════════════════════════════╗
// ║   Pure-Node PNG Encoder      ║
// ╚══════════════════════════════╝
const _CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = _CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
  const r = Buffer.alloc(4); r.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, r]);
}
function encodePNG(rgba, w, h) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const rowBytes = 1 + w * 4;
  const raw = Buffer.allocUnsafe(h * rowBytes);
  for (let y = 0; y < h; y++) {
    raw[y * rowBytes] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = y * rowBytes + 1 + x * 4;
      raw[d] = rgba[s]; raw[d+1] = rgba[s+1]; raw[d+2] = rgba[s+2]; raw[d+3] = rgba[s+3];
    }
  }
  const comp = zlib.deflateSync(raw, { level: 7 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', comp), pngChunk('IEND', Buffer.alloc(0))]);
}

// ╔══════════════════════════════════════════╗
// ║   Color + Math helpers                   ║
// ╚══════════════════════════════════════════╝
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)   => a + (b - a) * clamp(t, 0, 1);
function hexRGB(h) { const n = parseInt(h.replace('#', ''), 16); return [(n>>16)&255, (n>>8)&255, n&255]; }

// Diagonal 3-stop gradient: blue → purple → pink
const C1 = hexRGB('#2979ff'); // blue
const C2 = hexRGB('#7c3aed'); // purple
const C3 = hexRGB('#ff6b9d'); // pink
function gradColor(x, y, w, h) {
  const t = (x / w + y / h) / 2;  // 0..1 diagonal
  const a = clamp(t * 2, 0, 1);   // blue→purple
  const b = clamp(t * 2 - 1, 0, 1); // purple→pink
  return [
    Math.round(lerp(lerp(C1[0], C2[0], a), C3[0], b)),
    Math.round(lerp(lerp(C1[1], C2[1], a), C3[1], b)),
    Math.round(lerp(lerp(C1[2], C2[2], a), C3[2], b)),
  ];
}

// ╔══════════════════════════════════════════╗
// ║   Download-arrow shape (normalized 0-1) ║
// ╚══════════════════════════════════════════╝
function inArrow(nx, ny) {
  // Vertical shaft  (centered, y 0.16–0.58)
  if (Math.abs(nx - 0.50) <= 0.065 && ny >= 0.16 && ny <= 0.58) return true;
  // Arrowhead triangle  (base y=0.50, tip y=0.73)
  if (ny >= 0.50 && ny <= 0.73) {
    const t = (ny - 0.50) / (0.73 - 0.50);
    if (Math.abs(nx - 0.50) <= lerp(0.195, 0, t)) return true;
  }
  // Tray / base line  (y ~0.78, x 0.22–0.78)
  if (Math.abs(ny - 0.79) <= 0.038 && nx >= 0.22 && nx <= 0.78) return true;
  return false;
}

// ╔══════════════════════════════════════════╗
// ║   Render one icon                        ║
// ╚══════════════════════════════════════════╝
function renderIcon(size, maskable) {
  const rgba = new Uint8Array(size * size * 4);
  const rad  = size * 0.22; // iOS-style corner radius (only for non-maskable)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded-corner alpha mask (non-maskable icons only)
      if (!maskable) {
        const cx = Math.min(x + 0.5, size - 0.5 - x) - 0.5;
        const cy = Math.min(y + 0.5, size - 0.5 - y) - 0.5;
        if (cx < rad && cy < rad) {
          const rdx = rad - cx, rdy = rad - cy;
          if (rdx * rdx + rdy * rdy > rad * rad) {
            rgba[idx + 3] = 0; continue;
          }
        }
      }

      // Background gradient + subtle center-brightness lift
      const [r, g, b] = gradColor(x, y, size, size);
      const dist  = Math.sqrt(((x / size) - 0.5) ** 2 + ((y / size) - 0.5) ** 2);
      const boost = 1 + (0.18 - dist * 0.36);

      // Arrow shape coords (maskable: arrow occupies 80% safe zone)
      const scale = maskable ? 0.80 : 1.0;
      const off   = maskable ? 0.10 : 0.0;
      const nx = (x / size - off) / scale;
      const ny = (y / size - off) / scale;
      const onArrow = (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) && inArrow(nx, ny);

      if (onArrow) {
        rgba[idx] = rgba[idx+1] = rgba[idx+2] = 255; // white arrow
      } else {
        rgba[idx]   = Math.min(255, Math.round(r * boost));
        rgba[idx+1] = Math.min(255, Math.round(g * boost));
        rgba[idx+2] = Math.min(255, Math.round(b * boost));
      }
      rgba[idx + 3] = 255;
    }
  }
  return rgba;
}

// ╔══════════════════════════════════════════╗
// ║   Generate all icons                     ║
// ╚══════════════════════════════════════════╝
const outDir = path.join(__dirname, 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const jobs = [
  { file: 'icon-192.png',          size: 192, maskable: false },
  { file: 'icon-512.png',          size: 512, maskable: false },
  { file: 'icon-512-maskable.png', size: 512, maskable: true  },
  { file: 'apple-touch-icon.png',  size: 180, maskable: false },
];

for (const { file, size, maskable } of jobs) {
  const png  = encodePNG(renderIcon(size, maskable), size, size);
  const dest = path.join(outDir, file);
  fs.writeFileSync(dest, png);
  console.log(`✅ icons/${file}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB${maskable ? ', maskable' : ''})`);
}

console.log('\n🎉 PWA icons พร้อมใช้งาน! ต่อไป push ขึ้น GitHub ได้เลย');
