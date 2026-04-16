import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import sri from 'vite-plugin-sri3';

export default defineConfig({
  plugins: [react(), sri()],
  envDir: path.resolve(__dirname, '../..'),
  server: {
    port: 5173,
  },
});
