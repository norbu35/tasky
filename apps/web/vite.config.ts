import path from 'node:path';

import react from '@vitejs/plugin-react';
import sri from 'vite-plugin-sri3';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), sri()],
  envDir: path.resolve(__dirname, '../..'),
  server: {
    port: 5173,
  },
});
