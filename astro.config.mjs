// @ts-check
import { defineConfig } from 'astro/config';
import { readFile, writeFile } from 'node:fs/promises';

const SURFACES = new URL('./src/data/surfaces.ts', import.meta.url);
const HALFTONE = new URL('./src/data/halftone.ts', import.meta.url);

/**
 * Reads a POSTed JSON body, hands it to `handle`, and answers with whatever
 * that returns — or with the message of whatever it throws.
 *
 * Both editors below are sockets that rewrite a source file, so neither
 * trusts its caller: the shape is checked before anything is written.
 *
 * @param {(body: unknown) => Promise<string>} handle
 */
function jsonEndpoint(handle) {
  /** @type {import('vite').Connect.NextHandleFunction} */
  return (req, res, next) => {
    if (req.method !== 'POST') return next();

    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const message = await handle(JSON.parse(body));
        res.setHeader('content-type', 'text/plain');
        res.end(message);
      } catch (error) {
        res.statusCode = 400;
        res.end(error instanceof Error ? error.message : 'bad request');
      }
    });
  };
}

/**
 * Lets the in-browser surface editor write src/data/surfaces.ts.
 *
 * `configureServer` only runs under `astro dev`, so this endpoint does not
 * exist in a build — there is nothing here to ship or to switch off.
 *
 * Only the array literal at the end of the file is rewritten; the doc comment
 * and the `Surface` interface above it are left exactly as they are.
 */
function surfaceEditor() {
  return {
    name: 'wildkid:surface-editor',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      server.middlewares.use(
        '/__surfaces',
        jsonEndpoint(async (body) => {
          if (!Array.isArray(body)) throw new Error('expected an array');

          const clean = body.map((s) => {
            const nums = [s?.left, s?.right, s?.top];
            if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100)) {
              throw new Error('every value must be a percentage between 0 and 100');
            }
            if (s.left >= s.right) throw new Error('left must be less than right');

            if (s.text != null && typeof s.text !== 'string') {
              throw new Error('text must be a string');
            }
            if (typeof s.text === 'string' && s.text.length > 200) {
              throw new Error('text must be 200 characters or fewer');
            }

            const text = typeof s.text === 'string' ? s.text.trim() : '';
            return { left: s.left, right: s.right, top: s.top, text };
          });

          const round = (n) => Number(n.toFixed(3));
          const rows = clean
            .sort((a, b) => a.top - b.top || a.left - b.left)
            .map(
              (s) =>
                `  { left: ${round(s.left)}, right: ${round(s.right)}, top: ${round(s.top)}` +
                // JSON.stringify does the quoting and escaping, so a caption
                // with an apostrophe in it cannot break the file it lands in.
                `${s.text ? `, text: ${JSON.stringify(s.text)}` : ''} },`,
            )
            .join('\n');

          const source = await readFile(SURFACES, 'utf8');
          const marker = 'export const surfaces: Surface[] = [';
          const head = source.indexOf(marker);
          if (head === -1) throw new Error('could not find the surfaces array');

          await writeFile(SURFACES, `${source.slice(0, head)}${marker}\n${rows}\n];\n`);
          return `saved ${clean.length}`;
        }),
      );
    },
  };
}

/**
 * Lets the dev panel write src/data/halftone.ts.
 *
 * Same bargain as the surface editor: dev only, and only the object literal
 * at the end of the file is rewritten — the doc comment and the `Halftone`
 * interface above it are left exactly as they are.
 */
function halftoneEditor() {
  // Every field, with what counts as a legal value. `on` is the odd one out
  // and is checked separately.
  const ranges = {
    cell: [1, 200],
    dot: [0, 1],
    angle: [0, 360],
    contrast: [0, 10],
    brightness: [0, 3],
    desaturate: [0, 1],
    strength: [0, 1],
  };

  return {
    name: 'wildkid:halftone-editor',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      server.middlewares.use(
        '/__halftone',
        jsonEndpoint(async (body) => {
          if (typeof body !== 'object' || body === null) throw new Error('expected an object');
          const input = /** @type {Record<string, unknown>} */ (body);

          if (typeof input.on !== 'boolean') throw new Error('on must be a boolean');

          const round = (n) => Number(n.toFixed(3));
          const rows = [`  on: ${input.on},`];

          for (const [key, [min, max]] of Object.entries(ranges)) {
            const value = input[key];
            if (typeof value !== 'number' || !Number.isFinite(value)) {
              throw new Error(`${key} must be a number`);
            }
            if (value < min || value > max) {
              throw new Error(`${key} must be between ${min} and ${max}`);
            }
            rows.push(`  ${key}: ${round(value)},`);
          }

          const source = await readFile(HALFTONE, 'utf8');
          const marker = 'export const halftone: Halftone = {';
          const head = source.indexOf(marker);
          if (head === -1) throw new Error('could not find the halftone object');

          await writeFile(HALFTONE, `${source.slice(0, head)}${marker}\n${rows.join('\n')}\n};\n`);
          return 'saved';
        }),
      );
    },
  };
}

// site is used to build absolute URLs for og:/canonical tags.
export default defineConfig({
  site: 'https://wildkidstudio.in',
  vite: { plugins: [surfaceEditor(), halftoneEditor()] },
});
