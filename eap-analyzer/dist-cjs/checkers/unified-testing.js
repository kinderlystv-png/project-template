'use strict';
/**
 * TestingChecker - Интегрированный анализатор тестирования
 *
 * Phase 4.2: Интеграция UnifiedTestingAnalyzer с AnalysisOrchestrator
 *
 * Использует ProcessIsolatedAnalyzer для безопасного запуска
 * UnifiedTestingAnalyzer в изолированном процессе
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TestingChecker = void 0;
const ProcessIsolatedAnalyzer_js_1 = require('../orchestrator/ProcessIsolatedAnalyzer.js');
class TestingChecker {
  static analyzer = new ProcessIsolatedAnalyzer_js_1.ProcessIsolatedAnalyzer();
  /**
   * Статический метод для интеграции с AnalysisOrchestrator
   */
  static async checkComponent(context) {
    const startTime = Date.now();
    try {
      console.log('🧪 Запуск UnifiedTestingAnalyzer через изолированный процесс...');
      // Запускаем UnifiedTestingAnalyzer в изолированном процессе
      const analysisResult = await this.analyzer.runUnifiedAnalysis(context);
      // Преобразуем результат UnifiedTestingAnalyzer в формат CheckResult[]
      const checkResults = this.convertToCheckResults(analysisResult);
      // Формируем ComponentResult в стиле EMTChecker
      return this.createComponentResult(checkResults, startTime);
    } catch (error) {
      console.error('❌ Ошибка TestingChecker:', error);
      // Возвращаем результат с ошибкой
      return this.createErrorResult(error, startTime);
    }
  }
  /**
   * Преобразует результат UnifiedTestingAnalyzer в CheckResult[]
   */
  static convertToCheckResults(analysisResult) {
    const results = [];
    if (!analysisResult) {
      return [
        {
          check: {
            id: 'testing.unified.error',
            name: 'Unified Testing Analysis',
            description: 'Анализ не выполнен - нет результата',
            category: 'testing',
            score: 100,
            level: 'high',
            tags: ['unified', 'error'],
          },
          passed: false,
          score: 0,
          maxScore: 100,
          details: 'Анализ не был выполнен',
          duration: 0,
        },
      ];
    }
    try {
      // Обрабатываем основные метрики
      if (analysisResult.summary) {
        const summary = analysisResult.summary;
        // Общий результат анализа
        results.push({
          check: {
            id: 'testing.unified.overall',
            name: 'Unified Testing Overall',
            description: 'Общий результат унифицированного анализа тестирования',
            category: 'testing',
            score: 100,
            level: 'high',
            tags: ['unified', 'overall'],
          },
          passed: summary.score >= 70, // Порог успешности
          score: summary.score || 0,
          maxScore: 100,
          details: `Общий балл: ${summary.score}%`,
          duration: summary.executionTime || 0,
        });
        // Покрытие кода
        if (summary.coverage !== undefined) {
          results.push({
            check: {
              id: 'testing.unified.coverage',
              name: 'Code Coverage',
              description: 'Покрытие кода тестами',
              category: 'testing',
              score: 100,
              level: 'high',
              tags: ['coverage', 'quality'],
            },
            passed: summary.coverage >= 75,
            score: summary.coverage || 0,
            maxScore: 100,
            details: `Покрытие кода: ${summary.coverage}%`,
            duration: 0,
          });
        }
        // Качество тестов
        if (summary.testQuality !== undefined) {
          results.push({
            check: {
              id: 'testing.unified.quality',
              name: 'Test Quality',
              description: 'Качество тестового кода',
              category: 'testing',
              score: 100,
              level: 'medium',
              tags: ['quality', 'tests'],
            },
            passed: summary.testQuality >= 70,
            score: summary.testQuality || 0,
            maxScore: 100,
            details: `Качество тестов: ${summary.testQuality}%`,
            duration: 0,
          });
        }
      }
      // Обрабатываем детальные результаты
      if (analysisResult.details) {
        const details = analysisResult.details;
        // Анализ файлов тестов
        if (details.testFiles && details.testFiles.length > 0) {
          results.push({
            check: {
              id: 'testing.unified.files',
              name: 'Test Files Analysis',
              description: 'Анализ файлов тестов',
              category: 'testing',
              score: 100,
              level: 'medium',
              tags: ['files', 'structure'],
            },
            passed: details.testFiles.length > 0,
            score: Math.min(details.testFiles.length * 10, 100),
            maxScore: 100,
            details: `Найдено ${details.testFiles.length} файлов тестов`,
            duration: 0,
          });
        }
        // Анализ фреймворков
        if (details.frameworks && Object.keys(details.frameworks).length > 0) {
          const frameworkCount = Object.keys(details.frameworks).length;
          results.push({
            check: {
              id: 'testing.unified.frameworks',
              name: 'Testing Frameworks',
              description: 'Обнаруженные фреймворки тестирования',
              category: 'testing',
              score: 100,
              level: 'medium',
              tags: ['frameworks', 'tools'],
            },
            passed: frameworkCount > 0,
            score: Math.min(frameworkCount * 25, 100),
            maxScore: 100,
            details: `Обнаружено ${frameworkCount} фреймворков: ${Object.keys(details.frameworks).join(', ')}`,
            duration: 0,
          });
        }
      }
      // Если нет результатов, добавляем базовый
      if (results.length === 0) {
        results.push({
          check: {
            id: 'testing.unified.basic',
            name: 'Basic Testing Analysis',
            description: 'Базовый анализ тестирования выполнен',
            category: 'testing',
            score: 100,
            level: 'medium',
            tags: ['basic', 'success'],
          },
          passed: true,
          score: 50,
          maxScore: 100,
          details: 'Унифицированный анализ выполнен успешно',
          duration: 0,
        });
      }
    } catch (conversionError) {
      console.error('❌ Ошибка преобразования результатов:', conversionError);
      results.push({
        check: {
          id: 'testing.unified.conversion.error',
          name: 'Result Conversion Error',
          description: 'Ошибка преобразования результатов анализа',
          category: 'testing',
          score: 100,
          level: 'high',
          tags: ['error', 'conversion'],
        },
        passed: false,
        score: 0,
        maxScore: 100,
        details: `Ошибка: ${conversionError.message}`,
        duration: 0,
      });
    }
    return results;
  }
  /**
   * Создает ComponentResult в формате AnalysisOrchestrator
   */
  static createComponentResult(checkResults, startTime) {
    const passed = checkResults.filter(r => r.passed);
    const failed = checkResults.filter(r => !r.passed);
    const score = passed.reduce((sum, r) => sum + r.score, 0);
    const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return {
      component: {
        name: 'Unified Testing Analysis',
        description: 'Унифицированный анализ тестирования проекта',
        weight: 8, // высокая важность для тестирования
        checks: checkResults.map(r => r.check),
        critical: true,
      },
      score,
      maxScore,
      percentage,
      passed,
      failed,
      warnings: [],
      recommendations: this.generateRecommendations(failed),
      duration: Date.now() - startTime,
    };
  }
  /**
   * Создает результат с ошибкой
   */
  static createErrorResult(error, startTime) {
    const errorCheck = {
      id: 'testing.unified.fatal.error',
      name: 'Testing Analysis Fatal Error',
      description: 'Критическая ошибка при анализе тестирования',
      category: 'testing',
      score: 100,
      level: 'high',
      tags: ['error', 'fatal'],
    };
    const errorResult = {
      check: errorCheck,
      passed: false,
      score: 0,
      maxScore: 100,
      details: `Ошибка: ${error.message || 'Неизвестная ошибка'}`,
      duration: Date.now() - startTime,
    };
    return {
      component: {
        name: 'Unified Testing Analysis (Error)',
        description: 'Анализ тестирования завершился с ошибкой',
        weight: 1,
        checks: [errorCheck],
        critical: true,
      },
      score: 0,
      maxScore: 100,
      percentage: 0,
      passed: [],
      failed: [errorResult],
      warnings: [],
      recommendations: [
        'Проверьте установку зависимостей UnifiedTestingAnalyzer',
        'Убедитесь в корректности путей к модулям тестирования',
        'Проверьте логи процесса для детальной диагностики',
      ],
      duration: Date.now() - startTime,
    };
  }
  /**
   * Генерирует рекомендации на основе failed checks
   */
  static generateRecommendations(failedChecks) {
    const recommendations = [];
    for (const check of failedChecks) {
      switch (check.check.id) {
        case 'testing.unified.overall':
          recommendations.push('Улучшите общее покрытие и качество тестов');
          break;
        case 'testing.unified.coverage':
          recommendations.push('Увеличьте покрытие кода тестами до 75%+');
          break;
        case 'testing.unified.quality':
          recommendations.push('Улучшите качество тестового кода');
          break;
        case 'testing.unified.files':
          recommendations.push('Добавьте больше файлов тестов в проект');
          break;
        case 'testing.unified.frameworks':
          recommendations.push('Настройте фреймворки тестирования');
          break;
        default:
          recommendations.push(`Исправьте проблему: ${check.check.name}`);
      }
    }
    if (recommendations.length === 0) {
      recommendations.push('Система тестирования работает корректно');
    }
    return recommendations;
  }
  /**
   * Получает статистику производительности изолированного процесса
   */
  static getPerformanceStats() {
    return (
      this.analyzer['stats'] || {
        totalRuns: 0,
        successfulRuns: 0,
        averageExecutionTime: 0,
        lastExecutionTime: 0,
      }
    );
  }
}
exports.TestingChecker = TestingChecker;
//# sourceMappingURL=unified-testing.js.map
