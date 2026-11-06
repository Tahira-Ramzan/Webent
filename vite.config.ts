import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev: Vite serves the app on 5173 and proxies /api to the Express server on 8787,
 * so the browser only ever talks to one origin (no CORS, no absolute localhost URLs).
 * Prod: `npm run build` then `npm start` — Express serves dist/ and the API together.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allow the sandbox preview host through Vite's host check.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/sitemap.xml': 'http://127.0.0.1:8787',
      '/robots.txt': 'http://127.0.0.1:8787',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2019',
  },
});
