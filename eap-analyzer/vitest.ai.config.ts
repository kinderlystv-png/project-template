import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/ai-insights/**/*.test.ts'],
    exclude: ['tests/svelte/**', 'tests/integration/**'],
    globals: true,
    // Изолированная среда для AI модулей
    isolate: true,
    // Отключаем watch mode для стабильности
    watch: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@modules': resolve(__dirname, './src/modules'),
      '@ai-insights': resolve(__dirname, './src/modules/ai-insights'),
    },
  },
  esbuild: {
    target: 'node18',
  },
});
