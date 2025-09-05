import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig } from 'vite';

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

  // Оптимизация зависимостей
  optimizeDeps: {
    include: ['three', 'gsap', 'lottie-web'],
  },
});
