'use strict';
/**
 * TestingAnalysisAdapter - JavaScript версия для тестирования
 * Phase 4.1: Адаптер для интеграции с AnalysisOrchestrator
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TestingAnalysisAdapter = void 0;
const ProcessIsolatedAnalyzerJS_js_1 = require('./ProcessIsolatedAnalyzerJS.js');
/**
 * Адаптер для интеграции UnifiedTestingAnalyzer с основным AnalysisOrchestrator
 */
class TestingAnalysisAdapter {
  constructor(orchestratorContext) {
    this.orchestratorContext = orchestratorContext;
    this.isolatedAnalyzer = new ProcessIsolatedAnalyzerJS_js_1.ProcessIsolatedAnalyzer();
    this.config = {
      enableFallback: true,
      fallbackStrategy: 'basic',
      performanceTracking: true,
      maxRetries: 2,
      retryDelayMs: 1000,
    };
    this.metrics = {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      fallbackUsed: 0,
      averageResponseTime: 0,
    };
  }
  /**
   * Основной метод адаптации - преобразует UnifiedTestingAnalyzer результат в ComponentResult
   */
  async analyzeComponent(componentId, context) {
    const startTime = Date.now();
    this.metrics.totalAnalyses++;
    try {
      console.log(`📊 Запуск анализа компонента: ${componentId}`);
      // Проверяем доступность изолированного анализатора
      const isAvailable = await this.isolatedAnalyzer.checkAvailability();
      if (!isAvailable) {
        console.warn('⚠️ Изолированный анализатор недоступен, используем fallback');
        return await this.createFallbackResult(componentId, context);
      }
      // Запускаем анализ с повторными попытками
      let lastError;
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          console.log(`🔄 Попытка ${attempt}/${this.config.maxRetries}`);
          const rawResult = await this.isolatedAnalyzer.runUnifiedAnalysis({
            projectPath: context.projectPath || this.orchestratorContext.projectPath,
            componentId: componentId,
            analysisType: 'testing',
          });
          // Адаптируем результат для AnalysisOrchestrator
          const adaptedResult = await this.adaptResultForOrchestrator(
            rawResult,
            componentId,
            context
          );
          this.metrics.successfulAnalyses++;
          this.updateMetrics(startTime);
          console.log(`✅ Анализ компонента ${componentId} завершен успешно`);
          return adaptedResult;
        } catch (error) {
          lastError = error;
          console.warn(`❌ Попытка ${attempt} неудачна:`, error.message);
          if (attempt < this.config.maxRetries) {
            await this.sleep(this.config.retryDelayMs * attempt);
          }
        }
      }
      // Все попытки неудачны - используем fallback
      console.error(`❌ Все попытки анализа неудачны для ${componentId}:`, lastError);
      this.metrics.failedAnalyses++;
      if (this.config.enableFallback) {
        this.metrics.fallbackUsed++;
        return await this.createFallbackResult(componentId, context, lastError);
      } else {
        throw lastError;
      }
    } catch (error) {
      this.metrics.failedAnalyses++;
      this.updateMetrics(startTime);
      console.error(`💥 Критическая ошибка анализа ${componentId}:`, error);
      throw error;
    }
  }
  /**
   * Адаптирует результат UnifiedTestingAnalyzer для AnalysisOrchestrator
   */
  async adaptResultForOrchestrator(rawResult, componentId, context) {
    console.log(`🔄 Адаптация результата для компонента: ${componentId}`);
    // Базовая структура ComponentResult
    const adaptedResult = {
      componentId: componentId,
      analysisType: 'testing',
      timestamp: new Date().toISOString(),
      status: this.determineStatus(rawResult),
      // Основные результаты
      summary: this.createSummary(rawResult),
      details: this.formatDetails(rawResult),
      // Метрики и статистика
      metrics: this.extractMetrics(rawResult),
      recommendations: this.extractRecommendations(rawResult),
      // Техническая информация
      metadata: {
        analysisVersion: rawResult.version || '1.0.0',
        analyzerType: 'UnifiedTestingAnalyzer',
        processingTime: rawResult.processingTime || 0,
        isolatedExecution: true,
        adaptedAt: Date.now(),
      },
      // Проблемы и предупреждения
      issues: this.extractIssues(rawResult),
      warnings: this.extractWarnings(rawResult),
      // Контекст для дальнейшей обработки
      context: {
        originalResult: rawResult,
        adapterVersion: '1.0.0',
        orchestratorContext: this.getOrchestratorContextSummary(),
      },
    };
    console.log(`✅ Результат адаптирован для ${componentId}: статус=${adaptedResult.status}`);
    return adaptedResult;
  }
  /**
   * Определяет статус компонента на основе результата анализа
   */
  determineStatus(rawResult) {
    if (!rawResult || typeof rawResult !== 'object') {
      return 'error';
    }
    // Проверяем наличие критических проблем
    if (rawResult.critical_issues && rawResult.critical_issues.length > 0) {
      return 'critical';
    }
    // Проверяем общее покрытие тестами
    const coverage = rawResult.test_coverage?.overall_percentage || 0;
    if (coverage < 30) {
      return 'poor';
    } else if (coverage < 70) {
      return 'warning';
    } else if (coverage >= 90) {
      return 'excellent';
    } else {
      return 'good';
    }
  }
  /**
   * Создает краткое резюме анализа
   */
  createSummary(rawResult) {
    const testFiles = rawResult.test_files?.length || 0;
    const coverage = rawResult.test_coverage?.overall_percentage || 0;
    const issues = (rawResult.issues || []).length;
    return {
      testFilesFound: testFiles,
      overallCoverage: coverage,
      issuesDetected: issues,
      overallHealth: this.calculateHealthScore(rawResult),
      keyFindings: this.extractKeyFindings(rawResult),
    };
  }
  /**
   * Форматирует детальную информацию
   */
  formatDetails(rawResult) {
    return {
      testingFrameworks: rawResult.frameworks || [],
      testFiles: rawResult.test_files || [],
      coverage: rawResult.test_coverage || {},
      performance: rawResult.performance_metrics || {},
      configuration: rawResult.configuration || {},
      dependencies: rawResult.testing_dependencies || [],
    };
  }
  /**
   * Извлекает метрики для мониторинга
   */
  extractMetrics(rawResult) {
    return {
      test_count: rawResult.test_count || 0,
      coverage_percentage: rawResult.test_coverage?.overall_percentage || 0,
      performance_score: rawResult.performance_score || 0,
      complexity_score: rawResult.complexity_score || 0,
      maintainability_index: rawResult.maintainability_index || 0,
    };
  }
  /**
   * Извлекает рекомендации
   */
  extractRecommendations(rawResult) {
    const recommendations = rawResult.recommendations || [];
    return recommendations.map(rec => ({
      type: rec.type || 'improvement',
      priority: rec.priority || 'medium',
      description: rec.description || rec.message || String(rec),
      category: rec.category || 'testing',
      effort: rec.effort || 'unknown',
    }));
  }
  /**
   * Извлекает проблемы
   */
  extractIssues(rawResult) {
    const issues = rawResult.issues || rawResult.critical_issues || [];
    return issues.map(issue => ({
      id: issue.id || `issue_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      severity: issue.severity || 'medium',
      type: issue.type || 'testing',
      description: issue.description || issue.message || String(issue),
      location: issue.location || issue.file || 'unknown',
      suggestion: issue.suggestion || null,
    }));
  }
  /**
   * Извлекает предупреждения
   */
  extractWarnings(rawResult) {
    const warnings = rawResult.warnings || [];
    return warnings.map(warning => ({
      type: warning.type || 'general',
      message: warning.message || String(warning),
      impact: warning.impact || 'low',
    }));
  }
  /**
   * Вычисляет общий балл "здоровья" компонента
   */
  calculateHealthScore(rawResult) {
    let score = 100;
    // Снижаем за низкое покрытие
    const coverage = rawResult.test_coverage?.overall_percentage || 0;
    score -= Math.max(0, 90 - coverage);
    // Снижаем за проблемы
    const issues = (rawResult.issues || []).length;
    score -= issues * 5;
    // Снижаем за критические проблемы
    const criticalIssues = (rawResult.critical_issues || []).length;
    score -= criticalIssues * 15;
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Извлекает ключевые находки
   */
  extractKeyFindings(rawResult) {
    const findings = [];
    const coverage = rawResult.test_coverage?.overall_percentage || 0;
    if (coverage < 50) {
      findings.push(`Низкое покрытие тестами: ${coverage}%`);
    }
    const testFiles = rawResult.test_files?.length || 0;
    if (testFiles === 0) {
      findings.push('Тестовые файлы не найдены');
    }
    const frameworks = rawResult.frameworks || [];
    if (frameworks.length > 0) {
      findings.push(`Обнаружены фреймворки: ${frameworks.join(', ')}`);
    }
    return findings;
  }
  /**
   * Создает fallback результат при недоступности основного анализа
   */
  async createFallbackResult(componentId, context, originalError = null) {
    console.log(`🔄 Создание fallback результата для: ${componentId}`);
    const fallbackResult = {
      componentId: componentId,
      analysisType: 'testing',
      timestamp: new Date().toISOString(),
      status: 'warning',
      summary: {
        testFilesFound: 0,
        overallCoverage: 0,
        issuesDetected: 1,
        overallHealth: 30,
        keyFindings: ['Основной анализ недоступен'],
      },
      details: {
        testingFrameworks: [],
        testFiles: [],
        coverage: {},
        performance: {},
        configuration: {},
        dependencies: [],
      },
      metrics: {
        test_count: 0,
        coverage_percentage: 0,
        performance_score: 0,
        complexity_score: 0,
        maintainability_index: 0,
      },
      recommendations: [
        {
          type: 'critical',
          priority: 'high',
          description: 'Настроить полноценный анализ тестирования',
          category: 'infrastructure',
          effort: 'medium',
        },
      ],
      issues: [
        {
          id: `fallback_${Date.now()}`,
          severity: 'medium',
          type: 'infrastructure',
          description: 'Основной анализатор тестирования недоступен',
          location: componentId,
          suggestion: 'Проверить конфигурацию UnifiedTestingAnalyzer',
        },
      ],
      warnings: [
        {
          type: 'fallback',
          message: 'Используется упрощенный анализ из-за недоступности основного анализатора',
          impact: 'medium',
        },
      ],
      metadata: {
        analysisVersion: '1.0.0-fallback',
        analyzerType: 'FallbackAnalyzer',
        processingTime: 0,
        isolatedExecution: false,
        adaptedAt: Date.now(),
        fallbackReason: originalError?.message || 'Unknown error',
      },
      context: {
        originalResult: null,
        adapterVersion: '1.0.0',
        fallbackStrategy: this.config.fallbackStrategy,
        orchestratorContext: this.getOrchestratorContextSummary(),
      },
    };
    console.log(`✅ Fallback результат создан для ${componentId}`);
    return fallbackResult;
  }
  /**
   * Возвращает краткую информацию о контексте оркестратора
   */
  getOrchestratorContextSummary() {
    return {
      projectPath: this.orchestratorContext?.projectPath || 'unknown',
      timestamp: Date.now(),
      adaptersActive: ['TestingAnalysisAdapter'],
    };
  }
  /**
   * Обновляет метрики производительности
   */
  updateMetrics(startTime) {
    const executionTime = Date.now() - startTime;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalAnalyses - 1) + executionTime) /
      this.metrics.totalAnalyses;
  }
  /**
   * Проверяет конкретный компонент без полного анализа
   */
  async checkComponent(componentId) {
    try {
      const isAvailable = await this.isolatedAnalyzer.checkAvailability();
      return {
        componentId: componentId,
        available: isAvailable,
        adapterReady: true,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        componentId: componentId,
        available: false,
        adapterReady: false,
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }
  /**
   * Возвращает статистику адаптера
   */
  getAdapterStats() {
    return {
      ...this.metrics,
      isolatedAnalyzerStats: this.isolatedAnalyzer.getPerformanceStats(),
      configuredAt: Date.now(),
    };
  }
  /**
   * Обновляет конфигурацию адаптера
   */
  updateConfig(updates) {
    Object.assign(this.config, updates);
    console.log('🔧 Конфигурация TestingAnalysisAdapter обновлена:', updates);
  }
  /**
   * Утилита для ожидания
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
exports.TestingAnalysisAdapter = TestingAnalysisAdapter;
//# sourceMappingURL=TestingAnalysisAdapterJS.js.map
