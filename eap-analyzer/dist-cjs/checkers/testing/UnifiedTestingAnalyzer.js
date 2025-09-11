'use strict';
/**
 * UnifiedTestingAnalyzer - Центральный анализатор тестовой экосистемы
 * Enhanced версия с интеграцией EnhancedJestChecker
 *
 * Phase 1.1: Enhanced Jest Integration
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.UnifiedTestingAnalyzer = void 0;
const BaseChecker_js_1 = require('../../core/base/BaseChecker.js');
const AnalysisCategory_js_1 = require('../../types/AnalysisCategory.js');
const SeverityLevel_js_1 = require('../../types/SeverityLevel.js');
const { EnhancedJestChecker } = require('./checkers/EnhancedJestChecker.js');
/**
 * Унифицированный анализатор тестовой экосистемы проекта
 * Упрощенная версия для совместимости с BaseChecker
 */
class UnifiedTestingAnalyzer extends BaseChecker_js_1.BaseChecker {
  constructor() {
    super(
      'unified-testing-analyzer',
      AnalysisCategory_js_1.AnalysisCategory.TESTING,
      'Комплексный анализ всей тестовой экосистемы проекта (Unit + E2E + Coverage)',
      'EAP-Testing-Standard',
      SeverityLevel_js_1.SeverityLevel.HIGH,
      '3.0.0',
      { enabled: true, failOnError: false }
    );
  }
  /**
   * Выполняет комплексный анализ тестовой экосистемы
   */
  async analyze(files, packageJson) {
    try {
      const results = [];
      // Анализируем тестовые файлы
      const testFiles = files.filter(
        file =>
          file.includes('.test.') ||
          file.includes('.spec.') ||
          file.includes('__tests__') ||
          file.includes('test/') ||
          file.includes('tests/')
      );
      const configFiles = files.filter(
        file =>
          file.includes('jest.config') ||
          file.includes('vitest.config') ||
          file.includes('playwright.config') ||
          file.includes('cypress.config')
      );

      // Используем EnhancedJestChecker для углубленного анализа Jest
      let enhancedJestResult = null;
      const hasJest =
        packageJson.dependencies?.jest ||
        packageJson.devDependencies?.jest ||
        configFiles.some(f => f.includes('jest.config'));

      if (hasJest) {
        const enhancedJestChecker = new EnhancedJestChecker_js_1.EnhancedJestChecker();
        const jestResults = await enhancedJestChecker.analyze(files, packageJson);
        if (jestResults && jestResults.length > 0) {
          enhancedJestResult = jestResults[0];
          results.push(enhancedJestResult);
        }
      }

      // Создаем результат общего анализа
      const baseScore = this.calculateTestingScore(testFiles, configFiles, files);
      // Если есть результат от EnhancedJestChecker, учитываем его
      const finalScore = enhancedJestResult
        ? Math.max(baseScore, enhancedJestResult.score)
        : baseScore;

      const passed = finalScore >= 60;
      const result = {
        id: 'unified-testing-analysis',
        name: 'Unified Testing Analysis',
        description: 'Комплексный анализ тестовой экосистемы',
        passed,
        severity: passed
          ? SeverityLevel_js_1.SeverityLevel.LOW
          : SeverityLevel_js_1.SeverityLevel.HIGH,
        score: finalScore,
        maxScore: 100,
        message: this.generateMessage(finalScore, testFiles.length, configFiles.length),
        recommendations: this.generateRecommendations(testFiles, configFiles, enhancedJestResult),
        timestamp: new Date(),
        duration: enhancedJestResult ? 75 : 50,
      };
      results.push(result);
      return results;
    } catch (error) {
      const errorResult = {
        id: 'unified-testing-error',
        name: 'Unified Testing Error',
        description: 'Ошибка анализа тестирования',
        passed: false,
        severity: SeverityLevel_js_1.SeverityLevel.CRITICAL,
        score: 0,
        maxScore: 100,
        message: 'Ошибка при анализе тестовой экосистемы',
        recommendations: ['Проверьте структуру проекта и логи'],
        timestamp: new Date(),
        duration: 10,
      };
      return [errorResult];
    }
  }
  calculateTestingScore(testFiles, configFiles, allFiles) {
    let score = 0;
    // Базовая оценка за наличие тестовых файлов
    if (testFiles.length > 0) {
      score += 30;
    }
    // Дополнительные баллы за количество тестовых файлов
    const testRatio = testFiles.length / Math.max(allFiles.length * 0.1, 1);
    score += Math.min(testRatio * 30, 30);
    // Баллы за конфигурационные файлы
    score += configFiles.length * 15;
    // Баллы за структуру тестирования
    const hasUnitTests = testFiles.some(f => f.includes('.test.') || f.includes('.spec.'));
    const hasE2ETests = testFiles.some(
      f => f.includes('e2e') || f.includes('cypress') || f.includes('playwright')
    );
    if (hasUnitTests) score += 15;
    if (hasE2ETests) score += 10;
    return Math.min(score, 100);
  }
  generateMessage(score, testCount, configCount) {
    if (score >= 80) {
      return `Отличная тестовая экосистема (${testCount} тестов, ${configCount} конфигураций)`;
    } else if (score >= 60) {
      return `Хорошая тестовая экосистема (${testCount} тестов, ${configCount} конфигураций)`;
    } else if (score >= 30) {
      return `Базовая тестовая экосистема (${testCount} тестов, ${configCount} конфигураций)`;
    } else {
      return `Недостаточная тестовая экосистема (${testCount} тестов, ${configCount} конфигураций)`;
    }
  }
  generateRecommendations(testFiles, configFiles, enhancedJestResult) {
    const recommendations = [];

    // Если есть результат от EnhancedJestChecker, используем его рекомендации
    if (enhancedJestResult && enhancedJestResult.recommendations) {
      recommendations.push(...enhancedJestResult.recommendations);
    }

    if (testFiles.length === 0) {
      recommendations.push('Добавьте unit тесты для основных компонентов');
      recommendations.push('Настройте Jest или Vitest для тестирования');
    }
    if (configFiles.length === 0) {
      recommendations.push('Добавьте конфигурацию для тестового фреймворка');
    }
    const hasE2E = testFiles.some(
      f => f.includes('e2e') || f.includes('cypress') || f.includes('playwright')
    );
    if (!hasE2E) {
      recommendations.push('Рассмотрите добавление E2E тестов с Playwright или Cypress');
    }
    if (recommendations.length === 0) {
      recommendations.push('Отличная работа! Продолжайте поддерживать качество тестирования');
    }

    // Удаляем дубликаты рекомендаций
    return [...new Set(recommendations)];
  }
}
exports.UnifiedTestingAnalyzer = UnifiedTestingAnalyzer;
//# sourceMappingURL=UnifiedTestingAnalyzer.js.map
