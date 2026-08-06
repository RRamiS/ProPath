/**
 * Upgrade visual: props Hooded Crow (pixel iso moderno) + personajes
 * Chrome District ortho (cyber CC0) y fallback sclone (pre-render 3D CC0).
 *
 * Uso: node scripts/prepare-iso-assets.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ISO = path.join(ROOT, 'assets', 'iso');
const UPGRADE = path.join(ISO, 'source', 'upgrade');
const CHROME = path.join(UPGRADE, 'chrome');

const ROLE_CHROME = {
  player: 'VX-0001',
  duo: 'VX-0012',
  coach: 'VX-0036',
  rival: 'VX-0042',
  manager: 'VX-0060',
};

const ROLE_TINT = {
  player: { r: 204, g: 255, b: 51 },
  coach: { r: 47, g: 230, b: 224 },
  duo: { r: 120, g: 170, b: 255 },
  rival: { r: 255, g: 90, b: 110 },
  manager: { r: 240, g: 190, b: 70 },
};

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function blackToAlpha(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 14 && data[i + 1] < 14 && data[i + 2] < 14) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function nearWhiteToAlpha(buf, thresh = 248) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] >= thresh && data[i + 1] >= thresh && data[i + 2] >= thresh) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function tintKeepLuma(buf, tint, strength = 0.55) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    const lum = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11) / 255;
    data[i] = Math.min(255, Math.round(data[i] * (1 - strength) + tint.r * lum * strength * 1.4));
    data[i + 1] = Math.min(255, Math.round(data[i + 1] * (1 - strength) + tint.g * lum * strength * 1.4));
    data[i + 2] = Math.min(255, Math.round(data[i + 2] * (1 - strength) + tint.b * lum * strength * 1.4));
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Extrae componentes conectados (objetos) de un sheet con fondo blanco. */
async function extractComponents(pngPath, { minArea = 180, maxArea = 18000 } = {}) {
  const transparent = await nearWhiteToAlpha(await fs.promises.readFile(pngPath));
  const { data, info } = await sharp(transparent).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const comps = [];

  const idx = (x, y) => y * w + x;
  const isSolid = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return data[idx(x, y) * 4 + 3] > 20;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (visited[i] || !isSolid(x, y)) continue;
      const stack = [[x, y]];
      visited[i] = 1;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        area++;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        for (const [nx, ny] of [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ]) {
          const ni = idx(nx, ny);
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || visited[ni] || !isSolid(nx, ny)) continue;
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      if (area < minArea || area > maxArea) continue;
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      // Skip room mockups (muy anchos)
      if (bw > w * 0.45 || bh > h * 0.45) continue;
      comps.push({ left: minX, top: minY, width: bw, height: bh, area });
    }
  }
  comps.sort((a, b) => b.area - a.area);
  return { transparent, comps };
}

async function cropComp(sourceBuf, box, outPath, size = 256) {
  const pad = 2;
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const extracted = await sharp(sourceBuf)
    .extract({
      left,
      top,
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    })
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);
  return extracted;
}

/**
 * Heurística: elige el componente más cercano a “escritorio / TV / cama / etc.”
 * por tamaño relativo y posición en el sheet (orden por área).
 */
