import { Agent } from 'node:https';
import * as tls from 'node:tls';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig(({ command, mode }) => {
  // Dev only: when VITE_API_URL points at a deployed backend (e.g. Render), the browser would be
  // blocked by that backend's CORS allow-list. Instead the app calls `/api` on the dev server, which
  // forwards to the real backend server-side, where CORS doesn't apply. Production builds are untouched.
  const envDir = fileURLToPath(new URL('.', import.meta.url));
  const apiUrl = loadEnv(mode, envDir, 'VITE_').VITE_API_URL || '';
  const remoteApi =
    command === 'serve' && /^https?:\/\//.test(apiUrl) && !/\/\/(localhost|127\.0\.0\.1)[:/]/.test(apiUrl);
  // Needs a path such as `/api` to proxy; proxying `/` would swallow the app itself.
  const apiPath = remoteApi ? new URL(apiUrl).pathname.replace(/\/$/, '') : '';
  const api = apiPath ? new URL(apiUrl) : null;
  const proxy: Record<string, ProxyOptions> | undefined = api
    ? {
        [apiPath]: {
          target: api.origin,
          changeOrigin: true,
          // Also trust the OS certificate store, so antivirus HTTPS scanning (e.g. AVG) or a company
          // network certificate doesn't break the proxy. Certificates are still verified.
          // (Needs Node 22.15+; older Node falls back to its built-in list.)
          agent:
            typeof tls.getCACertificates === 'function'
              ? new Agent({
                  // Render closes idle connections; reusing one fails with ECONNRESET, so open a fresh one each time.
                  keepAlive: false,
                  ca: [...tls.getCACertificates('default'), ...tls.getCACertificates('system')],
                })
              : undefined,
          // Send it like a server-to-server call so the backend doesn't log a CORS refusal for localhost.
          configure: (server) => server.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin')),
        },
      }
    : undefined;

  return {
    // Dev only: hold Option+Shift (Mac) or Alt+Shift (Windows) and click anything on the page to open its source in VS Code.
    plugins: [
      codeInspectorPlugin({ bundler: 'vite', editor: 'code', openIn: 'reuse', hotKeys: ['altKey', 'shiftKey'] }),
      react(),
    ],
    // `@/lib/format` instead of `../../../lib/format` — files can move without breaking their imports.
    // fileURLToPath (not `.pathname`) so folders with spaces, like "Lotnis project", resolve on Windows.
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { proxy },
    // Point the app at the dev server's proxy instead of the remote backend.
    define: api ? { 'import.meta.env.VITE_API_URL': JSON.stringify(apiPath) } : undefined,
  };
});
