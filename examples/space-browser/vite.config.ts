import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // The redirect_uri registered with `cub oauthclient create` must match, so pin the port.
  server: { port: 5173, strictPort: true },
});
