/**
 * Comprime PNGs de runtime (no source/) para bajar peso de APK.
 * Uso: node scripts/compress-runtime-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

const TARGETS = [
  { rel: 'assets/moba-landing-bg.jpg', maxWidth: 1280, jpeg: true },
  { rel: 'assets/iso/rooms/home.png', maxWidth: 1280 },
  { rel: 'assets/iso/rooms/gym.png', maxWidth: 1280 },
  { rel: 'assets/iso/rooms/cafe.png', maxWidth: 1280 },
  { rel: 'assets/iso/rooms/academy.png', maxWidth: 1280 },
  { rel: 'assets/iso/rooms/arena.png', maxWidth: 1280 },
  { rel: 'assets/icon.png', maxWidth: 1024 },
];

async function compressFile(rel, maxWidth, { jpeg = false } = {}) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.log('skip missing', rel);
    return;
  }
  const before = fs.statSync(file).size;
  const img = sharp(file);
  const meta = await img.metadata();
  let pipeline = sharp(file);
  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }
  const buf = jpeg
    ? await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    : await pipeline.png({ compressionLevel: 9, effort: 10, palette: false }).toBuffer();
  if (buf.length >= before * 0.98) {
    console.log(`keep  ${rel} (${Math.round(before / 1024)}KB — no gain)`);
    return;
  }
  fs.writeFileSync(file, buf);
  console.log(
    `ok    ${rel} ${Math.round(before / 1024)}KB → ${Math.round(buf.length / 1024)}KB` +
      (meta.width && meta.width > maxWidth ? ` (w≤${maxWidth})` : '')
  );
}

async function compressProps() {
  const roomsDir = path.join(root, 'assets/iso/rooms');
  const venues = ['home', 'gym', 'cafe', 'academy', 'arena'];
  for (const v of venues) {
    const dir = path.join(roomsDir, v);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.png')) continue;
      const rel = path.join('assets/iso/rooms', v, name);
      const file = path.join(root, rel);
      const before = fs.statSync(file).size;
      if (before < 60 * 1024) continue;
      const buf = await sharp(file)
        .png({ compressionLevel: 9, effort: 10 })
        .toBuffer();
      if (buf.length < before * 0.98) {
        fs.writeFileSync(file, buf);
        console.log(
          `ok    ${rel} ${Math.round(before / 1024)}KB → ${Math.round(buf.length / 1024)}KB`
        );
      }
    }
  }
}

let saved = 0;
const beforeTotal = TARGETS.reduce((s, t) => {
  const f = path.join(root, t.rel);
  return s + (fs.existsSync(f) ? fs.statSync(f).size : 0);
}, 0);

for (const t of TARGETS) {
  const f = path.join(root, t.rel);
  const b = fs.existsSync(f) ? fs.statSync(f).size : 0;
  await compressFile(t.rel, t.maxWidth, { jpeg: !!t.jpeg });
  const a = fs.existsSync(f) ? fs.statSync(f).size : 0;
  saved += Math.max(0, b - a);
}

await compressProps();

console.log(`\nRough save on hero assets: ~${Math.round(saved / 1024)}KB (was ${Math.round(beforeTotal / 1024)}KB heroes)`);
