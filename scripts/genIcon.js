// Simple script to generate a multi-size ICO using pure JS (no external native deps)
// Generates build/icon.ico from an inline SVG rasterized via canvas (using node-canvas optional) or fallback PNGs using Jimp.

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = (() => {
  try { return require('canvas'); } catch { return {}; }
})();
const Jimp = require('jimp');

const SIZES = [16, 24, 32, 48, 64, 128, 256];
const OUT = path.join(__dirname, '..', 'build', 'icon.ico');

const baseSvg = (size) => `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d6af2"/>
      <stop offset="100%" stop-color="#182848"/>
    </linearGradient>
  </defs>
  <rect rx="56" ry="56" x="0" y="0" width="256" height="256" fill="url(#g)"/>
  <g fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <path d="M72 176v-96c0-8 6-16 16-16h80c10 0 16 8 16 16v48c0 8-6 16-16 16h-64" />
    <path d="M72 176 104 144 136 176 184 128" />
  </g>
</svg>`;

async function svgToPngBuffer(size) {
  const svg = baseSvg(size);
  if (createCanvas) {
    const canvas = createCanvas(size, size);
    const img = await loadImage('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toBuffer('image/png');
  } else {
    // Fallback with Jimp directly from SVG -> raster not supported; write temp then read
    const tmpSvg = path.join(__dirname, `tmp-${size}.svg`);
    fs.writeFileSync(tmpSvg, svg, 'utf-8');
    // Jimp doesn't read svg natively without plugin; skip sizes if unsupported
    // For simplicity create a flat color square fallback
    const img = await new Jimp(size, size, '#3d6af2');
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).catch(()=>null);
    if (font) img.print(font, 2, 2, 'D');
    const buf = await img.getBufferAsync(Jimp.MIME_PNG);
    fs.unlinkSync(tmpSvg);
    return buf;
  }
}

// Build ICO by concatenating directory entries per spec
async function buildIco() {
  const images = [];
  for (const size of SIZES) {
    const png = await svgToPngBuffer(size);
    images.push({ size, png });
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // image type ico
  header.writeUInt16LE(images.length, 4);
  const dirEntries = [];
  let offset = 6 + images.length * 16;
  const buffers = [header];
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(png.length, 8); // size of bitmap
    entry.writeUInt32LE(offset, 12); // offset
    offset += png.length;
    dirEntries.push(entry);
    buffers.push(png); // add later after directory entries header & entries
  }
  const all = [header, ...dirEntries, ...buffers.slice(1)];
  fs.writeFileSync(OUT, Buffer.concat(all));
  console.log('Generated', OUT);
}

buildIco().catch(e => {
  console.error(e);
  process.exit(1);
});
