import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',

    // Настройки параллелизма и изоляции
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        useAtomics: true,
      },
    },

    // Покрытие кода (включаем в CI или явно через переменную окружения COVERAGE=true)
    coverage: {
      enabled: process.env.CI === 'true' || process.env.COVERAGE === 'true',
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      reportsDirectory: './coverage',

      // Настройки покрытия
      all: true,

      // Включения и исключения
      include: ['src/**/*.{js,ts,svelte}'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.d.ts',
        'src/**/*.test.{js,ts,svelte}',
        'src/**/*.spec.{js,ts,svelte}',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/**/vendor/**',
        'src/**/dist/**',
        'src/**/build/**',
        'src/**/*.config.{js,ts}',
        'src/**/types/**',
      ],

      // Пороги для неуспешного завершения
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 65,
        statements: 75,
      },
    },

    // Таймауты
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 5000,

    // Retry logic для нестабильных тестов
    retry: 2,

    // Фильтры и игнорирование
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/coverage/**',
      '**/*.config.{js,ts}',
    ],

    // Репортеры
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/report.html',
    },

    // Переменные окружения для тестов
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
    },

    // Мокирование
    clearMocks: true,
    restoreMocks: true,

    // Настройки для watch режима
    watch: true,

    // Настройки для snapshot тестов
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace('/src/', '/src/__snapshots__/') + snapExtension;
    },

    // Setup файлы
    setupFiles: ['./src/test/setup.ts', './src/test/custom-matchers.ts'],
  },

  // Разрешение алиасов для Vitest
  resolve: {
    alias: {
      $lib: resolve('./src/lib'),
      $components: resolve('./src/components'),
      $stores: resolve('./src/stores'),
      $assets: resolve('./src/assets'),
      $utils: resolve('./src/utils'),
      $data: resolve('./src/data'),
      $config: resolve('./src/config'),
      $types: resolve('./src/types'),
      '@': resolve('./src'),
    },
  },

  // Настройки для dev dependencies в тестах
  define: {
    __TEST__: true,
    __DEV__: false,
    __PROD__: false,
  },
});
