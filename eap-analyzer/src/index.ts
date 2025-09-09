/**
 * Эталонный Анализатор Проектов (ЭАП) v3.0
 * Современная архитектура с модульной системой
 */

// === НОВАЯ АРХИТЕКТУРА v3.0 ===

// Основные классы архитектуры
export { BaseChecker, BaseAnalyzer, AnalysisOrchestrator } from './core/index.js';

// Типы и интерфейсы
export type {
  CheckContext,
  CheckResult,
  FullAnalysisResult,
  AnalysisSummary,
  AnalysisConfig,
} from './core/types.js';

// Универсальные чекеры
export {
  SecurityChecker,
  PerformanceChecker,
  CodeQualityChecker,
  TestingChecker,
  UNIVERSAL_CHECKERS,
} from './checkers/index.js';

// Модули анализа
export {
  // EMT Module
  EMTAnalyzer,
  EMTModule,
  EMTRoutesChecker,
  EMTConfigChecker,
  EMTDependenciesChecker,

  // Docker Module
  DockerAnalyzer,
  DockerModule,
  DockerSecurityChecker,
  DockerOptimizationChecker,

  // Коллекции
  ALL_MODULES,
  ALL_ANALYZERS,
  ALL_MODULE_CHECKERS,
} from './modules/index.js';

// Типы модулей
export type {
  EMTMetrics,
  EMTRoute,
  EMTComponent,
  EMTService,
  DockerMetrics,
  DockerFile,
} from './modules/index.js';

// === LEGACY СОВМЕСТИМОСТЬ ===

// Основные классы (legacy)
export { GoldenStandardAnalyzer } from './analyzer.js';

// AI Enhanced модули (legacy)
export { AIEnhancedAnalyzer } from './ai-integration/index.js';
export { AIReportGenerator } from './ai-integration/report-generator.js';

// AI модули (legacy)
export { FeatureExtractor } from './modules/ai-insights/feature-extractor.js';
export { QualityPredictor } from './modules/ai-insights/quality-predictor.js';
export { AIInsightsEngine } from './modules/ai-insights/ai-insights-engine.js';

// Legacy чекеры
export { DockerChecker } from './checkers/docker.js';
export { EMTChecker } from './checkers/emt.js';

// Утилиты
export * from './utils/index.js';

// Legacy типы
export * from './types/index.js';
export * from './modules/ai-insights/types.js';

// Тестовая функция
export { testAnalyzer } from './test.js';

// === ГЛАВНЫЕ ЭКСПОРТЫ v3.0 ===

// Основной анализатор новой архитектуры
import { AnalysisOrchestrator } from './core/orchestrator.js';
import { UNIVERSAL_CHECKERS } from './checkers/index.js';
import { ALL_MODULE_CHECKERS } from './modules/index.js';

/**
 * Создает готовый к использованию анализатор с полной конфигурацией
 */
export function createEAPAnalyzer(): AnalysisOrchestrator {
  const orchestrator = new AnalysisOrchestrator();

  // Регистрируем универсальные чекеры
  UNIVERSAL_CHECKERS.forEach(CheckerClass => {
    const checker = new CheckerClass();
    orchestrator.registerChecker((checker as any).getName?.() || checker.constructor.name, checker);
  });

  // Регистрируем модульные чекеры
  ALL_MODULE_CHECKERS.forEach(CheckerClass => {
    const checker = new CheckerClass();
    orchestrator.registerChecker((checker as any).getName?.() || checker.constructor.name, checker);
  });

  return orchestrator;
}

/**
 * Готовый к использованию анализатор с полной конфигурацией
 */
export const EAPAnalyzer = createEAPAnalyzer();

/**
 * Версия API
 */
export const VERSION = '3.0.0';

/**
 * Информация о модуле
 */
export const MODULE_INFO = {
  name: 'EAP Analyzer',
  version: VERSION,
  description: 'Эталонный Анализатор Проектов с модульной архитектурой',
  architecture: 'v3.0 - Modular',
  features: [
    'Unified module system',
    'Universal checkers',
    'Orchestrator coordination',
    'Type-safe architecture',
    'Legacy compatibility',
  ],
} as const;
