import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the web app (port 5173) forwards API calls to the Express backend (port 3000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
