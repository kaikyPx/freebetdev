import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['ce71-2804-14d-7890-88da-3c57-5dfa-5dad-fd32.ngrok-free.app']
  }
});
