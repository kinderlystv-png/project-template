/**
 * Типы для модуля тестирования
 * Описывают структуры данных для обмена информацией между чекерами
 */

/**
 * Информация о тестовом фреймворке
 */
export interface FrameworkInfo {
  /** Название фреймворка (vitest, jest, etc.) */
  name: string;
  /** Версия фреймворка из package.json */
  version?: string;
  /** Путь к конфигурационному файлу */
  configPath?: string;
  /** Активен ли фреймворк в проекте */
  enabled: boolean;
  /** Тип фреймворка */
  type: 'unit' | 'e2e' | 'coverage';
}

/**
 * Конфигурация покрытия кода
 */
export interface CoverageConfig {
  /** Включено ли покрытие */
  enabled: boolean;
  /** Пороговые значения покрытия */
  thresholds?: {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
  };
  /** Репортеры для отчетов о покрытии */
  reporters?: string[];
  /** Исключенные файлы/директории */
  exclude?: string[];
}

/**
 * Данные о покрытии кода из отчетов
 */
export interface CoverageData {
  /** Общее покрытие в процентах */
  total: number;
  /** Покрытие строк */
  lines: number;
  /** Покрытие веток */
  branches: number;
  /** Покрытие функций */
  functions: number;
  /** Покрытие операторов */
  statements: number;
  /** Детальная информация по файлам */
  files?: Array<{
    path: string;
    coverage: number;
    lines: { covered: number; total: number };
    branches: { covered: number; total: number };
    functions: { covered: number; total: number };
  }>;
}

/**
 * Информация о тестовых файлах
 */
export interface TestFileInfo {
  /** Абсолютный путь к файлу */
  path: string;
  /** Относительный путь от корня проекта */
  relativePath: string;
  /** Тип теста */
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  /** Размер файла в байтах */
  size: number;
  /** Предполагаемое количество тестов в файле */
  estimatedTestCount?: number;
  /** Количество тестов (алиас для совместимости) */
  estimatedTests: number;
  /** Фреймворк для тестирования */
  framework?: string;
  /** Найденные паттерны в файле */
  patterns: string[];
}

/**
 * Статистика по тестам
 */
export interface TestStatistics {
  /** Общее количество тестовых файлов */
  totalTestFiles: number;
  /** Количество unit тестов */
  unitTests: number;
  /** Количество integration тестов */
  integrationTests: number;
  /** Количество E2E тестов */
  e2eTests: number;
  /** Соотношение тестовых файлов к исходным */
  testToSourceRatio: number;
  /** Общий размер тестовых файлов */
  totalTestSize: number;
}

/**
 * Полная информация о тестировании в проекте
 */
export interface ProjectTestingInfo {
  /** Найденные тестовые фреймворки */
  frameworks: FrameworkInfo[];
  /** Конфигурация покрытия кода */
  coverage: CoverageConfig;
  /** Найденные тестовые файлы */
  testFiles: TestFileInfo[];
  /** Статистика по тестам */
  statistics: TestStatistics;
  /** Есть ли тесты в проекте */
  hasTests: boolean;
  /** Есть ли E2E тесты */
  hasE2ETests: boolean;
  /** Включено ли покрытие кода */
  hasCoverage: boolean;
  /** NPM скрипты для тестирования */
  testScripts: string[];
}

/**
 * Результат анализа одного аспекта тестирования
 */
export interface TestingAnalysisResult {
  /** Тип анализа */
  type: 'framework' | 'coverage' | 'e2e' | 'files';
  /** Статус анализа */
  status: 'passed' | 'failed' | 'warning';
  /** Оценка (0-100) */
  score: number;
  /** Детальное сообщение */
  message: string;
  /** Рекомендации по улучшению */
  recommendations: string[];
  /** Дополнительные данные */
  metadata?: Record<string, any>;
}
