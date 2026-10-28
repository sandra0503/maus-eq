// Generates build/icon.png (1024×1024) — a synthwave knob, no deps.
// Run: node scripts/make-icon.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const S = 1024;
const buf = Buffer.alloc(S * S * 4); // RGBA, starts fully transparent

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

function over(x, y, col, a) {
  if (a <= 0) return;
  const i = (y * S + x) * 4;
  const ba = buf[i + 3] / 255;
  const oa = a + ba * (1 - a);
  if (oa <= 0) return;
  buf[i] = Math.round((col[0] * a + buf[i] * ba * (1 - a)) / oa);
  buf[i + 1] = Math.round((col[1] * a + buf[i + 1] * ba * (1 - a)) / oa);
  buf[i + 2] = Math.round((col[2] * a + buf[i + 2] * ba * (1 - a)) / oa);
  buf[i + 3] = Math.round(oa * 255);
}

function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

const cx = 512, cy = 512;
const bgTop = [43, 25, 66], bgBot = [16, 9, 30];
const pink = [255, 45, 142], pinkLite = [255, 150, 205], pinkTick = [255, 110, 185];
const faceC = [48, 31, 72], faceE = [22, 14, 36];

for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    // rounded-square plate
    const rd = sdRoundRect(x, y, cx, cy, 416, 416, 196);
    const covRect = 1 - smooth(-1, 1, rd);
    if (covRect <= 0) continue;
    const ty = clamp((y - (cy - 416)) / 832, 0, 1);
    over(x, y, mix(bgTop, bgBot, ty), covRect);

    const dc = Math.hypot(x - cx, y - cy);
    // soft pink glow
    over(x, y, pinkLite, covRect * 0.14 * (1 - smooth(130, 440, dc)));

    // pink ring (donut)
    const inOuter = 1 - smooth(-1, 1, dc - 250);
    const inInner = 1 - smooth(-1, 1, dc - 188);
    const ringCov = Math.max(0, inOuter - inInner);
    if (ringCov > 0) {
      const f = clamp(0.5 - ((y - cy) / 250) * 0.5, 0, 1);
      over(x, y, mix(pink, pinkLite, f * 0.7), ringCov);
    }

    // dark knob face
    const faceCov = 1 - smooth(-1, 1, dc - 172);
    if (faceCov > 0) over(x, y, mix(faceC, faceE, clamp(dc / 172, 0, 1)), faceCov);

    // indicator tick (points up from centre)
    const id = sdRoundRect(x, y, cx, 442, 15, 64, 15);
    const indCov = 1 - smooth(-1, 1, id);
    if (indCov > 0) over(x, y, pinkTick, indCov);
  }
}

// ── encode PNG ──────────────────────────────────────────────────────────────
function crcTable() {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}
const CRC = crcTable();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 6;   // RGBA
const raw = Buffer.alloc(S * (1 + S * 4));
for (let y = 0; y < S; y++) {
  raw[y * (1 + S * 4)] = 0; // filter: none
  buf.copy(raw, y * (1 + S * 4) + 1, y * S * 4, (y + 1) * S * 4);
}
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, '..', 'build', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log('wrote', out, `(${png.length} bytes, ${S}x${S})`);
