'use strict';
/**
 * Центральный оркестратор анализа проектов
 * Phase 3.1.1: AnalysisOrchestrator Core
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.AnalysisOrchestrator = void 0;
const AnalysisCategory_1 = require('../../types/AnalysisCategory');
const ResultAggregator_1 = require('./ResultAggregator');
// Импорты существующих анализаторов
const PerformanceChecker_1 = require('../../checkers/performance/PerformanceChecker');
/**
 * Конфигурация анализатора по умолчанию
 */
const DEFAULT_CONFIG = {
  enabledCategories: [
    AnalysisCategory_1.AnalysisCategory.PERFORMANCE,
    AnalysisCategory_1.AnalysisCategory.SECURITY,
    AnalysisCategory_1.AnalysisCategory.DEPENDENCIES,
  ],
  analyzerTimeout: 30000, // 30 секунд на анализатор
  totalTimeout: 180000, // 3 минуты общий таймаут
  parallelExecution: true,
  continueOnError: true,
  verbosity: 'normal',
};
/**
 * Центральный оркестратор для координации всех типов анализа
 */
class AnalysisOrchestrator {
  resultAggregator;
  registeredAnalyzers;
  constructor() {
    this.resultAggregator = new ResultAggregator_1.ResultAggregator();
    this.registeredAnalyzers = new Map();
    // Инициализируем стандартные анализаторы
    this.initializeDefaultAnalyzers();
  }
  /**
   * Инициализирует анализаторы по умолчанию
   */
  initializeDefaultAnalyzers() {
    // Performance анализаторы
    const performanceChecker = new PerformanceChecker_1.PerformanceChecker();
    // Пока регистрируем только PerformanceChecker
    this.registerAnalyzer(AnalysisCategory_1.AnalysisCategory.PERFORMANCE, performanceChecker);
    // TODO: Добавить другие анализаторы после исправления их интерфейсов
  } /**
   * Регистрирует новый анализатор для категории
   */
  registerAnalyzer(category, analyzer) {
    if (!this.registeredAnalyzers.has(category)) {
      this.registeredAnalyzers.set(category, []);
    }
    this.registeredAnalyzers.get(category).push(analyzer);
  }
  /**
   * Получает список зарегистрированных анализаторов для категории
   */
  getAnalyzers(category) {
    return this.registeredAnalyzers.get(category) || [];
  }
  /**
   * Получает все зарегистрированные анализаторы
   */
  getAllAnalyzers() {
    return new Map(this.registeredAnalyzers);
  }
  /**
   * Запускает полный анализ проекта
   */
  async runFullAnalysis(request) {
    const config = { ...DEFAULT_CONFIG, ...request.config };
    const startTime = Date.now();
    try {
      // Создаем объект проекта
      const project = await this.createProjectInstance(request.projectPath);
      // Получаем анализаторы для выполнения
      const analyzersToRun = this.getAnalyzersForCategories(config.enabledCategories);
      // Выполняем анализ (параллельно или последовательно)
      const executionResults = config.parallelExecution
        ? await this.runAnalyzersParallel(project, analyzersToRun, config)
        : await this.runAnalyzersSequential(project, analyzersToRun, config);
      // Агрегируем результаты
      const totalExecutionTime = Date.now() - startTime;
      const unifiedResult = await this.resultAggregator.aggregateResults(
        project,
        executionResults,
        config,
        totalExecutionTime
      );
      return unifiedResult;
    } catch (error) {
      // Возвращаем результат с ошибкой
      return this.createErrorResult(request, config, Date.now() - startTime, error);
    }
  }
  /**
   * Выполняет анализ выбранных категорий
   */
  async runCategoryAnalysis(request, categories) {
    const modifiedRequest = {
      ...request,
      config: { ...request.config, enabledCategories: categories },
    };
    return this.runFullAnalysis(modifiedRequest);
  }
  /**
   * Быстрая проверка здоровья проекта (только критичные анализаторы)
   */
  async runHealthCheck(projectPath) {
    const healthCheckConfig = {
      enabledCategories: [
        AnalysisCategory_1.AnalysisCategory.SECURITY,
        AnalysisCategory_1.AnalysisCategory.PERFORMANCE,
      ],
      analyzerTimeout: 10000, // 10 секунд
      totalTimeout: 30000, // 30 секунд
      verbosity: 'minimal',
    };
    return this.runFullAnalysis({
      projectPath,
      config: healthCheckConfig,
    });
  }
  /**
   * Выполняет анализаторы параллельно
   */
  async runAnalyzersParallel(project, analyzers, config) {
    const promises = analyzers.map(({ category, analyzer }) =>
      this.executeAnalyzer(project, category, analyzer, config)
    );
    const results = await Promise.allSettled(promises);
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          category: analyzers[index].category,
          analyzerName: 'Unknown Analyzer',
          status: 'error',
          error: result.reason,
          executionTime: 0,
        };
      }
    });
  }
  /**
   * Выполняет анализаторы последовательно
   */
  async runAnalyzersSequential(project, analyzers, config) {
    const results = [];
    for (const { category, analyzer } of analyzers) {
      try {
        const result = await this.executeAnalyzer(project, category, analyzer, config);
        results.push(result);
      } catch (error) {
        results.push({
          category,
          analyzerName: 'Analyzer',
          status: 'error',
          error: error,
          executionTime: 0,
        });
        // Если не продолжаем при ошибках, прерываем выполнение
        if (!config.continueOnError) {
          break;
        }
      }
    }
    return results;
  }
  /**
   * Выполняет один анализатор с таймаутом
   */
  async executeAnalyzer(project, category, analyzer, config) {
    const startTime = Date.now();
    try {
      // Создаем Promise с таймаутом
      const analysisPromise = analyzer.check(project);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analyzer timeout')), config.analyzerTimeout);
      });
      const checkResults = await Promise.race([analysisPromise, timeoutPromise]);
      const executionTime = Date.now() - startTime;
      return {
        category,
        analyzerName: 'Performance Checker',
        status: 'success',
        checkResults,
        executionTime,
        recommendations: this.extractRecommendations(checkResults),
        metrics: this.extractMetrics(checkResults),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.message === 'Analyzer timeout';
      return {
        category,
        analyzerName: 'Analyzer',
        status: isTimeout ? 'timeout' : 'error',
        error: error,
        executionTime,
      };
    }
  }
  /**
   * Получает анализаторы для указанных категорий
   */
  getAnalyzersForCategories(categories) {
    const analyzers = [];
    for (const category of categories) {
      const categoryAnalyzers = this.registeredAnalyzers.get(category) || [];
      for (const analyzer of categoryAnalyzers) {
        analyzers.push({ category, analyzer });
      }
    }
    return analyzers;
  }
  /**
   * Создает экземпляр Project
   */
  async createProjectInstance(projectPath) {
    // Здесь нужно создать правильную реализацию Project
    // Пока возвращаем заглушку
    const projectName = projectPath.split(/[/\\]/).pop() || 'unknown';
    return {
      path: projectPath,
      name: projectName,
      getFileList: async () => [],
      getFileStats: async () => ({
        size: 0,
        created: new Date(),
        modified: new Date(),
        isDirectory: false,
        isFile: true,
      }),
      readFile: async () => '',
      exists: async () => false,
      resolvePath: relativePath => `${projectPath}/${relativePath}`,
    };
  }
  /**
   * Извлекает рекомендации из результатов проверок
   */
  extractRecommendations(checkResults) {
    const recommendations = [];
    checkResults.forEach(result => {
      if (result.details?.recommendations) {
        if (Array.isArray(result.details.recommendations)) {
          recommendations.push(...result.details.recommendations);
        }
      }
    });
    return [...new Set(recommendations)]; // Убираем дубли
  }
  /**
   * Извлекает метрики из результатов проверок
   */
  extractMetrics(checkResults) {
    const metrics = {};
    checkResults.forEach(result => {
      if (result.details?.metrics) {
        Object.assign(metrics, result.details.metrics);
      }
    });
    return metrics;
  }
  /**
   * Создает результат с ошибкой
   */
  createErrorResult(request, config, executionTime, _error) {
    const projectName = request.projectPath.split(/[/\\]/).pop() || 'unknown';
    return {
      analysisId: `error-${Date.now()}`,
      projectPath: request.projectPath,
      projectName,
      timestamp: Date.now(),
      totalExecutionTime: executionTime,
      overallScore: 0,
      maxOverallScore: 100,
      status: 'failed',
      categoryResults: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        criticalIssues: 1,
        highPriorityIssues: 0,
        mediumPriorityIssues: 0,
        lowPriorityIssues: 0,
        categoriesBreakdown: {},
      },
      metadata: {
        analyzerVersion: '6.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        executedAnalyzers: [],
        analysisConfig: config,
      },
    };
  }
}
exports.AnalysisOrchestrator = AnalysisOrchestrator;
exports.default = AnalysisOrchestrator;
//# sourceMappingURL=AnalysisOrchestrator.js.map
