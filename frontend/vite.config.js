import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      outDir: 'build',
      sourcemap: false,
    },
    server: {
      port: 3000,
      host: true,
    },
    define: {
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(backendUrl),
      'process.env.PUBLIC_URL': JSON.stringify(''),
      'process.env': JSON.stringify({
        REACT_APP_BACKEND_URL: backendUrl,
        NODE_ENV: mode === 'production' ? 'production' : 'development',
      }),
    },
  };
});
