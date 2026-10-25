import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  // Dev only: hold Option+Shift (Mac) or Alt+Shift (Windows) and click anything on the page to open its source in VS Code.
  plugins: [
    codeInspectorPlugin({ bundler: 'vite', editor: 'code', openIn: 'reuse', hotKeys: ['altKey', 'shiftKey'] }),
    react(),
  ],
  // `@/lib/format` instead of `../../../lib/format` — files can move without breaking their imports.
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
