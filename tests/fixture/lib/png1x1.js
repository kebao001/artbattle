/**
 * Minimal valid 1×1 PNG encoders (RGB or RGBA) for fixture data — no deps.
 * Each distinct (r,g,b) or (r,g,b,a) yields a different file bytes / base64.
 */

import { deflateSync } from "node:zlib";

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const tb = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = crc32(Buffer.concat([tb, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, tb, data, crcBuf]);
}

function clampByte(n) {
  return Math.max(0, Math.min(255, n | 0));
}

/** 1×1 RGB (color type 2). */
export function png1x1RgbBase64(r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.from([0, clampByte(r), clampByte(g), clampByte(b)]);
  const idatBody = deflateSync(raw);
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatBody),
    chunk("IEND", Buffer.alloc(0)),
  ]).toString("base64");
}

/** 1×1 RGBA (color type 6) — same RGB can differ by alpha for distinct bytes. */
export function png1x1RgbaBase64(r, g, b, a) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.from([
    0,
    clampByte(r),
    clampByte(g),
    clampByte(b),
    clampByte(a),
  ]);
  const idatBody = deflateSync(raw);
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatBody),
    chunk("IEND", Buffer.alloc(0)),
  ]).toString("base64");
}
