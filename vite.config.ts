import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // No manualChunks, deliberately: the object form welds shared deps into the vendor chunk and
  // makes the ENTRY import it statically — measured FCP 5,808 ms with it, 1,696 ms without.
  // PGlite stays off the first frame (NFR-PERF-02) by being imported dynamically instead.
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },

  build: {
    target: 'es2022',
  },
});
