import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const defaultAllowedHosts = ['pricely.grmeireles.dev'];
const allowedHosts = [
  ...defaultAllowedHosts,
  ...(process.env.VITE_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean),
];
const allowAllHosts = process.env.VITE_ALLOW_ALL_HOSTS === 'true';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    allowedHosts: allowAllHosts ? true : allowedHosts,
  },
  test: {
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
