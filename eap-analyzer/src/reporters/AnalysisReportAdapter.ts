/**
 * EAP Analysis to Report Data Adapter
 * Адаптер для преобразования результатов анализа EAP в данные для отчетов
 */

import { Project } from '../types/Project';
import { FullAnalysisResult, CheckResult } from '../core/types';
import { ReportData, ReportSummary, ReportSection, ReportItem, ReportFormat } from './interfaces';

/**
 * Адаптер для преобразования результатов анализа в данные отчета
 */
export class AnalysisReportAdapter {
  /**
   * Преобразует результат полного анализа в данные для отчета
   */
  static convertAnalysisToReportData(
    project: Project,
    analysis: FullAnalysisResult,
    options: {
      version?: string;
      includeMetadata?: boolean;
      groupByCategory?: boolean;
    } = {}
  ): ReportData {
    const { version = '4.0.0', includeMetadata = true, groupByCategory = true } = options;

    // Создаем сводку
    const summary = this.createSummary(analysis);

    // Создаем секции отчета
    const sections = groupByCategory
      ? this.createSectionsByCategory(analysis)
      : this.createSectionsByChecker(analysis);

    // Создаем метаданные
    const metadata = includeMetadata ? this.createMetadata(project, analysis) : {};

    return {
      projectName: project.name,
      analysisDate: new Date(),
      version,
      summary,
      sections,
      metadata,
    };
  }

  /**
   * Создает сводную информацию из результатов анализа
   */
  private static createSummary(analysis: FullAnalysisResult): ReportSummary {
    const allResults = Object.values(analysis.checks);
    const passedChecks = allResults.filter(result => result.passed).length;
    const failedChecks = allResults.filter(result => !result.passed).length;

    // Берем общий балл из сводки анализа
    const score = analysis.summary.overallScore;

    // Определяем оценку
    const grade = this.calculateGrade(score);

    // Считаем общее количество рекомендаций
    const recommendations = analysis.summary.recommendations.length;

    return {
      score: Math.round(score),
      grade,
      passedChecks,
      failedChecks,
      recommendations,
      analysisTime: analysis.metadata?.duration,
    };
  }

  /**
   * Создает секции, сгруппированные по категориям
   */
  private static createSectionsByCategory(analysis: FullAnalysisResult): ReportSection[] {
    const categories = new Map<string, CheckResult[]>();

    // Группируем результаты по категориям
    Object.values(analysis.checks).forEach(result => {
      const category = this.getCategoryDisplayName(result.category);

      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(result);
    });

    // Создаем секции для каждой категории
    return Array.from(categories.entries()).map(([categoryName, results]) => {
      const sectionScore = this.calculateSectionScore(results);

      return {
        title: categoryName,
        description: this.getCategoryDescription(categoryName),
        score: sectionScore,
        items: results.map(result => this.convertCheckResultToReportItem(result)),
      };
    });
  }

  /**
   * Создает секции, сгруппированные по чекерам
   */
  private static createSectionsByChecker(analysis: FullAnalysisResult): ReportSection[] {
    return Object.values(analysis.checks).map(result => ({
      title: this.formatCheckerName(result.checker),
      description: result.message,
      score: result.passed ? 100 : 0,
      items: [this.convertCheckResultToReportItem(result)],
    }));
  }

  /**
   * Преобразует результат проверки в элемент отчета
   */
  private static convertCheckResultToReportItem(result: CheckResult): ReportItem {
    return {
      type: result.passed ? 'success' : 'issue',
      title: this.formatCheckerName(result.checker),
      description: result.message,
      severity: this.mapCategoryToSeverity(result.category),
      effort: undefined, // Не определено в базовом CheckResult
      impact: undefined, // Не определено в базовом CheckResult
      code: undefined, // Не определено в базовом CheckResult
      filePath: undefined, // Не определено в базовом CheckResult
      lineNumber: undefined, // Не определено в базовом CheckResult
      recommendations: result.recommendations || [],
      metadata: {
        checker: result.checker,
        category: result.category,
        timestamp: result.timestamp,
        score: result.score,
        details: result.details,
      },
    };
  }

