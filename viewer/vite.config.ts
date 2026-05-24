import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { benchmarkApiPlugin } from './server/benchmark-api-plugin';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react(), tailwindcss(), benchmarkApiPlugin(WORKSPACE_ROOT)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
