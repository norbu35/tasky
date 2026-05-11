import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { sri } from 'vite-plugin-sri3';

export default defineConfig({
  plugins: [react(), sri()],
  envDir: path.resolve(__dirname),
  build: {
    // Generate hidden sourcemaps for Sentry upload; they are not exposed to
    // the browser (the `hidden` value omits the sourceMappingURL comment).
    sourcemap: 'hidden',
  },
  server: {
    port: 5173,
  },
});
