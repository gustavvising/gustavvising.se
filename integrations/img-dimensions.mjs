import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

function sizeOf(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF') {
    return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  }
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8X') return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

export default function imgDimensions() {
  return {
    name: 'img-dimensions',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const cache = new Map();
        let count = 0;
        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          let out = html;
          for (const tag of new Set(html.match(/<img\b[^>]*>/g) ?? [])) {
            if (/\b(width|height)=/.test(tag)) continue;
            const src = tag.match(/\bsrc="(\/[^"/][^"]*)"/)?.[1];
            if (!src) continue;
            if (!cache.has(src)) {
              try { cache.set(src, sizeOf(await readFile(join(root, src.split('?')[0])))); }
              catch { cache.set(src, null); }
            }
            const size = cache.get(src);
            if (!size) { logger.warn(`no size for ${src}`); continue; }
            const fixed = tag.replace(/^<img\b/, `<img width="${size.w}" height="${size.h}"`);
            out = out.split(tag).join(fixed);
            count++;
          }
          if (out !== html) await writeFile(file, out);
        }
        logger.info(`added dimensions to ${count} image(s)`);
      },
    },
  };
}