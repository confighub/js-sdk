import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Resolve the workspace libraries to source so editing a package hot-reloads here. A
// consumer outside this monorepo installs the published packages and drops these.
const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  resolve: {
    alias: {
      '@confighub/api': src('../../packages/api/src/index.ts'),
      '@confighub/react-auth': src('../../packages/react-auth/src/index.ts'),
      '@confighub/rtk-query': src('../../packages/rtk-query/src/index.ts'),
    },
  },
});
