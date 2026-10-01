import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Master SVG template for the "STUDIO DE BELEZA FEMININA" luxury icon
function createSvg({ maskable = false, width = 512, height = 512 } = {}) {
  // If maskable, scale the inner artwork to 80% and center it so it stays strictly within the Android safe zone (circle of diameter 410px)
  const transform = maskable 
    ? 'translate(256, 256) scale(0.78) translate(-256, -244)' 
    : 'translate(0, 0)';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${width}" height="${height}">
  <defs>
    <!-- Ultra-realistic metallic gold gradient matching the uploaded artwork -->
    <linearGradient id="goldGradient" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#FFF3D4" />
      <stop offset="15%" stop-color="#F2D184" />
      <stop offset="38%" stop-color="#CFA146" />
      <stop offset="62%" stop-color="#E9CB7E" />
      <stop offset="82%" stop-color="#AC7A25" />
      <stop offset="100%" stop-color="#6F4B11" />
    </linearGradient>

    <!-- Warm golden typography gradient -->
    <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#5A3A0D" />
      <stop offset="25%" stop-color="#885E1E" />
      <stop offset="50%" stop-color="#B88934" />
      <stop offset="75%" stop-color="#885E1E" />
      <stop offset="100%" stop-color="#5A3A0D" />
    </linearGradient>

    <!-- Clean, pristine luxury background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#FAF8F5" />
      <stop offset="100%" stop-color="#F2ECE1" />
    </linearGradient>

    <!-- Soft 3D metallic drop shadow for the gold emblem -->
    <filter id="goldDropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2.2" stdDeviation="2.2" flood-color="#4E3309" flood-opacity="0.30" />
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#7C5513" flood-opacity="0.10" />
    </filter>
  </defs>

  <!-- Background: Pristine Rounded App Icon (Full bleed background for maskable, squircle for standard) -->
  ${maskable ? `
  <rect width="512" height="512" fill="url(#bgGrad)" />
  ` : `
  <rect width="512" height="512" rx="116" fill="url(#bgGrad)" />
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="#EAE2D3" stroke-width="2.5" />
  `}

  <g transform="${transform}">
    <!-- EMBLEM: LOTUS FLOWER + FEMALE PROFILE + EMBRACING PETALS -->
    <g transform="translate(256, 190)" filter="url(#goldDropShadow)" fill="none" stroke="url(#goldGradient)" stroke-linecap="round" stroke-linejoin="round">
      
      <!-- 1. LOTUS FLOWER CROWN (Resting atop the female head) -->
      <!-- Center Upright Petal -->
      <path d="M 0 -118 C 14 -94 15 -66 0 -38 C -15 -66 -14 -94 0 -118 Z" stroke-width="5.8" fill="#FBF7EE" fill-opacity="0.35" />
      
      <!-- Left Inner Petal -->
      <path d="M 0 -38 C -13 -64 -32 -96 -11 -107 C 3 -111 5 -82 0 -38" stroke-width="5.5" />
      
      <!-- Right Inner Petal -->
      <path d="M 0 -38 C 13 -64 32 -96 11 -107 C -3 -111 -5 -82 0 -38" stroke-width="5.5" />

      <!-- Left Outer Petal (Wing) -->
      <path d="M -7 -36 C -34 -52 -62 -62 -50 -80 C -38 -98 -19 -72 -3 -44" stroke-width="5.2" />

      <!-- Right Outer Petal (Wing) -->
      <path d="M 7 -36 C 34 -52 62 -62 50 -80 C 38 -98 19 -72 3 -44" stroke-width="5.2" />

      <!-- Lotus Calyx / Support Base Arc -->
      <path d="M -30 -35 C -10 -27 10 -27 30 -35" stroke-width="4.8" />

      <!-- 2. FEMALE FACE PROFILE (Serene, Facing Right) -->
      <path d="
        M -2 -27
        C 15 -13 22 4 22 20
        C 22 26 23 31 29 36
        C 34 40 34 43 27 47
        C 23 50 24 53 29 55
        C 33 57 31 61 25 64
        C 21 66 22 70 27 74
        C 29 77 26 83 20 86
        C 12 90 0 91 -9 100
        C -15 107 -18 116 -17 125
      " stroke-width="6.0" />

      <!-- 3. OUTER TULIP CONTOUR (Left Encompassing Petal) -->
      <path d="
        M -28 -35
        C -50 -17 -73 6 -80 32
        C -90 66 -73 103 -39 120
        C -15 132 8 122 17 109
        C 23 100 20 90 13 85
      " stroke-width="6.2" />

      <!-- 4. INNER ACCENT CONTOUR (Petal Fold & Collarbone Arc) -->
      <path d="
        M -33 118
        C -52 103 -63 69 -52 39
        C -45 16 -27 -6 -10 -23
      " stroke-width="5.0" />

      <!-- Delicate Inner Flow Line -->
      <path d="
        M -37 112
        C -20 96 -7 67 5 34
        C 8 25 7 13 1 4
      " stroke-width="5.2" />
    </g>

    <!-- TYPOGRAPHY: STUDIO DE BELEZA FEMININA -->
    <!-- Line 1: STUDIO DE BELEZA -->
    <text x="256" y="416" 
          text-anchor="middle"
          font-family="'Playfair Display', 'Cinzel', 'Didot', 'Bodoni MT', 'Times New Roman', Georgia, serif" 
          font-size="34" 
          font-weight="700" 
          letter-spacing="5" 
          fill="url(#goldTextGrad)">
      STUDIO DE BELEZA
    </text>

    <!-- Line 2: FEMININA -->
    <text x="256" y="456" 
          text-anchor="middle"
          font-family="'Playfair Display', 'Cinzel', 'Didot', 'Bodoni MT', 'Times New Roman', Georgia, serif" 
          font-size="20" 
          font-weight="500" 
          letter-spacing="14" 
          fill="url(#goldTextGrad)">
      FEMININA
    </text>
  </g>
</svg>`;
}

async function main() {
  console.log('Generating App Icons for Mobile & Desktop PWA...');

  // 1. Standard Logo SVG & Maskable SVG
  const standardSvg = createSvg({ maskable: false });
  const maskableSvg = createSvg({ maskable: true });

  fs.writeFileSync('public/logo.svg', standardSvg, 'utf-8');
  fs.writeFileSync('public/icon.svg', standardSvg, 'utf-8');
  fs.writeFileSync('public/favicon.svg', standardSvg, 'utf-8');

  // 2. Render PNG 512x512
  const resvg512 = new Resvg(standardSvg, { fitTo: { mode: 'width', value: 512 } });
  const png512 = resvg512.render().asPng();
  fs.writeFileSync('public/pwa-512x512.png', png512);
  console.log('✓ public/pwa-512x512.png created');

  // 3. Render PNG 192x192
  const resvg192 = new Resvg(standardSvg, { fitTo: { mode: 'width', value: 192 } });
  const png192 = resvg192.render().asPng();
  fs.writeFileSync('public/pwa-192x192.png', png192);
  console.log('✓ public/pwa-192x192.png created');

  // 4. Render Maskable 512x512 (with safe-zone margins for Android adaptive icons)
  const resvgMaskable = new Resvg(maskableSvg, { fitTo: { mode: 'width', value: 512 } });
  const pngMaskable = resvgMaskable.render().asPng();
  fs.writeFileSync('public/pwa-maskable-512x512.png', pngMaskable);
  console.log('✓ public/pwa-maskable-512x512.png created');

  // 5. Render Apple Touch Icon 180x180 for iOS
  const resvg180 = new Resvg(standardSvg, { fitTo: { mode: 'width', value: 180 } });
  const png180 = resvg180.render().asPng();
  fs.writeFileSync('public/apple-touch-icon.png', png180);
  console.log('✓ public/apple-touch-icon.png created');

  // 6. Generate Favicon ICO using convert
  try {
    execSync('convert public/pwa-192x192.png -define icon:auto-resize=64,48,32,16 public/favicon.ico');
    console.log('✓ public/favicon.ico created');
  } catch (e) {
    console.warn('Could not generate multi-res ICO with ImageMagick, copying 192 as fallback ICO');
    fs.copyFileSync('public/pwa-192x192.png', 'public/favicon.ico');
  }

  console.log('All PWA application icons generated successfully!');
}

main().catch(console.error);
