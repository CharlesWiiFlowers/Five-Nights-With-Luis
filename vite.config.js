import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Five-Nights-With-Luis/',
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  test: { include: ['tests/**/*.test.js'] },
});
