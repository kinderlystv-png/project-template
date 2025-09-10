/**
 * Модульная система анализа производительности
 * Экспортирует все компоненты для анализа performance
 */

// Основные компоненты
export { PerformanceChecker } from './PerformanceChecker';
export { BundleSizeAnalyzer } from './BundleSizeAnalyzer';
export { RuntimeMetricsAnalyzer } from './RuntimeMetricsAnalyzer';

// Типы и интерфейсы
export type {
  IPerformanceAnalyzer,
  PerformanceResult,
  PerformanceConfig,
} from './PerformanceChecker';

/**
 * Фабричная функция для создания настроенного PerformanceChecker
 */
import { PerformanceChecker } from './PerformanceChecker';
import { BundleSizeAnalyzer } from './BundleSizeAnalyzer';
import { RuntimeMetricsAnalyzer } from './RuntimeMetricsAnalyzer';
import { CheckResult } from '../../types/CheckResult';

export function createPerformanceChecker(config?: {
  bundleSizeThreshold?: number;
  loadTimeThreshold?: number;
  memoryThreshold?: number;
  enableRuntimeAnalysis?: boolean;
  enableBundleAnalysis?: boolean;
  enableDependencyAnalysis?: boolean;
}): PerformanceChecker {
  const checker = new PerformanceChecker(config);

  // Регистрируем базовые анализаторы
  if (config?.enableBundleAnalysis !== false) {
    checker.registerAnalyzer(new BundleSizeAnalyzer());
  }

  // Регистрируем runtime анализатор
  if (config?.enableRuntimeAnalysis !== false) {
    checker.registerAnalyzer(new RuntimeMetricsAnalyzer());
  }

  return checker;
}

/**
 * Быстрый анализ производительности проекта
 */
export async function quickPerformanceAnalysis(projectPath: string) {
  const checker = createPerformanceChecker();

  // Создаем mock Project объект
  const project = {
    path: projectPath,
    name: 'analysis-project',
    getFileList: async () => [],
    getFileStats: async () => ({
      size: 0,
      isFile: true,
      isDirectory: false,
      created: new Date(),
      modified: new Date(),
    }),
    readFile: async () => '',
    hasFile: async () => false,
    exists: async () => true,
    resolvePath: (relativePath: string) => `${projectPath}/${relativePath}`,
  };

  try {
    const results = await checker.check(project);

    return {
      success: true,
      overallScore: results.find((r: CheckResult) => r.id === 'performance-overview')?.score || 0,
      results,
      summary: {
        totalChecks: results.length,
        passedChecks: results.filter((r: CheckResult) => r.passed).length,
        failedChecks: results.filter((r: CheckResult) => !r.passed).length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
    };
  }
}
