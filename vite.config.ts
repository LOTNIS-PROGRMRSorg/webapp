import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // `@/lib/format` instead of `../../../lib/format` — files can move without breaking their imports.
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
