import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false,
    host: true,
    watch: {
      ignored: [
        '**/*.zip',
        '**/*.tar.gz',
        '**/*.rar',
        '**/dist/**',
        '**/.git/**',
        '**/*.log'
      ]
    }
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096
  }
});
