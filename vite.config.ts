import { defineConfig } from 'vite';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Pyxel2/' : '/',
  build: {
    rollupOptions: {
      input: {
        game: resolve('index.html'),
        characterLab: resolve('character-lab.html'),
        lyraLab: resolve('lyra-lab.html'),
      },
    },
  },
  plugins: [
    {
      name: 'aseprite-art',
      configureServer(server) {
        const dir = resolve('assets/sprites');
        let timer: ReturnType<typeof setTimeout>;
        server.watcher.add(dir);
        server.watcher.on('all', (_, path) => {
          if (!path.startsWith(dir) || !path.endsWith('.aseprite')) return;
          clearTimeout(timer);
          timer = setTimeout(
            () =>
              execFile(process.execPath, ['tools/aseprite-import.mjs'], (error) => {
                if (error) server.config.logger.error(error.message);
                else server.ws.send({ type: 'full-reload' });
              }),
            200,
          );
        });
      },
    },
  ],
});
