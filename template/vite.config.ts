import { defineConfig } from 'vite';

export default defineConfig({
  server: { open: false, port: 5173 },
  build: { target: 'es2020', outDir: 'dist' },
});
