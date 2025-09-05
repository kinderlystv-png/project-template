import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],

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

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts', './tests/utils/global-setup.ts'],

    // Конфигурация для разных типов тестов
    include: ['tests/**/*.{test,spec}.{js,ts,svelte}', 'src/**/*.{test,spec}.{js,ts,svelte}'],

    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      'tests/performance/**',
      'tests/visual/**',
    ],

    // Настройки покрытия
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './tests/coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.test.{js,ts,svelte}',
        '**/*.spec.{js,ts,svelte}',
        '**/dist/**',
        'src/lib/logger/examples.ts',
      ],
    },

    // Настройки производительности
    testTimeout: 10000,
    hookTimeout: 10000,

    // Параллельное выполнение
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Отчеты
    reporters: ['verbose', 'junit', 'json', 'html'],
    outputFile: {
      junit: './tests/reports/junit.xml',
      json: './tests/reports/results.json',
      html: './tests/reports/index.html',
    },

    // Моки
    clearMocks: true,
    restoreMocks: true,

    // Дополнительные настройки для Three.js и анимаций
    deps: {
      inline: ['three', 'gsap', 'lottie-web'],
    },
  },
});
