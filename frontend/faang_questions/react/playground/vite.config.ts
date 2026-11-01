import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Playground dev server for the POSA react track.
// Each task lives in `../<NNN>_<name>/demo.tsx` and is auto-discovered by
// src/App.tsx via import.meta.glob — no manual registration needed.
// Run from the repo root: npm run dev:react
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
  server: {
    open: true,
    fs: {
      // demos import task components from the parent folder
      allow: ['../..', '../../../../node_modules'],
    },
  },
});
