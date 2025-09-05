import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],

  // Настройки разработки
  server: {
    port: 3000,
    host: true,
    open: true,
    hmr: {
      overlay: true,
    },
  },

  // Настройки сборки
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte'],
          three: ['three'],
          animations: ['gsap', 'lottie-web', 'framer-motion'],
        },
      },
    },
  },

  // Алиасы для удобного импорта
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
      $components: path.resolve('./src/components'),
      $stores: path.resolve('./src/stores'),
      $assets: path.resolve('./src/assets'),
      $utils: path.resolve('./src/utils'),
      $data: path.resolve('./src/data'),
    },
  },

  // Настройки CSS
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";',
      },
    },
  },

  // Настройки тестирования
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    includeSource: ['src/**/*.{js,ts,svelte}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.test.{js,ts,svelte}',
        '**/*.spec.{js,ts,svelte}',
        '**/dist/**',
      ],
    },
  },

  // Оптимизация зависимостей
  optimizeDeps: {
    include: ['three', 'gsap', 'lottie-web'],
  },
});
