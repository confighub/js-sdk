import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Resolve the workspace libraries to their TypeScript source so editing a package
// hot-reloads here without a rebuild. A consumer outside this monorepo just installs
// `@confighub/api` and `@confighub/react-auth` and drops these aliases.
const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  // The redirect_uri registered with `cub oauthclient create` must match, so pin the port.
  server: { port: 5173, strictPort: true },
  resolve: {
    alias: {
      '@confighub/api': src('../../packages/api/src/index.ts'),
      '@confighub/react-auth': src('../../packages/react-auth/src/index.ts'),
    },
  },
});
