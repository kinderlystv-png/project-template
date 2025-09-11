'use strict';
/**
 * Агрегатор результатов анализа
 * Phase 3.1.1: AnalysisOrchestrator Core
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResultAggregator = void 0;
const crypto = __importStar(require('crypto'));
const os = __importStar(require('os'));
/**
 * Агрегатор для объединения результатов различных анализаторов
 */
class ResultAggregator {
  analyzerVersion = '6.0.0';
  /**
   * Агрегирует результаты всех анализаторов в единый результат
   */
  async aggregateResults(project, executionResults, config, totalExecutionTime) {
    const analysisId = this.generateAnalysisId();
    const timestamp = Date.now();
    // Преобразуем результаты выполнения в результаты категорий
    const categoryResults = this.buildCategoryResults(executionResults);
    // Вычисляем общий балл
    const { overallScore, maxOverallScore } = this.calculateOverallScore(categoryResults);
    // Определяем статус анализа
    const status = this.determineAnalysisStatus(categoryResults);
    // Создаем сводную статистику
    const summary = this.createSummary(categoryResults);
    // Создаем метаданные
    const metadata = await this.createMetadata(project, config, executionResults);
    // Создаем хэш проекта для сравнения версий
    const projectHash = await this.generateProjectHash(project);
    return {
      analysisId,
      projectPath: project.path,
      projectName: project.name,
      timestamp,
      totalExecutionTime,
      overallScore,
      maxOverallScore,
      status,
      categoryResults,
      summary,
      projectHash,
      metadata,
    };
  }
  /**
   * Преобразует результаты выполнения анализаторов в результаты категорий
   */
  buildCategoryResults(executionResults) {
    return executionResults.map(result => {
      const checkResults = result.checkResults || [];
      const score = this.calculateCategoryScore(checkResults);
      const maxScore = this.calculateMaxCategoryScore(checkResults);
      return {
        category: result.category,
        analyzerName: result.analyzerName,
        score,
        maxScore,
        status: result.status,
        executionTime: result.executionTime,
        checkResults,
        errorMessage: result.error?.message,
        recommendations: result.recommendations || [],
        metrics: result.metrics || {},
      };
    });
  }
  /**
   * Вычисляет балл категории на основе результатов проверок
   */
  calculateCategoryScore(checkResults) {
    if (checkResults.length === 0) return 0;
    const totalScore = checkResults.reduce((sum, check) => sum + (check.score || 0), 0);
    return Math.round(totalScore);
  }
  /**
   * Вычисляет максимальный балл категории
   */
  calculateMaxCategoryScore(checkResults) {
    if (checkResults.length === 0) return 0;
    const maxScore = checkResults.reduce((sum, check) => sum + (check.maxScore || 0), 0);
    return Math.round(maxScore);
  }
  /**
   * Вычисляет общий балл проекта
   */
  calculateOverallScore(categoryResults) {
    if (categoryResults.length === 0) {
      return { overallScore: 0, maxOverallScore: 0 };
    }
    const successfulResults = categoryResults.filter(result => result.status === 'success');
    if (successfulResults.length === 0) {
      return { overallScore: 0, maxOverallScore: 0 };
    }
    const totalScore = successfulResults.reduce((sum, result) => sum + result.score, 0);
    const maxScore = successfulResults.reduce((sum, result) => sum + result.maxScore, 0);
    const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    return {
      overallScore: Math.min(overallScore, 100),
      maxOverallScore: 100,
    };
  }
  /**
   * Определяет общий статус анализа
   */
  determineAnalysisStatus(categoryResults) {
    const successCount = categoryResults.filter(result => result.status === 'success').length;
    const totalCount = categoryResults.length;
    if (successCount === totalCount) return 'completed';
    if (successCount > 0) return 'partial';
    return 'failed';
  }
  /**
   * Создает сводную статистику анализа
   */
  createSummary(categoryResults) {
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let criticalIssues = 0;
    let highPriorityIssues = 0;
    let mediumPriorityIssues = 0;
    let lowPriorityIssues = 0;
    const categoriesBreakdown = {};
    for (const categoryResult of categoryResults) {
      const checksCount = categoryResult.checkResults.length;
      totalChecks += checksCount;
      // Подсчет пройденных/проваленных проверок
      const passed = categoryResult.checkResults.filter(check => check.passed).length;
      const failed = checksCount - passed;
      passedChecks += passed;
      failedChecks += failed;
      // Подсчет проблем по приоритетам
      categoryResult.checkResults.forEach(check => {
        if (!check.passed) {
          switch (check.severity?.toLowerCase()) {
            case 'critical':
              criticalIssues++;
              break;
            case 'high':
              highPriorityIssues++;
              break;
            case 'medium':
              mediumPriorityIssues++;
              break;
            case 'low':
              lowPriorityIssues++;
              break;
            default:
              mediumPriorityIssues++;
          }
        }
      });
      // Добавляем в разбивку по категориям
      categoriesBreakdown[categoryResult.category] = {
        score: categoryResult.score,
        status: categoryResult.status,
        checksCount,
      };
    }
    return {
      totalChecks,
      passedChecks,
      failedChecks,
      criticalIssues,
      highPriorityIssues,
      mediumPriorityIssues,
      lowPriorityIssues,
      categoriesBreakdown,
    };
  }
  /**
   * Создает метаданные анализа
   */
  async createMetadata(project, config, executionResults) {
    const executedAnalyzers = executionResults.map(result => result.analyzerName);
    // Попытка получить Git информацию
    let gitInfo;
    try {
      gitInfo = await this.getGitInfo(project);
    } catch {
      // Git информация недоступна
    }
    return {
      analyzerVersion: this.analyzerVersion,
      nodeVersion: process.version,
      platform: `${os.type()} ${os.release()}`,
      executedAnalyzers,
      analysisConfig: config,
      gitInfo,
    };
  }
  /**
   * Получает Git информацию проекта
   */
  async getGitInfo(project) {
    try {
      // Проверяем наличие .git папки
      const gitExists = await project.exists('.git');
      if (!gitExists) return undefined;
      // Здесь можно добавить логику получения Git информации
      // Пока возвращаем заглушку
      return {
        branch: 'unknown',
        commit: 'unknown',
        isDirty: false,
      };
    } catch {
      return undefined;
    }
  }
  /**
   * Генерирует хэш проекта для сравнения версий
   */
  async generateProjectHash(project) {
    try {
      // Простой хэш на основе пути и времени
      const hashInput = `${project.path}-${project.name}-${Date.now()}`;
      return crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 16);
    } catch {
      return crypto.randomBytes(8).toString('hex');
    }
  }
  /**
   * Генерирует уникальный ID анализа
   */
  generateAnalysisId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `analysis-${timestamp}-${random}`;
  }
}
exports.ResultAggregator = ResultAggregator;
exports.default = ResultAggregator;
//# sourceMappingURL=ResultAggregator.js.map
