/**
 * SecurityChecker v2.0 - Оптимизированный анализатор безопасности
 *
 * Ключевые улучшения:
 * - Устранение дублирования кода в методах расчета очков
 * - Универсальная система обработки уязвимостей
 * - Конфигурационно-управляемые правила безопасности
 * - Модульная архитектура с базовыми классами
 */

import { CheckContext, ComponentResult, CheckResult } from '../../types/index.js';
import { ProcessIsolatedAnalyzer } from '../../orchestrator/ProcessIsolatedAnalyzer.js';
import { DependenciesSecurityChecker } from './DependenciesSecurityChecker.js';
import { CodeSecurityChecker } from './CodeSecurityChecker.js';
import { ConfigSecurityChecker } from './ConfigSecurityChecker.js';
import { WebSecurityChecker } from './WebSecurityChecker.js';

/**
 * Конфигурация правил безопасности
 */
interface SecurityScoreRule {
  critical: number;
  high: number;
  medium: number;
  low?: number;
}

/**
 * Базовый класс для обработки правил безопасности
 */
abstract class BaseSecurityProcessor {
  /**
   * Универсальный калькулятор очков на основе правил
   */
  protected static calculateScore(
    issuesData: any,
    rules: SecurityScoreRule,
    issueExtractor: (data: any) => any[] = data => data.issues || []
  ): number {
    let score = 100;
    const issues = issueExtractor(issuesData);

    if (!Array.isArray(issues)) return score;

    const severityCounts = issues.reduce(
      (acc, issue) => {
        const severity = issue.severity || 'low';
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
  protected static generateRecommendationsFromRules(
    data: any,
    rules: Record<string, (data: any) => string[]>
  ): string[] {
    const recommendations: string[] = [];

    for (const [key, generator] of Object.entries(rules)) {
      const recs = generator(data);
      if (recs.length > 0) {
        recommendations.push(...recs);
      }
    }

    return recommendations;
  }
}

export class SecurityChecker {
  private static analyzer = new ProcessIsolatedAnalyzer();
  private static dependenciesChecker = new DependenciesSecurityChecker();
  private static codeChecker = new CodeSecurityChecker();
  private static configChecker = new ConfigSecurityChecker();
  private static webSecurityChecker = new WebSecurityChecker();

  /**
   * Статический метод для интеграции с AnalysisOrchестrator
   */
  static async checkComponent(context: CheckContext): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      console.log('🔒 Запуск SecurityAnalyzer через изолированный процесс...');

      // Запускаем анализ безопасности в изолированном процессе
      const analysisResult = await this.runSecurityAnalysis(context);

      // Преобразуем результат в формат CheckResult[]
      const checkResults = this.convertToCheckResults(analysisResult);

      // Создаем ComponentResult
      return this.createComponentResult(checkResults, startTime);
    } catch (error) {
      console.error('❌ SecurityChecker: Ошибка выполнения:', error);

      // Возвращаем fallback результат при ошибке
      return this.createErrorResult(startTime, error);
    }
  }

  /**
   * Выполняет анализ безопасности
   */
  private static async runSecurityAnalysis(context: CheckContext): Promise<{
    dependencies: any;
    code: any;
    config: any;
    webSecurity: any;
    overallScore: number;
  }> {
    try {
      // Параллельно запускаем все типы анализа безопасности
      const [dependenciesResult, codeResult, configResult, webSecurityResult] = await Promise.all([
        this.dependenciesChecker.checkDependencies(context.projectPath),
        this.codeChecker.checkCodeSecurity(context.projectPath),
        this.configChecker.checkConfigSecurity(context.projectPath),
        this.webSecurityChecker.analyzeWebSecurity(context),
      ]);

      // Рассчитываем общий балл безопасности
      const overallScore = this.calculateOverallScore(
        dependenciesResult,
        codeResult,
        configResult,
        webSecurityResult
      );

      return {
        dependencies: dependenciesResult,
        code: codeResult,
        config: configResult,
        webSecurity: webSecurityResult,
        overallScore,
      };
    } catch (error) {
      console.error('SecurityChecker: Ошибка анализа безопасности:', error);
      throw error;
    }
  }

  /**
   * Рассчитывает общий балл безопасности
   */
  private static calculateOverallScore(
    deps: any,
    code: any,
    config: any,
    webSecurity: any
  ): number {
    let score = 100;

    // Снижаем балл за уязвимости в зависимостях
    if (deps.auditSummary) {
      score -= deps.auditSummary.critical * 20;
      score -= deps.auditSummary.high * 10;
      score -= deps.auditSummary.moderate * 5;
      score -= deps.auditSummary.low * 1;
    }

    // Снижаем балл за проблемы в коде
    if (code.issues) {
      const criticalCodeIssues = code.issues.filter((i: any) => i.severity === 'critical').length;
      const highCodeIssues = code.issues.filter((i: any) => i.severity === 'high').length;

      score -= criticalCodeIssues * 15;
      score -= highCodeIssues * 8;
    }

    // Снижаем балл за проблемы конфигурации
    if (config.issues) {
      const criticalConfigIssues = config.issues.filter(
        (i: any) => i.severity === 'critical'
      ).length;
      const highConfigIssues = config.issues.filter((i: any) => i.severity === 'high').length;

      score -= criticalConfigIssues * 10;
      score -= highConfigIssues * 5;
    }

    // Снижаем балл за веб-уязвимости
    if (webSecurity && webSecurity.summary) {
      const totalWebIssues = webSecurity.summary.totalIssues || 0;
      const criticalWebIssues =
        webSecurity.xss?.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0;
      const highWebIssues =
        webSecurity.xss?.vulnerabilities?.filter((v: any) => v.severity === 'high').length || 0;

      score -= criticalWebIssues * 12;
      score -= highWebIssues * 6;
      score -= Math.max(0, totalWebIssues - criticalWebIssues - highWebIssues) * 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Преобразует результат анализа в формат CheckResult[]
   */
  private static convertToCheckResults(analysisResult: any): CheckResult[] {
    const checkResults: CheckResult[] = [];

    // Dependencies Security Check
    checkResults.push({
      check: {
        id: 'security-dependencies',
        name: 'Dependencies Security',
        description: 'Анализ безопасности зависимостей проекта',
        category: 'security',
        score: 100,
        critical: true,
        level: 'critical',
        tags: ['dependencies', 'npm-audit', 'vulnerabilities'],
      },
      passed: analysisResult.dependencies.auditSummary.critical === 0,
      score: this.calculateDependenciesScore(analysisResult.dependencies),
      maxScore: 100,
      details: `Найдено уязвимостей: ${analysisResult.dependencies.auditSummary.total}`,
      recommendations: this.getDependenciesRecommendations(analysisResult.dependencies),
    });

    // Code Security Check
    checkResults.push({
      check: {
        id: 'security-code',
        name: 'Code Security',
        description: 'Статический анализ кода на предмет проблем безопасности',
        category: 'security',
        score: 100,
        critical: true,
        level: 'high',
        tags: ['static-analysis', 'secrets', 'code-security'],
      },
      passed: analysisResult.code.issues.length === 0,
      score: this.calculateCodeScore(analysisResult.code),
      maxScore: 100,
      details: `Найдено проблем в коде: ${analysisResult.code.issues.length}`,
      recommendations: this.getCodeRecommendations(analysisResult.code),
    });

    // Config Security Check
    checkResults.push({
      check: {
        id: 'security-config',
        name: 'Configuration Security',
        description: 'Анализ безопасности конфигурационных файлов',
        category: 'security',
        score: 100,
        critical: false,
        level: 'high',
        tags: ['configuration', 'cors', 'env-security'],
      },
      passed: analysisResult.config.issues.length === 0,
      score: this.calculateConfigScore(analysisResult.config),
      maxScore: 100,
      details: `Найдено проблем конфигурации: ${analysisResult.config.issues.length}`,
      recommendations: this.getConfigRecommendations(analysisResult.config),
    });

    // Web Security Check
    const webSecurityPassed =
      !analysisResult.webSecurity ||
      (analysisResult.webSecurity.summary && analysisResult.webSecurity.summary.totalIssues === 0);

    const totalWebIssues =
      analysisResult.webSecurity?.summary?.totalIssues ||
      (analysisResult.webSecurity?.xss?.vulnerabilities?.length || 0) +
        (analysisResult.webSecurity?.csrf?.issues?.length || 0);

    checkResults.push({
      check: {
        id: 'security-web',
        name: 'Web Security',
        description: 'Анализ XSS, CSRF и других веб-уязвимостей',
        category: 'security',
        score: 100,
        critical: true,
        level: 'high',
        tags: ['web-security', 'xss', 'csrf', 'injection'],
      },
      passed: webSecurityPassed,
      score: this.calculateWebSecurityScore(analysisResult.webSecurity),
      maxScore: 100,
      details: analysisResult.webSecurity?.summary
        ? `Найдено веб-уязвимостей: ${totalWebIssues} (XSS: ${analysisResult.webSecurity.xss?.vulnerabilities?.length || 0}, CSRF: ${analysisResult.webSecurity.csrf?.issues?.length || 0})`
        : 'Веб-анализ не выполнен',
      recommendations: this.getWebSecurityRecommendations(analysisResult.webSecurity),
    }); // Overall Security Score
    checkResults.push({
      check: {
        id: 'security-overall',
        name: 'Overall Security',
        description: 'Общий балл безопасности проекта',
        category: 'security',
        score: 100,
        critical: true,
        level: 'critical',
        tags: ['overall', 'security-score'],
      },
      passed: analysisResult.overallScore >= 70,
      score: analysisResult.overallScore,
      maxScore: 100,
      details: `Общий балл безопасности: ${analysisResult.overallScore}%`,
      recommendations:
        analysisResult.overallScore < 70
          ? ['Улучшите общую безопасность проекта', 'Исправьте критические уязвимости']
          : ['Система безопасности работает корректно'],
    });

    return checkResults;
  }

  /**
   * Создает ComponentResult
   */
  private static createComponentResult(
    checkResults: CheckResult[],
    startTime: number
  ): ComponentResult {
    const passed = checkResults.filter(r => r.passed);
    const failed = checkResults.filter(r => !r.passed);
    const score = passed.reduce((sum, r) => sum + r.score, 0);
    const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      component: 'security-analysis' as any,
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
   * Создает результат при ошибке
   */
  private static createErrorResult(startTime: number, error: any): ComponentResult {
    const errorCheck: CheckResult = {
      check: {
        id: 'security-error',
        name: 'Security Analysis Error',
        description: 'Ошибка при выполнении анализа безопасности',
        category: 'security',
        score: 0,
        critical: true,
        level: 'critical',
        tags: ['error'],
      },
      passed: false,
      score: 0,
      maxScore: 100,
      details: `Ошибка: ${error.message || error}`,
      recommendations: [
        'Проверьте конфигурацию SecurityChecker',
        'Убедитесь что npm audit доступен',
      ],
    };

    return {
      component: 'security-analysis' as any,
      score: 0,
      maxScore: 100,
      percentage: 0,
      passed: [],
      failed: [errorCheck],
      warnings: [],
      recommendations: ['Исправьте ошибки SecurityChecker для получения анализа безопасности'],
      duration: Date.now() - startTime,
    };
  }

  // Helper methods для расчета scores
  private static calculateDependenciesScore(deps: any): number {
    let score = 100;
    if (deps.auditSummary) {
      score -= deps.auditSummary.critical * 25;
      score -= deps.auditSummary.high * 15;
      score -= deps.auditSummary.moderate * 5;
      score -= deps.auditSummary.low * 1;
    }
    return Math.max(0, score);
  }

  private static calculateCodeScore(code: any): number {
    let score = 100;
    if (code.issues) {
      const critical = code.issues.filter((i: any) => i.severity === 'critical').length;
      const high = code.issues.filter((i: any) => i.severity === 'high').length;
      const medium = code.issues.filter((i: any) => i.severity === 'medium').length;

      score -= critical * 20;
      score -= high * 10;
      score -= medium * 5;
    }
    return Math.max(0, score);
  }

  private static calculateConfigScore(config: any): number {
    let score = 100;
    if (config.issues) {
      const critical = config.issues.filter((i: any) => i.severity === 'critical').length;
      const high = config.issues.filter((i: any) => i.severity === 'high').length;

      score -= critical * 15;
      score -= high * 8;
    }
    return Math.max(0, score);
  }

  private static calculateWebSecurityScore(webSecurity: any): number {
    let score = 100;
    if (!webSecurity || !webSecurity.summary) {
      return score; // Если веб-анализ не выполнен, считаем это нормальным
    }

    const xssVulns = webSecurity.xss?.vulnerabilities || [];
    const csrfIssues = webSecurity.csrf?.issues || [];

    // Снижаем балл за XSS уязвимости
    const criticalXSS = xssVulns.filter((v: any) => v.severity === 'critical').length;
    const highXSS = xssVulns.filter((v: any) => v.severity === 'high').length;
    const mediumXSS = xssVulns.filter((v: any) => v.severity === 'medium').length;

    score -= criticalXSS * 20;
    score -= highXSS * 12;
    score -= mediumXSS * 6;

    // Снижаем балл за CSRF проблемы
    const criticalCSRF = csrfIssues.filter((i: any) => i.severity === 'high').length;
    const mediumCSRF = csrfIssues.filter((i: any) => i.severity === 'medium').length;

    score -= criticalCSRF * 15;
    score -= mediumCSRF * 8;

    return Math.max(0, score);
  }

  // Helper methods для рекомендаций
  private static getDependenciesRecommendations(deps: any): string[] {
    const recommendations = [];
    if (deps.auditSummary.total > 0) {
      recommendations.push('Запустите npm audit fix для автоматического исправления');
      if (deps.auditSummary.critical > 0) {
        recommendations.push('Немедленно обновите пакеты с критическими уязвимостями');
      }
    }
    return recommendations;
  }

  private static getCodeRecommendations(code: any): string[] {
    const recommendations = [];
    if (code.summary.secrets > 0) {
      recommendations.push('Удалите секреты из кода, используйте переменные окружения');
    }
    if (code.summary.unsafeFunctions > 0) {
      recommendations.push('Замените небезопасные функции на безопасные аналоги');
    }
    return recommendations;
  }

  private static getConfigRecommendations(config: any): string[] {
    const recommendations = [];
    if (config.summary.corsIssues > 0) {
      recommendations.push('Настройте CORS правильно для production');
    }
    if (config.summary.envExposure > 0) {
      recommendations.push('Проверьте переменные окружения на exposure секретов');
    }
    return recommendations;
  }

  private static getWebSecurityRecommendations(webSecurity: any): string[] {
    const recommendations = [];

    if (!webSecurity || !webSecurity.summary) {
      return ['Веб-анализ безопасности не выполнен'];
    }

    const xssVulns = webSecurity.xss?.vulnerabilities || [];
    const csrfIssues = webSecurity.csrf?.issues || [];

    if (xssVulns.length > 0) {
      recommendations.push('Устраните XSS уязвимости: используйте санитизацию HTML');

      const dangerousHTML = xssVulns.filter((v: any) => v.type === 'dangerous_html').length;
      const unsafeJS = xssVulns.filter((v: any) => v.type === 'unsafe_js_execution').length;

      if (dangerousHTML > 0) {
        recommendations.push(
          'Замените {@html} на безопасные альтернативы или добавьте санитизацию'
        );
      }
      if (unsafeJS > 0) {
        recommendations.push('Избегайте выполнения пользовательского JS кода');
      }
    }

    if (csrfIssues.length > 0) {
      recommendations.push('Добавьте CSRF защиту: токены, SameSite cookies');

      const unprotectedForms = csrfIssues.filter((i: any) => i.type === 'unprotected_form').length;
      const cookieIssues = csrfIssues.filter((i: any) => i.type === 'cookie_security').length;

      if (unprotectedForms > 0) {
        recommendations.push('Добавьте CSRF токены во все формы');
      }
      if (cookieIssues > 0) {
        recommendations.push('Настройте SameSite и Secure флаги для cookies');
      }
    }

    return recommendations;
  }

  private static generateRecommendations(failed: CheckResult[]): string[] {
    return failed.flatMap(check => check.recommendations || []);
  }

  /**
   * Генерирует детальные рекомендации для всех найденных проблем безопасности
   */
  static async generateDetailedRecommendations(context: CheckContext): Promise<{
    dependencies: any[];
    code: any[];
    config: any[];
    summary: {
      totalRecommendations: number;
      criticalRecommendations: number;
      estimatedTimeToFix: string;
    };
  }> {
    try {
      // Получаем результаты анализа
      const analysisResult = await this.runSecurityAnalysis(context);

      // Генерируем рекомендации от каждого checker'а
      const [dependenciesRecommendations, codeRecommendations, configRecommendations] =
        await Promise.all([
          this.dependenciesChecker.generateDetailedRecommendations(
            analysisResult.dependencies.vulnerabilities || []
          ),
          this.codeChecker.generateDetailedRecommendations(analysisResult.code.issues || []),
          this.configChecker.generateDetailedRecommendations(analysisResult.config.issues || []),
        ]);

      // Подсчитываем статистику
      const allRecommendations = [
        ...dependenciesRecommendations,
        ...codeRecommendations,
        ...configRecommendations,
      ];

      const criticalCount = allRecommendations.filter(
        r => r.severity === 'critical' || r.severity === 'high'
      ).length;

      // Оцениваем время исправления
      const estimatedTime = this.calculateEstimatedTime(allRecommendations);

      return {
        dependencies: dependenciesRecommendations,
        code: codeRecommendations,
        config: configRecommendations,
        summary: {
          totalRecommendations: allRecommendations.length,
          criticalRecommendations: criticalCount,
          estimatedTimeToFix: estimatedTime,
        },
      };
    } catch (error) {
      console.error('SecurityChecker: Ошибка генерации рекомендаций:', error);
      return {
        dependencies: [],
        code: [],
        config: [],
        summary: {
          totalRecommendations: 0,
          criticalRecommendations: 0,
          estimatedTimeToFix: '0h',
        },
      };
    }
  }

  /**
   * Генерирует быстрые рекомендации только для критических проблем
   */
  static async generateQuickRecommendations(context: CheckContext): Promise<any[]> {
    try {
      const analysisResult = await this.runSecurityAnalysis(context);

      const [dependenciesQuick, codeQuick, configQuick] = await Promise.all([
        this.dependenciesChecker.generateQuickRecommendations(
          analysisResult.dependencies.vulnerabilities || []
        ),
        this.codeChecker.generateQuickRecommendations(analysisResult.code.issues || []),
        this.configChecker.generateQuickRecommendations(analysisResult.config.issues || []),
      ]);

      return [...dependenciesQuick, ...codeQuick, ...configQuick];
    } catch (error) {
      console.error('SecurityChecker: Ошибка генерации быстрых рекомендаций:', error);
      return [];
    }
  }

  /**
   * Рассчитывает примерное время исправления
   */
  private static calculateEstimatedTime(recommendations: any[]): string {
    let totalMinutes = 0;

    for (const rec of recommendations) {
      // Парсим время из строки типа "10-15 минут" или "1-2 часа"
      const timeStr = rec.timeEstimate || '15 минут';
      const minutes = this.parseTimeToMinutes(timeStr);
      totalMinutes += minutes;
    }

    if (totalMinutes < 60) {
      return `${totalMinutes}м`;
    } else {
      const hours = Math.round((totalMinutes / 60) * 10) / 10;
      return `${hours}ч`;
    }
  }

  /**
   * Парсит строку времени в минуты
   */
  private static parseTimeToMinutes(timeStr: string): number {
    if (timeStr.includes('час')) {
      const match = timeStr.match(/(\d+)/);
      return match ? parseInt(match[1]) * 60 : 60;
    } else if (timeStr.includes('минут')) {
      const match = timeStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : 15;
    }
    return 15; // Default
  }
}
