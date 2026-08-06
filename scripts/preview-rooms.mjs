/**
 * Genera un HTML que compone las habitaciones igual que RoomScene, para
 * verificar que los recortes caen donde dice el manifiesto.
 *   node scripts/preview-rooms.mjs && abrir .preview/rooms.html
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = fs
  .readFileSync(path.join(root, 'src/room/roomManifest.generated.ts'), 'utf8')
  .replace(/\r\n/g, '\n');

const grab = (marker, end) => {
  const from = src.indexOf(marker) + marker.length;
  return JSON.parse(src.slice(from, src.indexOf(end, from)));
};
const rooms = grab('ROOM_PLACEMENT: Record<string, RoomPlacement> = ', ' as unknown as');
const chars = grab('CHAR_PLACEMENT: Record<string, CharPlacement> = ', ';\n');
const aspect = Number(/ROOM_ASPECT = ([\d.]+)/.exec(src)[1]);

const NPCS = {
  coach: { fx: 3.0, fy: 0.4 },
  duo: { fx: -2.2, fy: -1.8 },
  rival: { fx: 3.4, fy: -2.4 },
  manager: { fx: 0.2, fy: -3.4 },
};

const toScreen = (floor, fx, fy) => ({
  x: (floor.origin[0] + floor.ux[0] * fx + floor.uy[0] * fy) * 100,
  y: (floor.origin[1] + floor.ux[1] * fx + floor.uy[1] * fy) * 100,
});

const actor = (venue, floor, kind, fx, fy) => {
  const c = chars[kind];
  const at = toScreen(floor, fx, fy);
  const w = c.w * 100;
  const h = c.h * 100;
  return `<img class="actor" src="../assets/iso/characters/${kind}.png" style="left:${
    at.x - w * c.footX
  }%;top:${at.y - h * c.footY}%;width:${w}%;height:${h}%">`;
};

const sections = Object.entries(rooms)
  .map(([venue, data]) => {
    const props = data.props
      .map(
        (p) =>
          `<img src="../assets/iso/rooms/${venue}/${p.id}.png" style="left:${p.x * 100}%;top:${
            p.y * 100
          }%;width:${p.w * 100}%;height:${p.h * 100}%;z-index:${p.z}" title="${p.id}">`,
      )
      .join('\n');
    const people = [
      actor(venue, data.floor, 'player', 1.2, -2.6),
      ...Object.entries(NPCS).map(([k, s]) => actor(venue, data.floor, k, s.fx, s.fy)),
    ].join('\n');
    return `<section><h2>${venue}</h2><div class="scene">
      <img class="bg" src="../assets/iso/rooms/${venue}.png">
      ${props}
      ${people}
    </div></section>`;
  })
  .join('\n');

const html = `<!doctype html><meta charset="utf-8"><title>ProPath rooms</title>
<style>
  body{background:#06080e;color:#cfd6e4;font:13px system-ui;margin:0;padding:16px}
  h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7c8798;margin:18px 0 6px}
  .scene{position:relative;width:min(760px,96vw);aspect-ratio:${aspect};background:#04050a;overflow:hidden}
  .scene img{position:absolute}
  .bg{left:0;top:0;width:100%;height:100%;z-index:0}
  .actor{z-index:30}
</style>
${sections}`;

const out = path.join(root, '.preview');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'rooms.html'), html);
console.log('WROTE', path.join(out, 'rooms.html'));
