'use strict';
/**
 * Модульная система анализа производительности
 * Экспортирует все компоненты для анализа performance
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.RuntimeMetricsAnalyzer = exports.BundleSizeAnalyzer = exports.PerformanceChecker = void 0;
exports.createPerformanceChecker = createPerformanceChecker;
exports.quickPerformanceAnalysis = quickPerformanceAnalysis;
// Основные компоненты
var PerformanceChecker_1 = require('./PerformanceChecker');
Object.defineProperty(exports, 'PerformanceChecker', {
  enumerable: true,
  get: function () {
    return PerformanceChecker_1.PerformanceChecker;
  },
});
var BundleSizeAnalyzer_1 = require('./BundleSizeAnalyzer');
Object.defineProperty(exports, 'BundleSizeAnalyzer', {
  enumerable: true,
  get: function () {
    return BundleSizeAnalyzer_1.BundleSizeAnalyzer;
  },
});
var RuntimeMetricsAnalyzer_1 = require('./RuntimeMetricsAnalyzer');
Object.defineProperty(exports, 'RuntimeMetricsAnalyzer', {
  enumerable: true,
  get: function () {
    return RuntimeMetricsAnalyzer_1.RuntimeMetricsAnalyzer;
  },
});
/**
 * Фабричная функция для создания настроенного PerformanceChecker
 */
const PerformanceChecker_2 = require('./PerformanceChecker');
const BundleSizeAnalyzer_2 = require('./BundleSizeAnalyzer');
const RuntimeMetricsAnalyzer_2 = require('./RuntimeMetricsAnalyzer');
function createPerformanceChecker(config) {
  const checker = new PerformanceChecker_2.PerformanceChecker(config);
  // Регистрируем базовые анализаторы
  if (config?.enableBundleAnalysis !== false) {
    checker.registerAnalyzer(new BundleSizeAnalyzer_2.BundleSizeAnalyzer());
  }
  // Регистрируем runtime анализатор
  if (config?.enableRuntimeAnalysis !== false) {
    checker.registerAnalyzer(new RuntimeMetricsAnalyzer_2.RuntimeMetricsAnalyzer());
  }
  return checker;
}
/**
 * Быстрый анализ производительности проекта
 */
async function quickPerformanceAnalysis(projectPath) {
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
    resolvePath: relativePath => `${projectPath}/${relativePath}`,
  };
  try {
    const results = await checker.check(project);
    return {
      success: true,
      overallScore: results.find(r => r.id === 'performance-overview')?.score || 0,
      results,
      summary: {
        totalChecks: results.length,
        passedChecks: results.filter(r => r.passed).length,
        failedChecks: results.filter(r => !r.passed).length,
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
//# sourceMappingURL=index.js.map
