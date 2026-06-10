import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Убираем crossorigin с <script type="module"> — в TG WebView иногда ломает загрузку бандла. */
function stripCrossorigin(): { name: string; transformIndexHtml: (html: string) => string } {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripCrossorigin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
