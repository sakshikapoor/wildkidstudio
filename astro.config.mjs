// @ts-check
import { defineConfig } from 'astro/config';
import { readFile, writeFile } from 'node:fs/promises';

const SURFACES = new URL('./src/data/surfaces.ts', import.meta.url);

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
      server.middlewares.use('/__surfaces', (req, res, next) => {
        if (req.method !== 'POST') return next();

        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          const fail = (status, message) => {
            res.statusCode = status;
            res.end(message);
          };

          try {
            const list = JSON.parse(body);

            // The editor is the only caller, but it is still a socket that
            // rewrites a source file — check the shape rather than trust it.
            if (!Array.isArray(list)) return fail(400, 'expected an array');

            const clean = list.map((s) => {
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
            if (head === -1) return fail(500, 'could not find the surfaces array');

            await writeFile(
              SURFACES,
              `${source.slice(0, head)}${marker}\n${rows}\n];\n`,
            );

            res.setHeader('content-type', 'text/plain');
            res.end(`saved ${clean.length}`);
          } catch (error) {
            fail(400, error instanceof Error ? error.message : 'bad request');
          }
        });
      });
    },
  };
}

// site is used to build absolute URLs for og:/canonical tags.
export default defineConfig({
  site: 'https://wildkidstudio.in',
  vite: { plugins: [surfaceEditor()] },
});
