/**
 * SecurityChecker v2.0 - Оптимизированный анализатор безопасности
 *
 * Ключевые улучшения:
 * - Устранение дублирования кода в методах расчета очков
 * - Универсальная система обработки уязвимостей
 * - Конфигурационно-управляемые правила безопасности
 * - Модульная архитектура с базовыми классами
 */

import type { CheckContext, ComponentResult, CheckResult } from '../../types/index.js';
import { ProcessIsolatedAnalyzer } from '../../orchestrator/ProcessIsolatedAnalyzer.js';
import { DependenciesSecurityChecker } from './DependenciesSecurityChecker.js';
import { CodeSecurityChecker } from './CodeSecurityChecker.js';
import { ConfigSecurityChecker } from './ConfigSecurityChecker.js';
import { WebSecurityChecker } from './WebSecurityChecker.js';

/**
 * Интерфейс для правил расчета очков
 */
interface SecurityScoreRule {
  critical: number;
  high: number;
  medium: number;
  low?: number;
}

/**
 * Конфигурация правил безопасности
 */
interface SecurityRulesConfig {
  dependencies: SecurityScoreRule;
  code: SecurityScoreRule;
  config: SecurityScoreRule;
  webSecurity: SecurityScoreRule;
}

/**
 * Результат анализа безопасности
 */
interface SecurityAnalysisResult {
  dependencies?: any;
  code?: any;
  config?: any;
  webSecurity?: any;
  overall: {
    score: number;
    issues: number;
    recommendation: string;
  };
}

/**
 * Базовый класс для обработки правил безопасности
 */
