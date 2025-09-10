/**
 * Константы для модуля тестирования
 * Все пороговые значения, паттерны и сообщения для тестовых чекеров
 */

/**
 * Пороговые значения для тестирования
 */
export const TESTING_THRESHOLDS = {
  MIN_COVERAGE_PERCENTAGE: 75, // Минимальное покрытие кода
  MIN_TEST_FILES: 3, // Минимальное количество тестовых файлов
  MIN_UNIT_TESTS: 10, // Минимальное количество unit тестов
  MIN_E2E_TESTS: 2, // Минимальное количество E2E тестов
  CRITICAL_COVERAGE_THRESHOLD: 90, // Покрытие для критичного кода
  ACCEPTABLE_TEST_RATIO: 0.3, // Соотношение тестовых файлов к исходным
  COVERAGE_THRESHOLD: 75, // Основной порог покрытия кода
} as const;

/**
 * Паттерны для поиска тестовых файлов
 */
export const TEST_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/, // file.test.js/ts/jsx/tsx
  /\.spec\.[jt]sx?$/, // file.spec.js/ts/jsx/tsx
  /__tests__\/.*\.[jt]sx?$/, // __tests__/file.js/ts/jsx/tsx
  /-test\.[jt]sx?$/, // file-test.js/ts/jsx/tsx
  /\.e2e\.[jt]sx?$/, // file.e2e.js/ts/jsx/tsx
  /\.integration\.[jt]sx?$/, // file.integration.js/ts/jsx/tsx
] as const;

/**
 * Стандартные директории для тестов
 */
export const TEST_DIRECTORIES = [
  'tests',
  'test',
  '__tests__',
  'src/__tests__',
  'e2e',
  'tests/unit',
  'tests/integration',
  'tests/e2e',
  'test/unit',
  'test/integration',
  'test/e2e',
] as const;

/**
 * Поддерживаемые тестовые фреймворки
 */
export const SUPPORTED_FRAMEWORKS = {
  UNIT_TESTING: [
    'vitest',
    'jest',
    '@testing-library/react',
    '@testing-library/vue',
    '@testing-library/svelte',
    'mocha',
    'jasmine',
    'ava',
    'tape',
  ],
  E2E_TESTING: [
    'playwright',
    '@playwright/test',
    'cypress',
    'testcafe',
    'puppeteer',
    'webdriverio',
  ],
  COVERAGE_TOOLS: ['c8', 'nyc', 'istanbul', 'codecov', 'coveralls'],
} as const;

/**
 * Конфигурационные файлы для различных фреймворков
 */
export const CONFIG_FILES = {
  vitest: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js'],
  jest: ['jest.config.js', 'jest.config.ts', 'jest.config.json'],
  playwright: ['playwright.config.ts', 'playwright.config.js'],
  cypress: ['cypress.config.ts', 'cypress.config.js', 'cypress.json'],
  coverage: ['.nycrc', '.nycrc.json', 'codecov.yml', '.codecov.yml'],
} as const;

/**
 * Стандартные сообщения и рекомендации
 */
export const MESSAGES = {
  FRAMEWORK_NOT_FOUND: 'Тестовый фреймворк не обнаружен в проекте',
  TESTS_NOT_FOUND: 'Тестовые файлы не найдены',
  COVERAGE_DISABLED: 'Покрытие кода не настроено',
  E2E_NOT_CONFIGURED: 'E2E тестирование не настроено',
  NO_VITEST_DEPENDENCY: 'Vitest не найден в зависимостях проекта',
  NO_VITEST_CONFIG: 'Конфигурация Vitest не найдена',
  NO_COVERAGE_CONFIG: 'Конфигурация покрытия кода не найдена',
  NO_TEST_FILES: 'Тестовые файлы не найдены',

  RECOMMENDATIONS: {
    INSTALL_VITEST: 'Установите Vitest: npm install --save-dev vitest',
    CREATE_TEST_DIR: 'Создайте директорию tests/ для организации тестов',
    ENABLE_COVERAGE: 'Включите покрытие кода в конфигурации тестирования',
    ADD_E2E_TESTS: 'Добавьте E2E тесты для критических пользовательских сценариев',
    INCREASE_COVERAGE: 'Увеличьте покрытие кода до рекомендуемого уровня (75%+)',
    SETUP_CI_TESTING: 'Настройте автоматическое тестирование в CI/CD pipeline',
  },
} as const;

/**
 * Весовые коэффициенты для различных типов проверок
 */
export const CHECK_WEIGHTS = {
  FRAMEWORK_PRESENCE: 25, // Наличие тестового фреймворка
  TEST_FILES_EXISTENCE: 20, // Наличие тестовых файлов
  COVERAGE_CONFIGURATION: 20, // Настройка покрытия кода
  COVERAGE_PERCENTAGE: 15, // Процент покрытия
  E2E_SETUP: 10, // Настройка E2E тестов
  TEST_SCRIPTS: 10, // NPM скрипты для тестов
} as const;
