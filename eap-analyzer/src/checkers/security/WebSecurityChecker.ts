/**
 * WebSecurityChecker - Главный анализатор веб-безопасности
 *
 * Координирует анализ XSS, CSRF и других веб-уязвимостей
 * Интегрируется с существующей системой SecurityChecker
 */

import { CheckContext } from '../../types/index.js';
import { XSSAnalyzer, XSSAnalysisResult } from './analyzers/XSSAnalyzer.js';
import { CSRFAnalyzer, CSRFAnalysisResult } from './analyzers/CSRFAnalyzer.js';

export interface WebSecurityResult {
  xss: XSSAnalysisResult;
  csrf: CSRFAnalysisResult;
  summary: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    filesScanned: number;
  };
  recommendations: string[];
}

export class WebSecurityChecker {
  private xssAnalyzer = new XSSAnalyzer();
  private csrfAnalyzer = new CSRFAnalyzer();

  /**
   * Выполняет полный анализ веб-безопасности
   */
  async analyzeWebSecurity(context: CheckContext): Promise<WebSecurityResult> {
    console.log('🔍 Запуск анализа веб-безопасности...');

    try {
      // Параллельный анализ XSS и CSRF
      const [xssResult, csrfResult] = await Promise.all([
        this.xssAnalyzer.analyzeXSS(context),
        this.csrfAnalyzer.analyzeCSRF(context),
      ]);

      console.log(`📊 XSS: ${xssResult.summary.total} уязвимостей найдено`);
      console.log(`📊 CSRF: ${csrfResult.summary.total} проблем найдено`);

      // Создаем общий результат
      const result = this.createWebSecurityResult(xssResult, csrfResult);

      console.log(`✅ Веб-анализ завершен: ${result.summary.totalVulnerabilities} проблем`);

      return result;
    } catch (error) {
      console.error('❌ WebSecurityChecker: Ошибка анализа:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * Создает объединенный результат анализа
   */
  private createWebSecurityResult(
    xssResult: XSSAnalysisResult,
    csrfResult: CSRFAnalysisResult
  ): WebSecurityResult {
    const totalVulnerabilities = xssResult.summary.total + csrfResult.summary.total;
    const criticalCount = xssResult.summary.critical + csrfResult.summary.critical;
    const highCount = xssResult.summary.high + csrfResult.summary.high;
    const mediumCount = xssResult.summary.medium + csrfResult.summary.medium;

    // Генерируем базовые рекомендации
    const recommendations = this.generateBasicRecommendations(xssResult, csrfResult);

    return {
      xss: xssResult,
      csrf: csrfResult,
      summary: {
        totalVulnerabilities,
        criticalCount,
        highCount,
        mediumCount,
        filesScanned: Math.max(xssResult.filesScanned, csrfResult.filesScanned),
      },
      recommendations,
    };
  }

  /**
   * Генерирует базовые рекомендации по безопасности
   */
  private generateBasicRecommendations(
    xssResult: XSSAnalysisResult,
    csrfResult: CSRFAnalysisResult
  ): string[] {
    const recommendations: string[] = [];

    // XSS рекомендации
    if (xssResult.summary.critical > 0) {
      recommendations.push(
        '🚨 КРИТИЧНО: Найдены XSS уязвимости - немедленно санитизируйте вывод HTML'
      );
    }

    if (xssResult.vulnerabilities.some(v => v.type === 'html_output')) {
      recommendations.push(
        '📝 Используйте DOMPurify или аналогичную библиотеку для санитизации HTML'
      );
    }

    if (xssResult.vulnerabilities.some(v => v.type === 'inner_html')) {
      recommendations.push('⚠️ Избегайте прямого присваивания innerHTML - используйте textContent');
    }

    // CSRF рекомендации
    if (csrfResult.summary.high > 0) {
      recommendations.push('🔒 Добавьте CSRF защиту для форм с методами POST/PUT/DELETE');
    }

    if (csrfResult.formsFound > csrfResult.protectedForms) {
      const unprotected = csrfResult.formsFound - csrfResult.protectedForms;
      recommendations.push(`📋 ${unprotected} форм не защищены от CSRF - добавьте токены`);
    }

    if (csrfResult.issues.some(i => i.type === 'cookie_no_samesite')) {
      recommendations.push('🍪 Настройте SameSite атрибут для cookies (strict/lax)');
    }

    // Общие рекомендации
    if (recommendations.length === 0) {
      recommendations.push('✅ Базовый уровень веб-безопасности соблюден');
    } else {
      recommendations.push('📚 Изучите OWASP Top 10 для углубленного понимания веб-безопасности');
    }

    return recommendations;
  }

  /**
   * Создает пустой результат при ошибке
   */
  private createEmptyResult(): WebSecurityResult {
    return {
      xss: {
        vulnerabilities: [],
        filesScanned: 0,
        summary: { critical: 0, high: 0, medium: 0, total: 0 },
      },
      csrf: {
        issues: [],
        filesScanned: 0,
        formsFound: 0,
        protectedForms: 0,
        summary: { critical: 0, high: 0, medium: 0, total: 0 },
      },
      summary: {
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        filesScanned: 0,
      },
      recommendations: ['⚠️ Не удалось выполнить анализ веб-безопасности'],
    };
  }

  /**
   * Получает детальную информацию об XSS уязвимостях
   */
  getXSSDetails(): string[] {
    // Будет реализовано при интеграции с RecommendationEngine
    return [];
  }

  /**
   * Получает детальную информацию о CSRF проблемах
   */
  getCSRFDetails(): string[] {
    // Будет реализовано при интеграции с RecommendationEngine
    return [];
  }
}
