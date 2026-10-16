// scripts/extract-images.mjs
// Vercel build-time step: decodes the base64 text sources in assets-b64/
// (*.jpg.b64) into real binary JPEGs under assets/.
//
// Why this exists: the GitHub web UI / connector path this repo went through
// can only store these images as text (base64). Browsers cannot render a
// base64 *text file* served as image/jpeg, so every <img> broke. Decoding at
// build time produces genuine binary JPEGs in the deployed output without
// anyone having to hand-upload binary files again.
import { readdirSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const SRC = 'assets-b64';
const DEST = 'assets';

mkdirSync(DEST, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith('.jpg.b64'));
let ok = 0;
for (const f of files) {
  const name = basename(f, '.b64'); // e.g. img-01.jpg
  const b64 = readFileSync(join(SRC, f), 'utf8').replace(/\s+/g, '');
  const buf = Buffer.from(b64, 'base64');
  if (buf[0] !== 0xff || buf[1] !== 0xd8) {
    console.error(`extract-images: SKIP ${f} — decoded bytes are not a JPEG`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(join(DEST, name), buf);
  ok++;
}
console.log(`extract-images: decoded ${ok}/${files.length} images -> ${DEST}/`);
if (ok === 0) process.exitCode = 1;