abstract class BaseSecurityProcessor {
  /**
   * Универсальный калькулятор очков на основе правил
   */
  protected static calculateScore(
    issues: any[] = [],
    rules: SecurityScoreRule,
    severityExtractor: (issue: any) => string = issue => issue.severity
  ): number {
    let score = 100;

    const severityCounts = issues.reduce(
      (acc, issue) => {
        const severity = severityExtractor(issue);
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    score -= (severityCounts.critical || 0) * rules.critical;
    score -= (severityCounts.high || 0) * rules.high;
    score -= (severityCounts.medium || 0) * rules.medium;
    if (rules.low) {
      score -= (severityCounts.low || 0) * rules.low;
    }

    return Math.max(0, score);
  }

  /**
   * Универсальный генератор рекомендаций
   */
  protected static generateRecommendationsFromTemplate(
    data: any,
    templates: Record<string, (count: number, data: any) => string[]>
  ): string[] {
    const recommendations: string[] = [];

    for (const [key, template] of Object.entries(templates)) {
      const count = this.extractCount(data, key);
      if (count > 0) {
        recommendations.push(...template(count, data));
      }
    }

    return recommendations;
  }

  /**
   * Извлекает количество проблем из данных
   */
  private static extractCount(data: any, key: string): number {
    const paths = {
      critical: ['auditSummary.critical', 'summary.critical', 'issues.critical'],
      secrets: ['summary.secrets'],
      corsIssues: ['summary.corsIssues'],
      xssVulns: ['xss.vulnerabilities.length', 'xss.length'],
      csrfIssues: ['csrf.issues.length', 'csrf.length'],
    };

    const keyPaths = paths[key as keyof typeof paths] || [key];

    for (const path of keyPaths) {
      const value = this.getNestedValue(data, path);
      if (typeof value === 'number') return value;
    }

    return 0;
  }

  /**
   * Получает вложенное значение по пути
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (key === 'length' && Array.isArray(current)) {
        return current.length;
      }
      return current?.[key];
    }, obj);
  }
}

/**
 * Оптимизированный SecurityChecker
 */
export class SecurityChecker extends BaseSecurityProcessor {
  private static analyzer = new ProcessIsolatedAnalyzer();
  private static dependenciesChecker = new DependenciesSecurityChecker();
  private static codeChecker = new CodeSecurityChecker();
  private static configChecker = new ConfigSecurityChecker();
  private static webSecurityChecker = new WebSecurityChecker();

  /**
   * Конфигурация правил безопасности
   */
  private static readonly SECURITY_RULES: SecurityRulesConfig = {
    dependencies: { critical: 25, high: 15, medium: 5, low: 1 },
    code: { critical: 20, high: 10, medium: 5 },
    config: { critical: 15, high: 8, medium: 0 },
    webSecurity: { critical: 20, high: 12, medium: 6 },
  };

  /**
   * Шаблоны рекомендаций
   */
  private static readonly RECOMMENDATION_TEMPLATES = {
    dependencies: {
      critical: (count: number) =>
        count > 0
          ? [
              'Запустите npm audit fix для автоматического исправления',
              'Немедленно обновите пакеты с критическими уязвимостями',
            ]
          : [],
    },
    code: {
      secrets: (count: number) =>
        count > 0 ? ['Удалите секреты из кода, используйте переменные окружения'] : [],
      unsafeFunctions: (count: number) =>
        count > 0 ? ['Замените небезопасные функции на безопасные аналоги'] : [],
    },
    config: {
      corsIssues: (count: number) => (count > 0 ? ['Настройте CORS правильно для production'] : []),
      envExposure: (count: number) =>
        count > 0 ? ['Проверьте переменные окружения на exposure секретов'] : [],
    },
    webSecurity: {
      xssVulns: (count: number) =>
        count > 0 ? ['Устраните XSS уязвимости: используйте санитизацию HTML'] : [],
      csrfIssues: (count: number) => (count > 0 ? ['Реализуйте CSRF защиту во всех формах'] : []),
    },
  };

  /**
   * Статический метод для интеграции с AnalysisOrchестrator
   */
  static async checkComponent(context: CheckContext): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      console.log('🔒 Запуск SecurityAnalyzer через изолированный процесс...');

      const analysisResult = await this.runSecurityAnalysis(context);
      const checkResults = this.convertToCheckResults(analysisResult);

      return this.createComponentResult(checkResults, startTime);
    } catch (error) {
      console.error('❌ SecurityChecker: Ошибка выполнения:', error);
      return this.createErrorResult(startTime, error);
    }
  }

  /**
   * Выполняет анализ безопасности
   */
  private static async runSecurityAnalysis(context: CheckContext): Promise<SecurityAnalysisResult> {
    const results = await Promise.allSettled([
      this.dependenciesChecker.checkDependencies(context),
      this.codeChecker.checkCode(context),
      this.configChecker.checkConfig(context),
      this.webSecurityChecker.checkWebSecurity(context),
    ]);

    const [dependencies, code, config, webSecurity] = results.map(result =>
      result.status === 'fulfilled' ? result.value : null
    );

    const overall = this.calculateOverallScore({
      dependencies,
      code,
      config,
      webSecurity,
    });

    return {
      dependencies,
      code,
      config,
      webSecurity,
      overall,
    };
  }

  /**
   * Вычисляет общий балл безопасности
   */
  private static calculateOverallScore(results: {
    dependencies?: any;
    code?: any;
    config?: any;
    webSecurity?: any;
  }): { score: number; issues: number; recommendation: string } {
    const scores = {
      dependencies: results.dependencies
        ? this.calculateDependenciesScore(results.dependencies)
        : 100,
      code: results.code ? this.calculateCodeScore(results.code) : 100,
      config: results.config ? this.calculateConfigScore(results.config) : 100,
      webSecurity: results.webSecurity ? this.calculateWebSecurityScore(results.webSecurity) : 100,
    };

    const totalScore = Math.round(
      (scores.dependencies + scores.code + scores.config + scores.webSecurity) / 4
    );

    const totalIssues = Object.values(results).reduce((sum, result) => {
      if (!result) return sum;
      return sum + this.countIssues(result);
    }, 0);

    let recommendation = 'Отличная безопасность!';
    if (totalScore < 50) {
      recommendation = 'Критический уровень безопасности - требуется немедленное вмешательство';
    } else if (totalScore < 70) {
      recommendation = 'Серьезные проблемы безопасности требуют внимания';
    } else if (totalScore < 85) {
      recommendation = 'Есть возможности для улучшения безопасности';
    }

    return {
      score: totalScore,
      issues: totalIssues,
      recommendation,
    };
  }

  /**
   * Универсальные методы расчета очков
   */
  private static calculateDependenciesScore(deps: any): number {
    if (!deps?.auditSummary) return 100;

    const issues = Object.entries(deps.auditSummary)
      .filter(([key]) => ['critical', 'high', 'moderate', 'low'].includes(key))
      .flatMap(([severity, count]) =>
        Array(count as number).fill({ severity: severity === 'moderate' ? 'medium' : severity })
      );

    return this.calculateScore(issues, this.SECURITY_RULES.dependencies);
  }

  private static calculateCodeScore(code: any): number {
    if (!code?.issues) return 100;
    return this.calculateScore(code.issues, this.SECURITY_RULES.code);
  }

  private static calculateConfigScore(config: any): number {
    if (!config?.issues) return 100;
    return this.calculateScore(config.issues, this.SECURITY_RULES.config);
  }

  private static calculateWebSecurityScore(webSecurity: any): number {
    if (!webSecurity?.summary) return 100;

    const xssVulns = webSecurity.xss?.vulnerabilities || [];
    const csrfIssues = webSecurity.csrf?.issues || [];
    const allIssues = [...xssVulns, ...csrfIssues];

    return this.calculateScore(allIssues, this.SECURITY_RULES.webSecurity);
  }

  /**
   * Подсчитывает общее количество проблем
   */
  private static countIssues(result: any): number {
    if (result?.auditSummary) {
      return Object.values(result.auditSummary).reduce(
        (sum: number, count) => sum + (count as number),
        0
      );
    }
    if (result?.issues) {
      return result.issues.length;
    }
    if (result?.xss || result?.csrf) {
      return (result.xss?.vulnerabilities?.length || 0) + (result.csrf?.issues?.length || 0);
    }
    return 0;
  }

  /**
   * Универсальные методы генерации рекомендаций
   */
  private static getDependenciesRecommendations(deps: any): string[] {
    return this.generateRecommendationsFromTemplate(
      deps,
      this.RECOMMENDATION_TEMPLATES.dependencies
    );
  }

  private static getCodeRecommendations(code: any): string[] {
    return this.generateRecommendationsFromTemplate(code, this.RECOMMENDATION_TEMPLATES.code);
  }

  private static getConfigRecommendations(config: any): string[] {
    return this.generateRecommendationsFromTemplate(config, this.RECOMMENDATION_TEMPLATES.config);
  }

  private static getWebSecurityRecommendations(webSecurity: any): string[] {
    if (!webSecurity?.summary) {
      return ['Веб-анализ безопасности не выполнен'];
    }
    return this.generateRecommendationsFromTemplate(
      webSecurity,
      this.RECOMMENDATION_TEMPLATES.webSecurity
    );
  }

  /**
   * Преобразует результат в формат CheckResult[]
   */
  private static convertToCheckResults(analysisResult: SecurityAnalysisResult): CheckResult[] {
    const results: CheckResult[] = [];

    // Dependencies security check
    if (analysisResult.dependencies) {
      results.push({
        check: {
          id: 'dependencies-security',
          name: 'Dependencies Security',
          description: 'Проверка безопасности зависимостей',
          category: 'security',
          score: 100,
          critical: true,
          level: 'high',
          tags: ['dependencies', 'security', 'npm'],
        },
        passed: this.calculateDependenciesScore(analysisResult.dependencies) >= 70,
        score: this.calculateDependenciesScore(analysisResult.dependencies),
        maxScore: 100,
        details: this.formatDependenciesDetails(analysisResult.dependencies),
        recommendations: this.getDependenciesRecommendations(analysisResult.dependencies),
      });
    }

    // Code security check
    if (analysisResult.code) {
      results.push({
        check: {
          id: 'code-security',
          name: 'Code Security',
          description: 'Проверка безопасности кода',
          category: 'security',
          score: 100,
          critical: true,
          level: 'high',
          tags: ['code', 'security', 'static-analysis'],
        },
        passed: this.calculateCodeScore(analysisResult.code) >= 70,
        score: this.calculateCodeScore(analysisResult.code),
        maxScore: 100,
        details: this.formatCodeDetails(analysisResult.code),
        recommendations: this.getCodeRecommendations(analysisResult.code),
      });
    }

    // Config security check
    if (analysisResult.config) {
      results.push({
        check: {
          id: 'config-security',
          name: 'Configuration Security',
          description: 'Проверка безопасности конфигурации',
          category: 'security',
          score: 100,
          critical: false,
          level: 'medium',
          tags: ['config', 'security'],
        },
        passed: this.calculateConfigScore(analysisResult.config) >= 70,
        score: this.calculateConfigScore(analysisResult.config),
        maxScore: 100,
        details: this.formatConfigDetails(analysisResult.config),
        recommendations: this.getConfigRecommendations(analysisResult.config),
      });
    }

    // Web security check
    if (analysisResult.webSecurity) {
      results.push({
        check: {
          id: 'web-security',
          name: 'Web Security',
          description: 'Проверка веб-безопасности',
          category: 'security',
          score: 100,
          critical: true,
          level: 'high',
          tags: ['web', 'security', 'xss', 'csrf'],
        },
        passed: this.calculateWebSecurityScore(analysisResult.webSecurity) >= 70,
        score: this.calculateWebSecurityScore(analysisResult.webSecurity),
        maxScore: 100,
        details: this.formatWebSecurityDetails(analysisResult.webSecurity),
        recommendations: this.getWebSecurityRecommendations(analysisResult.webSecurity),
      });
    }

    return results;
  }

  /**
   * Методы форматирования деталей
   */
  private static formatDependenciesDetails(deps: any): string {
    if (!deps?.auditSummary) return 'Анализ зависимостей не выполнен';

    const { critical, high, moderate, low, total } = deps.auditSummary;
    return `Найдено ${total} уязвимостей: критических - ${critical}, высоких - ${high}, средних - ${moderate}, низких - ${low}`;
  }

  private static formatCodeDetails(code: any): string {
    if (!code?.summary) return 'Анализ кода не выполнен';

    const { secrets, unsafeFunctions, total } = code.summary;
    return `Найдено ${total} проблем: секретов в коде - ${secrets}, небезопасных функций - ${unsafeFunctions}`;
  }

  private static formatConfigDetails(config: any): string {
    if (!config?.summary) return 'Анализ конфигурации не выполнен';

    const { corsIssues, envExposure, total } = config.summary;
    return `Найдено ${total} проблем конфигурации: CORS - ${corsIssues}, env exposure - ${envExposure}`;
  }

  private static formatWebSecurityDetails(webSecurity: any): string {
    if (!webSecurity?.summary) return 'Веб-анализ не выполнен';

    const xssCount = webSecurity.xss?.vulnerabilities?.length || 0;
    const csrfCount = webSecurity.csrf?.issues?.length || 0;
    return `Найдено уязвимостей: XSS - ${xssCount}, CSRF - ${csrfCount}`;
  }

  /**
   * Создает ComponentResult
   */
  private static createComponentResult(
    checkResults: CheckResult[],
    startTime: number
  ): ComponentResult {
    const totalScore = checkResults.reduce((sum, result) => sum + result.score, 0);
    const maxScore = checkResults.reduce((sum, result) => sum + result.maxScore, 0);
    const avgScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const failed = checkResults.filter(result => !result.passed);
    const recommendations = this.generateGlobalRecommendations(failed);

    return {
      name: 'SecurityChecker',
      category: 'security',
      score: avgScore,
      maxScore: 100,
      details: `Проверка безопасности завершена. Общий балл: ${avgScore}/100`,
      recommendations,
      executionTime: Date.now() - startTime,
      checks: checkResults,
    };
  }

  /**
   * Создает результат при ошибке
   */
  private static createErrorResult(startTime: number, error: any): ComponentResult {
    return {
      name: 'SecurityChecker',
      category: 'security',
      score: 0,
      maxScore: 100,
      details: `Ошибка выполнения SecurityChecker: ${error?.message || 'Неизвестная ошибка'}`,
      recommendations: ['Проверьте конфигурацию и повторите анализ безопасности'],
      executionTime: Date.now() - startTime,
      checks: [],
    };
  }

  /**
   * Генерирует глобальные рекомендации
   */
  private static generateGlobalRecommendations(failed: CheckResult[]): string[] {
    const recommendations = new Set<string>();

    failed.forEach(result => {
      result.recommendations?.forEach(rec => recommendations.add(rec));
    });

    if (failed.length > 2) {
      recommendations.add('Рекомендуется комплексный аудит безопасности');
    }

    return Array.from(recommendations);
  }

  /**
   * Вспомогательные методы для расчета времени
   */
  private static calculateEstimatedTime(recommendations: string[]): string {
    const baseTime = recommendations.length * 30; // 30 минут на рекомендацию
    if (baseTime < 60) return `${baseTime} минут`;
    const hours = Math.round(baseTime / 60);
    return `${hours} ${hours === 1 ? 'час' : 'часов'}`;
  }
}

export default SecurityChecker;