async function buildPropsFromHooded() {
  const livingPath = path.join(UPGRADE, 'hooded_living.png');
  const deskPath = path.join(UPGRADE, 'hooded_desk.png');
  const bedPath = path.join(UPGRADE, 'hooded_bed.png');
  if (![livingPath, deskPath, bedPath].every((p) => fs.existsSync(p))) {
    console.warn('missing hooded sheets — keep previous props');
    return;
  }

  const living = await extractComponents(livingPath, { minArea: 220, maxArea: 14000 });
  const desk = await extractComponents(deskPath, { minArea: 160, maxArea: 16000 });
  const bed = await extractComponents(bedPath, { minArea: 220, maxArea: 18000 });

  // Índices por área (0 = más grande usable). Ajustados tras inspección.
  const picks = {
    // living_12 = TV + consola (verificado en preview)
    tv: { sheet: living, i: 12 },
    rug: { sheet: living, i: 0 },
    banner: { sheet: living, i: 3 }, // sofá como acento de pared / marca
    poster: { sheet: living, i: 13 },
    window: { sheet: living, i: 9 }, // butaca / acento ventana
    // desk sheet
    cam: { sheet: desk, i: 6 }, // cabinet alto / “cam rack”
    shelf: { sheet: desk, i: 1 },
    board: { sheet: desk, i: 2 },
    rig: { sheet: desk, i: 0 }, // L-desk gamer
    door: { sheet: desk, i: 4 }, // armario vertical
    bed: { sheet: bed, i: 0 },
  };

  for (const [id, pick] of Object.entries(picks)) {
    const box = pick.sheet.comps[pick.i];
    if (!box) {
      console.warn('no component for', id, 'at', pick.i, 'have', pick.sheet.comps.length);
      continue;
    }
    const dest = path.join(ISO, 'props', `${id}.png`);
    await cropComp(pick.sheet.transparent, box, dest, 256);
    console.log('prop', id, '<- area', box.area, `${box.width}x${box.height}`);
  }

  // Venue accents: plantas / lámparas del living
  const venuePick = [
    ['home', 9],
    ['cafe', 5],
    ['gym', 7],
    ['academy', 4],
    ['arena', 3],
  ];
  for (const [id, i] of venuePick) {
    const box = living.comps[i] ?? living.comps[0];
    if (!box) continue;
    await cropComp(living.transparent, box, path.join(ISO, 'venues', `${id}.png`), 192);
    console.log('venue', id);
  }
}

async function buildScloneCharacters() {
  const armored = path.join(UPGRADE, 'sclone_armored.png');
  const plain = path.join(UPGRADE, 'sclone_default.png');
  const sheet = fs.existsSync(armored) ? armored : plain;
  if (!fs.existsSync(sheet)) {
    console.warn('missing sclone sheet');
    return false;
  }
  const cell = 128;
  // Variar fila/columna por rol para siluetas distintas (dirs + frames idle).
  const poses = {
    player: { row: 3, col: 0 },
    coach: { row: 2, col: 1 },
    duo: { row: 1, col: 0 },
    rival: { row: 4, col: 2 },
    manager: { row: 0, col: 0 },
  };
  for (const [role, pose] of Object.entries(poses)) {
    let frame = await sharp(sheet)
      .extract({
        left: pose.col * cell,
        top: pose.row * cell,
        width: cell,
        height: cell,
      })
      .png()
      .toBuffer();
    frame = await blackToAlpha(frame);
    frame = await tintKeepLuma(frame, ROLE_TINT[role], 0.55);
    await sharp(frame)
      .resize({
        width: 112,
        height: 140,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(ISO, 'characters', `${role}.png`));
    console.log('character sclone', role);
  }
  return true;
}

async function buildChromeCharacters() {
  for (const [role, seed] of Object.entries(ROLE_CHROME)) {
    const sheetPath = path.join(CHROME, `${seed}_ortho_sheet.png`);
    const metaPath = path.join(CHROME, `${seed}_ortho_sheet.json`);
    if (!fs.existsSync(sheetPath)) {
      console.warn('missing chrome sheet', seed);
      continue;
    }
    const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf8'));
    const cellW = meta.cellW ?? 56;
    const cellH = meta.cellH ?? 84;
    const row = 1;
    const col = 0;
    let frame = await sharp(sheetPath)
      .extract({ left: col * cellW, top: row * cellH, width: cellW, height: cellH })
      .png()
      .toBuffer();
    frame = await blackToAlpha(frame);
    frame = await sharp(frame)
      .resize({
        width: 112,
        height: 168,
        kernel: sharp.kernel.nearest,
        fit: 'fill',
      })
      .png()
      .toBuffer();
    frame = await tintKeepLuma(frame, ROLE_TINT[role], 0.22);
    await sharp(frame).png().toFile(path.join(ISO, 'characters', `${role}.png`));
    console.log('character chrome', role, seed);
  }
}

async function main() {
  await ensureDir(path.join(ISO, 'props'));
  await ensureDir(path.join(ISO, 'characters'));
  await ensureDir(path.join(ISO, 'venues'));
  await buildPropsFromHooded();
  // Chrome District (cyber/esports, CC0) — mejor fit temático que el cyborg FLARE.
  await buildChromeCharacters();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
