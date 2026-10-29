import {defineConfig, Plugin} from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
import ffmpeg from '@motion-canvas/ffmpeg';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Sert les icônes Iconify depuis un cache disque (`/iconify/<prefix>/<name>.svg?color=…`).
 * L'API Iconify répond 429 dès qu'un rendu enchaîne les icônes (une URL par couple
 * icône + couleur) : chaque SVG n'est téléchargé qu'une fois, la couleur est appliquée ici.
 * Branché sur le composant Icon dans `src/project.ts`.
 */
function iconifyCache(): Plugin {
  const cacheDirectory = path.resolve('node_modules/.iconify-cache');
  return {
    name: 'iconify-cache',
    configureServer(server) {
      server.middlewares.use('/iconify', async (request, response) => {
        const url = new URL(request.url ?? '', 'http://localhost');
        const match = url.pathname.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)\.svg$/);
        if (!match) {
          response.statusCode = 400;
          response.end();
          return;
        }
        const [, prefix, name] = match;
        const cachedFile = path.join(cacheDirectory, `${prefix}--${name}.svg`);
        if (!fs.existsSync(cachedFile)) {
          // Endpoint JSON plutôt que .svg : quota bien plus large côté Iconify
          const upstream = await fetch(`https://api.iconify.design/${prefix}.json?icons=${name}`);
          const data = upstream.ok ? await upstream.json() : null;
          // ponytail: alias résolu sur un niveau, sans ses rotations/flips (aucun utilisé ici)
          const icon = data?.icons?.[data.aliases?.[name]?.parent ?? name];
          if (!icon) {
            response.statusCode = upstream.ok ? 404 : upstream.status;
            response.end();
            return;
          }
          const width = icon.width ?? data.width ?? 16;
          const height = icon.height ?? data.height ?? 16;
          fs.mkdirSync(cacheDirectory, {recursive: true});
          fs.writeFileSync(cachedFile,
            `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
            `viewBox="${icon.left ?? 0} ${icon.top ?? 0} ${width} ${height}">${icon.body}</svg>`);
        }
        let svg = fs.readFileSync(cachedFile, 'utf8');
        const color = url.searchParams.get('color');
        if (color) svg = svg.replaceAll('currentColor', color);
        response.setHeader('Content-Type', 'image/svg+xml');
        response.end(svg);
      });
    },
  };
}

/** Reçoit les événements sonores d'une scène (`sfxFlush`) et les écrit dans `sfx/<scène>.json`. */
function sfxRecorder(): Plugin {
  return {
    name: 'sfx-recorder',
    configureServer(server) {
      server.middlewares.use('/__sfx', (request, response) => {
        const sceneName = (request.url ?? '').replace(/[^a-z0-9-]/gi, '');
        let body = '';
        request.on('data', chunk => (body += chunk));
        request.on('end', () => {
          if (sceneName) {
            fs.mkdirSync('sfx', {recursive: true});
            fs.writeFileSync(path.join('sfx', `${sceneName}.json`), body);
          }
          response.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    iconifyCache(),
    sfxRecorder(),
    motionCanvas(),
    ffmpeg(),
  ],
});
