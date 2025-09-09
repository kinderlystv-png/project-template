/**
 * Экспорт всех чекеров ЭАП (старых и новых)
 */

// Новые унифицированные чекеры
export * from './docker';

// Старые чекеры (для обратной совместимости)
import { SecurityChecker } from './security.checker.js';
import { PerformanceChecker } from './performance.checker.js';
import { CodeQualityChecker } from './code-quality.checker.js';
import { TestingChecker } from './testing.checker.js';

export * from './security.checker.js';
export * from './performance.checker.js';
export * from './code-quality.checker.js';
export * from './testing.checker.js';

// Массив всех универсальных чекеров
export const UNIVERSAL_CHECKERS = [
  SecurityChecker,
  PerformanceChecker,
  CodeQualityChecker,
  TestingChecker,
] as const;
