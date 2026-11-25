#!/usr/bin/env node
/**
 * Génère les icônes de l'app (PWA, iPhone, favicon) aux initiales « JW », sans dépendance :
 * dessin vectoriel simple rastérisé avec anticrénelage, encodage PNG via zlib.
 *
 *   node scripts/make-icons.mjs
 *
 * Fichiers produits dans public/icons/ : icon-192.png, icon-512.png (coins arrondis),
 * icon-maskable-512.png (plein cadre, zone de sécurité Android), apple-touch-icon.png
 * (180 px, plein cadre : iOS arrondit lui-même), et public/favicon.svg.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');

// ───────────── Dessin (coordonnées 0..1) ─────────────

const EMERALD_LIGHT = [16, 185, 129];
const EMERALD_DARK = [4, 120, 87];
const OCHRE = [236, 196, 106];
const WHITE = [255, 255, 255];
const STROKE = 0.085;

/** Segments des lettres J et W (traits à bouts ronds). */
function glyphSegments() {
  const pts = [];
  // J : barre du haut, fût, puis crosse arrondie vers la gauche
  pts.push([[0.23, 0.3], [0.38, 0.3]]);
  pts.push([[0.33, 0.3], [0.33, 0.58]]);
  const cx = 0.24;
  const cy = 0.58;
  const r = 0.09;
  let prev = [0.33, 0.58];
  for (let i = 1; i <= 14; i++) {
    const a = (Math.PI * i) / 14;
    const p = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    pts.push([prev, p]);
    prev = p;
  }
  // W
  const w = [[0.52, 0.3], [0.6, 0.7], [0.68, 0.43], [0.76, 0.7], [0.84, 0.3]];
  for (let i = 0; i < w.length - 1; i++) pts.push([w[i], w[i + 1]]);
  // le bloc va de 0.15 à 0.84 : déjà centré à l'épaisseur du trait près
  return pts;
}

const UNDERLINE = [[0.31, 0.82], [0.71, 0.82]];

function distToSegment(px, py, [[ax, ay], [bx, by]]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  const x = ax + t * dx - px;
  const y = ay + t * dy - py;
  return Math.sqrt(x * x + y * y);
}

function insideRoundedRect(x, y, radius) {
  if (radius <= 0) return true;
  const cx = Math.min(Math.max(x, radius), 1 - radius);
  const cy = Math.min(Math.max(y, radius), 1 - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius;
}

/** Couleur RGBA d'un point (x, y) de l'icône. */
function sample(x, y, { radius, scale, segments }) {
  if (!insideRoundedRect(x, y, radius)) return null;
  // fond : dégradé diagonal émeraude + halo ocre en haut à droite
  const t = (x + y) / 2;
  let c = EMERALD_LIGHT.map((v, i) => v + (EMERALD_DARK[i] - v) * t);
  const glow = Math.max(0, 1 - Math.hypot(x - 0.88, y - 0.12) / 0.45) * 0.22;
  c = c.map((v, i) => v + (OCHRE[i] - v) * glow);
  // contenu mis à l'échelle autour du centre (zone de sécurité des icônes « maskable »)
  const gx = 0.5 + (x - 0.5) / scale;
  const gy = 0.5 + (y - 0.5) / scale;
  if (distToSegment(gx, gy, UNDERLINE) <= 0.022) return [...OCHRE, 255];
  for (const s of segments) if (distToSegment(gx, gy, s) <= STROKE / 2) return [...WHITE, 255];
  return [...c, 255];
}

function render(size, { radius, scale }) {
  const segments = glyphSegments();
  const SS = 4; // 4×4 sous-échantillons par pixel
  const data = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, { radius, scale, segments });
          if (!c) continue;
          r += c[0];
          g += c[1];
          b += c[2];
          a += 1;
        }
      }
      const o = (py * size + px) * 4;
      if (a) {
        data[o] = Math.round(r / a);
        data[o + 1] = Math.round(g / a);
        data[o + 2] = Math.round(b / a);
      }
      data[o + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return encodePng(size, size, data);
}

// ───────────── Encodage PNG ─────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), payload]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits par canal
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // pas de filtre
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ───────────── Favicon SVG (même dessin) ─────────────

function faviconSvg() {
  const f = (n) => Math.round(n * 1000) / 10;
  const segs = glyphSegments();
  const paths = segs.map(([a, b]) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgb(${EMERALD_LIGHT})"/>
      <stop offset="1" stop-color="rgb(${EMERALD_DARK})"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#g)"/>
  <path d="${paths}" fill="none" stroke="#fff" stroke-width="${f(STROKE)}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M${f(UNDERLINE[0][0])} ${f(UNDERLINE[0][1])}L${f(UNDERLINE[1][0])} ${f(UNDERLINE[1][1])}" stroke="rgb(${OCHRE})" stroke-width="4.4" stroke-linecap="round"/>
</svg>
`;
}

mkdirSync(outDir, { recursive: true });
const targets = [
  ['icon-192.png', 192, { radius: 0.22, scale: 1 }],
  ['icon-512.png', 512, { radius: 0.22, scale: 1 }],
  ['icon-maskable-512.png', 512, { radius: 0, scale: 0.78 }],
  ['apple-touch-icon.png', 180, { radius: 0, scale: 0.92 }],
];
for (const [name, size, opts] of targets) {
  const png = render(size, opts);
  writeFileSync(join(outDir, name), png);
  console.log(`✓ public/icons/${name} (${size}×${size}, ${(png.length / 1024).toFixed(1)} Ko)`);
}
writeFileSync(join(root, 'public', 'favicon.svg'), faviconSvg());
console.log('✓ public/favicon.svg');
