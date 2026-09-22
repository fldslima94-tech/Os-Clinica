const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="50%" stop-color="#4338CA" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <linearGradient id="petalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#E0E7FF" stop-opacity="0.8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background with smooth squircle border -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4" />

  <!-- Aesthetic / Clinic Lotus & Sparkle Icon -->
  <g transform="translate(256, 256)" filter="url(#glow)">
    <!-- Central Aura Petal -->
    <path d="M0 -140 C45 -80 75 -20 0 80 C-75 -20 -45 -80 0 -140 Z" fill="url(#petalGrad)" />

    <!-- Left Petal -->
    <path d="M-20 -20 C-90 -70 -140 -20 -110 50 C-70 70 -30 40 0 70 C-10 30 -10 -5 -20 -20 Z" fill="url(#petalGrad)" opacity="0.9" />

    <!-- Right Petal -->
    <path d="M20 -20 C90 -70 140 -20 110 50 C70 70 30 40 0 70 C10 30 10 -5 20 -20 Z" fill="url(#petalGrad)" opacity="0.9" />

    <!-- Outer Left Leaf -->
    <path d="M-60 40 C-140 30 -160 90 -100 120 C-50 120 -30 90 0 80 C-30 75 -50 60 -60 40 Z" fill="url(#petalGrad)" opacity="0.75" />

    <!-- Outer Right Leaf -->
    <path d="M60 40 C140 30 160 90 100 120 C50 120 30 90 0 80 C30 75 50 60 60 40 Z" fill="url(#petalGrad)" opacity="0.75" />

    <!-- Core Golden Sparkle -->
    <circle cx="0" cy="5" r="14" fill="url(#goldGrad)" />
    <path d="M0 -30 L5 -10 L25 -5 L5 0 L0 20 L-5 0 L-25 -5 L-5 -10 Z" fill="#FCD34D" />
  </g>

  <!-- Crown Star -->
  <g transform="translate(256, 85)">
    <polygon points="0,-16 4,-4 16,0 4,4 0,16 -4,4 -16,0 -4,-4" fill="#FDE047" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

// Function to generate pure RGBA PNG buffer
function generatePng(width, height, isMaskable = false) {
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22; // maskable has no clipped corners

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      // Check rounded rect corner if not maskable
      let inBounds = true;
      if (!isMaskable) {
        const dx = Math.abs(x - cx) - (cx - cornerRadius);
        const dy = Math.abs(y - cy) - (cy - cornerRadius);
        if (dx > 0 && dy > 0 && (dx * dx + dy * dy > cornerRadius * cornerRadius)) {
          inBounds = false;
        }
      }

      if (!inBounds) {
        // Transparent
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        continue;
      }

      // Gradient background (Indigo #4F46E5 to Deep Slate #1E1B4B)
      const gradT = (x / width * 0.4) + (y / height * 0.6);
      let r = Math.round(79 * (1 - gradT) + 30 * gradT);
      let g = Math.round(70 * (1 - gradT) + 27 * gradT);
      let b = Math.round(229 * (1 - gradT) + 75 * gradT);
      let a = 255;

      // Draw aesthetic lotus & core geometry in center
      const nx = (x - cx) / (cx * 0.7);
      const ny = (y - cy) / (cy * 0.7);
      const dist = Math.sqrt(nx * nx + ny * ny);

      // Center sparkle / lotus petal shapes
      // Central petal:
      const inCenterPetal = (Math.abs(nx) < 0.28 * (1 - (ny + 0.3) * (ny + 0.3))) && (ny >= -0.7 && ny <= 0.4);
      // Side petals:
      const leftPetal = (Math.pow(nx + 0.35, 2) + Math.pow(ny - 0.1, 2) < 0.16);
      const rightPetal = (Math.pow(nx - 0.35, 2) + Math.pow(ny - 0.1, 2) < 0.16);
      // Core golden circle:
      const inGoldCore = (nx * nx + (ny - 0.05) * (ny - 0.05) < 0.025);
      // Top star:
      const inTopStar = (Math.abs(nx) + Math.abs(ny + 0.65) < 0.08);

      if (inGoldCore) {
        r = 251; g = 191; b = 36; // Amber gold
      } else if (inTopStar) {
        r = 253; g = 224; b = 71; // Light gold
      } else if (inCenterPetal || leftPetal || rightPetal) {
        // High opacity white/indigo petal
        r = Math.min(255, Math.round(r * 0.1 + 250 * 0.9));
        g = Math.min(255, Math.round(g * 0.1 + 252 * 0.9));
        b = Math.min(255, Math.round(b * 0.1 + 255 * 0.9));
      } else if (dist < 0.85) {
        // Subtle aura ring
        const ring = Math.abs(dist - 0.75);
        if (ring < 0.03) {
          r = Math.min(255, r + 45);
          g = Math.min(255, g + 45);
          b = Math.min(255, b + 60);
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Write the required PWA and Apple Touch Icons
const pwa192 = generatePng(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = generatePng(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable512 = generatePng(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

const appleTouchIcon = generatePng(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

// Favicon.ico fallback (can also be PNG data in modern browsers)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), appleTouchIcon);

console.log('PWA icons generated successfully in public/');
