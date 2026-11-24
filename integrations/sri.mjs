import { createHash } from 'node:crypto';
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

export default function sri() {
  return {
    name: 'local-sri',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const cache = new Map();
        const hashOf = async (url) => {
          if (!cache.has(url)) {
            const data = await readFile(join(root, url));
            cache.set(url, 'sha384-' + createHash('sha384').update(data).digest('base64'));
          }
          return cache.get(url);
        };
        const tag = /<(script|link)\b[^>]*>/gi;
        let count = 0;
        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const tags = html.match(tag) ?? [];
          let out = html;
          for (const t of new Set(tags)) {
            if (/\bintegrity=/i.test(t)) continue;
            const isScript = /^<script/i.test(t);
            const isStyle = !isScript && /\brel="stylesheet"/i.test(t);
            if (!isScript && !isStyle) continue;
            const url = t.match(isScript ? /\bsrc="(\/[^"/][^"]*)"/i : /\bhref="(\/[^"/][^"]*)"/i)?.[1];
            if (!url) continue; // skip inline and external
            const withSri = t.replace(/>$/, ` integrity="${await hashOf(url)}">`);
            out = out.split(t).join(withSri);
            count++;
          }
          if (out !== html) await writeFile(file, out);
        }
        logger.info(`added SRI to ${count} tag(s)`);
      },
    },
  };
}