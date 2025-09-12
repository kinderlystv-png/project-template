/**
 * Экспорт всех чекеров ЭАП (старых и новых)
 */

// Новые унифицированные чекеры
export * from './docker';
export * from './testing';

// Старые чекеры (для обратной совместимости)
import { SecurityChecker } from './security.checker.js';
import { PerformanceChecker } from './performance.checker.js';
import { CodeQualityChecker } from './code-quality.checker.js';
import { TestingChecker } from './testing.checker.js';
import { FileStructureChecker } from './structure.checker.js';

export * from './security.checker.js';
export * from './performance.checker.js';
export * from './code-quality.checker.js';
export * from './structure.checker.js';

// Массив всех универсальных чекеров
export const UNIVERSAL_CHECKERS = [
  SecurityChecker,
  PerformanceChecker,
  CodeQualityChecker,
  TestingChecker,
  FileStructureChecker,
] as const;
