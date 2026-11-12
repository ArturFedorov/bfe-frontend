import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Campaign Studio dev server. Run from the repo root: npm run dev:campaign
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
  server: {
    open: true,
    fs: {
      allow: ['.', '../../../node_modules'],
    },
  },
});