  /**
   * Создает метаданные отчета
   */
  private static createMetadata(
    project: Project,
    analysis: FullAnalysisResult
  ): Record<string, any> {
    return {
      projectPath: project.path,
      analysisVersion: analysis.metadata?.version || '4.0.0',
      checkers: Object.keys(analysis.checks),
      totalFiles: 0, // Не определено в базовом AnalysisMetadata
      analysisOptions: {}, // Не определено в базовом AnalysisMetadata
      categories: analysis.summary.categories,
      criticalIssues: analysis.summary.criticalIssues,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString(),
      },
    };
  } /**
   * Рассчитывает оценку на основе процента успешных проверок
   */
  private static calculateGrade(successRate: number): string {
    if (successRate >= 90) return 'A';
    if (successRate >= 80) return 'B';
    if (successRate >= 70) return 'C';
    if (successRate >= 60) return 'D';
    return 'F';
  }

  /**
   * Рассчитывает балл секции на основе результатов
   */
  private static calculateSectionScore(results: CheckResult[]): number {
    if (results.length === 0) return 0;

    const successCount = results.filter(r => r.passed).length;
    return Math.round((successCount / results.length) * 100);
  }

  /**
   * Получает отображаемое имя категории
   */
  private static getCategoryDisplayName(category: string): string {
    const displayNames: Record<string, string> = {
      quality: 'Качество кода',
      security: 'Безопасность',
      performance: 'Производительность',
      structure: 'Структура проекта',
    };

    return displayNames[category] || 'Общие проверки';
  }

  /**
   * Преобразует категорию в уровень серьезности
   */
  private static mapCategoryToSeverity(category: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (category) {
      case 'security':
        return 'critical';
      case 'performance':
        return 'high';
      case 'quality':
        return 'medium';
      case 'structure':
        return 'low';
      default:
        return 'medium';
    }
  } /**
   * Извлекает категорию из имени чекера
   */
  private static extractCategory(checkerName: string): string | null {
    // Попытка извлечь категорию из имени чекера
    if (checkerName.includes('Security')) return 'Безопасность';
    if (checkerName.includes('Performance')) return 'Производительность';
    if (checkerName.includes('Quality') || checkerName.includes('Code')) return 'Качество кода';
    if (checkerName.includes('Test')) return 'Тестирование';
    if (checkerName.includes('Docker')) return 'Контейнеризация';
    if (checkerName.includes('EMT')) return 'EMT Анализ';
    if (checkerName.includes('Documentation') || checkerName.includes('Docs'))
      return 'Документация';
    if (checkerName.includes('Config') || checkerName.includes('Configuration'))
      return 'Конфигурация';

    return null;
  }

  /**
   * Получает описание категории
   */
  private static getCategoryDescription(categoryName: string): string {
    const descriptions: Record<string, string> = {
      Безопасность: 'Анализ уязвимостей и безопасности кода',
      Производительность: 'Оценка производительности и оптимизации',
      'Качество кода': 'Проверка стиля кода, архитектуры и лучших практик',
      Тестирование: 'Анализ покрытия тестами и качества тестов',
      Контейнеризация: 'Проверка Docker конфигурации и оптимизации',
      'EMT Анализ': 'Специфичный анализ EMT компонентов',
      Документация: 'Проверка качества и полноты документации',
      Конфигурация: 'Анализ файлов конфигурации проекта',
      'Общие проверки': 'Базовые проверки структуры проекта',
    };

    return descriptions[categoryName] || 'Дополнительные проверки качества';
  }

  /**
   * Форматирует имя чекера для отображения
   */
  private static formatCheckerName(checkerName: string): string {
    return checkerName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Преобразует внутреннюю систему severity в стандартную
   */
  private static mapSeverity(severity?: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'critical';
      case 'high':
      case 'warning':
        return 'high';
      case 'medium':
      case 'info':
        return 'medium';
      case 'low':
      case 'suggestion':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Создает быстрый отчет для одного чекера
   */
  static createQuickReport(
    project: Project,
    checkerName: string,
    result: CheckResult,
    format: ReportFormat = ReportFormat.MARKDOWN
  ): ReportData {
    const item = this.convertCheckResultToReportItem(result);

    return {
      projectName: project.name,
      analysisDate: new Date(),
      version: '4.0.0',
      summary: {
        score: result.passed ? 100 : 0,
        grade: result.passed ? 'A' : 'F',
        passedChecks: result.passed ? 1 : 0,
        failedChecks: result.passed ? 0 : 1,
        recommendations: result.recommendations?.length || 0,
      },
      sections: [
        {
          title: this.formatCheckerName(checkerName),
          description: `Результат проверки: ${checkerName}`,
          score: result.passed ? 100 : 0,
          items: [item],
        },
      ],
      metadata: {
        quickReport: true,
        checker: checkerName,
        format,
      },
    };
  }
}

export default AnalysisReportAdapter;
