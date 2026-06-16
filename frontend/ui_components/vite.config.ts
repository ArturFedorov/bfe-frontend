import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single dev server for every component playground.
// Each component lives in `<NNN>_<name>/react/App.tsx` and is auto-discovered
// by src/App.tsx via import.meta.glob — no manual registration needed.
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
});
