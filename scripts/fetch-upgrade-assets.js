const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const outDir = path.join(__dirname, '..', 'assets', 'iso', 'source', 'upgrade');
fs.mkdirSync(outDir, { recursive: true });

const direct = [
  {
    out: 'cryovex_try.zip',
    url: 'https://cryovex.itch.io/pixel-isometric-modern-interior/file/Pixel-Isometric-Modern-Interior-Free_v.1.01.zip',
  },
  {
    out: 'gaming_room.zip',
    url: 'https://voxelbytebot.itch.io/voxel-gaming-room-furniture/file/GamingRoomFurniture.zip',
  },
  {
    out: 'office.zip',
    url: 'https://voxelbytebot.itch.io/office-environment/file/Office.zip',
  },
  {
    out: 'chrome.zip',
    url: 'https://booliebuilds.itch.io/chrome-district/file/chrome-district.zip',
  },
  {
    out: 'supernova.zip',
    url: 'https://supernovafiles.itch.io/isometric-asset-pack/file/Isometric%20Character%20Asset%20Pack.zip',
  },
  {
    out: 'zephilie_free.zip',
    url: 'https://zephilie.itch.io/isometric-pixel-art-assets/file/game-assets_md-zp_free.zip',
  },
  {
    out: 'hooded_living.png',
    url: 'https://opengameart.org/sites/default/files/isometric_living_room_furniture_png.png',
  },
  {
    out: 'hooded_bed.png',
    url: 'https://opengameart.org/sites/default/files/bedrooms_furniture_-7closet-4_carpets-_18_beds_.png',
  },
  {
    out: 'hooded_desk.png',
    url: 'https://opengameart.org/sites/default/files/2_bedrooms_-_16_nightstand_-_6_desks_-2_desk_chairs_-.png',
  },
  {
    out: 'quaternius_furniture.zip',
    url: 'https://www.dropbox.com/scl/fi/placeholder',
  },
];

function fetchToFile(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('too many redirects'));
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 ProPathAssetFetch',
          Accept: '*/*',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).toString();
          res.resume();
          return resolve(fetchToFile(next, dest, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
        file.on('error', reject);
      }
    );
    req.on('error', reject);
  });
}

(async () => {
  for (const item of direct) {
    if (item.out.includes('quaternius')) continue;
    const dest = path.join(outDir, item.out);
    process.stdout.write(`GET ${item.url}\n`);
    try {
      await fetchToFile(item.url, dest);
      const size = fs.statSync(dest).size;
      const head = fs.readFileSync(dest).subarray(0, 20).toString('utf8');
      console.log(`OK ${item.out} ${size} head=${JSON.stringify(head.slice(0, 40))}`);
      if (head.includes('<!DOCTYPE') || head.includes('<html')) {
        console.log(`  (looks like HTML, not binary)`);
      }
    } catch (err) {
      console.log(`FAIL ${item.out} :: ${err.message}`);
    }
  }
})();
