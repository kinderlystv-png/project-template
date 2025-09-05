import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],

    // Покрытие кода
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{js,ts,svelte}',
        '**/*.spec.{js,ts,svelte}',
        '**/vendor/**',
        '**/dist/**',
        '**/build/**',
      ],
    },

    // Таймауты
    testTimeout: 10000,

    // Фильтры и игнорирование
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.svelte-kit/**'],
  },
});
