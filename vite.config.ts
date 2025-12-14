import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages - update if your repository name is different
// For root domain (username.github.io), use base: '/'
const BASE_PATH = '/json_schema_builder/';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? BASE_PATH : '/',
}));
