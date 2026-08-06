const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const outDir = path.join(__dirname, '..', 'assets', 'iso', 'source', 'quaternius');
fs.mkdirSync(outDir, { recursive: true });

const files = [
  {
    name: 'furniture_pack.zip',
    url: 'https://opengameart.org/sites/default/files/Furniture%20Pack%20by%20%40Quaternius.zip',
  },
  {
    name: 'furniture_pack_alt.zip',
    url: 'https://opengameart.org/sites/default/files/Furniture%20Pack%20by%20@Quaternius.zip',
  },
  {
    name: 'animated_characters.zip',
    url: 'https://opengameart.org/sites/default/files/ultimate_animated_character_pack_by_quaternius.zip',
  },
];

function fetchToFile(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 10) return reject(new Error('too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0 ProPathQuaterniusFetch', Accept: '*/*' } },
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
  for (const f of files) {
    const dest = path.join(outDir, f.name);
    process.stdout.write(`GET ${f.url}\n`);
    try {
      await fetchToFile(f.url, dest);
      const size = fs.statSync(dest).size;
      const head = fs.readFileSync(dest).subarray(0, 4);
      const isZip = head[0] === 0x50 && head[1] === 0x4b;
      console.log(`OK ${f.name} ${size} zip=${isZip}`);
      if (!isZip) fs.unlinkSync(dest);
    } catch (e) {
      console.log(`FAIL ${f.name} ${e.message}`);
    }
  }
})();
