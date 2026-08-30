import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // PGlite ships a wasm bundle; keep it out of the entry chunk so the first frame renders
  // before we pay for it (NFR-PERF-02).
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          pglite: ['@electric-sql/pglite'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
