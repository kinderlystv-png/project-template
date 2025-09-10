/**
 * JSON Reporter
 * Генерирует отчеты в формате JSON с поддержкой JSON Schema
 */

import { Project } from '../types/Project';
import { BaseReporter } from './BaseReporter';
import {
  ReportData,
  ReportResult,
  ReporterConfig,
  ReportFormat,
  IReportFormatter,
} from './interfaces';
import { TemplateEngine } from './TemplateEngine';
import { TemplateFormat } from './templates/types';

/**
 * JSON Schema для валидации структуры отчета
 */
const REPORT_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  title: 'EAP Analysis Report Schema',
  properties: {
    metadata: {
      type: 'object',
      required: ['projectName', 'version', 'analysisDate', 'reportGeneratedAt'],
      properties: {
        projectName: { type: 'string' },
        version: { type: 'string' },
        analysisDate: { type: 'string', format: 'date-time' },
        reportGeneratedAt: { type: 'string', format: 'date-time' },
        reporterVersion: { type: 'string' },
        format: { type: 'string', enum: ['json'] },
      },
    },
    summary: {
      type: 'object',
      required: ['overallScore', 'grade', 'passedChecks', 'failedChecks'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
        passedChecks: { type: 'integer', minimum: 0 },
        failedChecks: { type: 'integer', minimum: 0 },
        totalChecks: { type: 'integer', minimum: 0 },
        successRate: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'integer', minimum: 0 },
        analysisTime: { type: 'number', minimum: 0 },
      },
    },
    analysis: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'status', 'items'],
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              status: { type: 'string', enum: ['passed', 'failed', 'warning', 'info'] },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'type', 'title', 'description'],
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string', enum: ['issue', 'success', 'info', 'warning'] },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                    effort: { type: 'number', minimum: 0 },
                    impact: { type: 'number', minimum: 1, maximum: 10 },
                    priority: { type: 'number', minimum: 1, maximum: 10 },
                    location: {
                      type: 'object',
                      properties: {
                        filePath: { type: 'string' },
                        lineNumber: { type: 'integer', minimum: 1 },
                        code: { type: 'string' },
                      },
                    },
                    recommendations: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    metadata: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  required: ['metadata', 'summary', 'analysis'],
} as const;

/**
 * Структура JSON отчета
 */
interface JSONReportStructure {
  metadata: {
    projectName: string;
    version: string;
    analysisDate: string;
    reportGeneratedAt: string;
    reporterVersion: string;
    format: string;
  };
  summary: {
    overallScore: number;
    grade: string;
    passedChecks: number;
    failedChecks: number;
    totalChecks: number;
    successRate: number;
    recommendations: number;
    analysisTime?: number;
  };
  scores: {
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    trend?: {
      current: number;
      previous?: number;
      change?: number;
    };
  };
  analysis: {
    sections: Array<{
      title: string;
      description?: string;
      score?: number;
      status: 'passed' | 'failed' | 'warning' | 'info';
      items: Array<{
        id: string;
        type: 'issue' | 'success' | 'info' | 'warning';
        title: string;
        description: string;
        severity?: 'critical' | 'high' | 'medium' | 'low';
        effort?: number;
        impact?: number;
        priority: number;
        location?: {
          filePath?: string;
          lineNumber?: number;
          code?: string;
        };
        recommendations: string[];
        metadata: Record<string, any>;
      }>;
      subsections?: any[];
    }>;
  };
  recommendations: {
    critical: any[];
    high: any[];
    medium: any[];
    low: any[];
    summary: string[];
  };
  statistics: {
    filesCounted: number;
    linesAnalyzed: number;
    issuesFound: number;
    techDebtHours: number;
    estimatedFixTime: number;
    categories: Record<
      string,
      {
        total: number;
        passed: number;
        failed: number;
        percentage: number;
      }
    >;
  };
  rawData?: {
    checkResults: any[];
    analysisResults: any[];
    evaluationResults: any[];
  };
}

/**
 * Репортер для генерации отчетов в формате JSON
 */
export class JSONReporter extends BaseReporter implements IReportFormatter {
  constructor(config: ReporterConfig = {}) {
    super(config);
  }

  getFormat(): ReportFormat {
    return ReportFormat.JSON;
  }

  getName(): string {
    return 'JSON Reporter';
  }

  async generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult> {
    this.log('Generating JSON report...');

    // Валидируем данные
    this.validateReportData(data);

    // Объединяем конфигурацию
    const finalConfig = { ...this.config, ...config };

    // Сначала пробуем использовать новую систему шаблонов EAP v4.0 Stage 4
    if (finalConfig.templateId) {
      const variables = this.createTemplateVariables(project, data);
      const compiled = await this.compileTemplate(
        finalConfig.templateId,
        TemplateFormat.JSON,
        variables
      );
      if (compiled) {
        const result: ReportResult = {
          content: compiled,
          format: this.getFormat(),
          timestamp: new Date(),
          metadata: {
            projectName: data.projectName,
            reporterName: this.getName(),
            sectionsCount: data.sections.length,
            templateId: finalConfig.templateId,
            ...data.metadata,
          },
        };
        this.log('JSON report generated using template system');
        return result;
      }
    }

    // Генерируем структуру JSON отчета стандартным способом
    const jsonStructure = this.buildJSONStructure(project, data);

    // Валидируем структуру по схеме
    if (finalConfig.custom?.validateSchema !== false) {
      this.validateJSONStructure(jsonStructure);
    }

    // Преобразуем в строку с форматированием
    const content = this.formatJSON(jsonStructure, finalConfig);

    const result: ReportResult = {
      content,
      format: this.getFormat(),
      timestamp: new Date(),
      metadata: {
        projectName: data.projectName,
        reporterName: this.getName(),
        sectionsCount: data.sections.length,
        structureVersion: '4.0',
        isValid: true,
        schema: finalConfig.custom?.includeSchema ? REPORT_JSON_SCHEMA : undefined,
        ...data.metadata,
      },
    };

    this.log('JSON report generated successfully');
    return result;
  }

  /**
   * Валидирует JSON структуру против схемы
   */
  private validateJSONStructure(structure: JSONReportStructure): void {
    try {
      // Базовая валидация обязательных полей
      if (!structure.metadata || !structure.summary || !structure.analysis) {
        throw new Error('Missing required sections in JSON structure');
      }

      // Валидация метаданных
      if (!structure.metadata.projectName || !structure.metadata.analysisDate) {
        throw new Error('Missing required metadata fields');
      }

      // Валидация сводки
      const summary = structure.summary;
      if (
        typeof summary.overallScore !== 'number' ||
        summary.overallScore < 0 ||
        summary.overallScore > 100
      ) {
        throw new Error('Invalid overall score value');
      }

      if (!['A', 'B', 'C', 'D', 'F'].includes(summary.grade)) {
        throw new Error('Invalid grade value');
      }

      // Валидация секций
      if (!Array.isArray(structure.analysis.sections)) {
        throw new Error('Analysis sections must be an array');
      }

      for (const section of structure.analysis.sections) {
        if (!section.title || !Array.isArray(section.items)) {
          throw new Error(`Invalid section structure: ${section.title || 'unnamed'}`);
        }

        for (const item of section.items) {
          if (!item.id || !item.type || !item.title) {
            throw new Error(`Invalid item structure in section: ${section.title}`);
          }

          if (!['issue', 'success', 'info', 'warning'].includes(item.type)) {
            throw new Error(`Invalid item type: ${item.type}`);
          }

          if (item.severity && !['critical', 'high', 'medium', 'low'].includes(item.severity)) {
            throw new Error(`Invalid severity level: ${item.severity}`);
          }
        }
      }

      this.log('JSON structure validation passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`JSON validation error: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Получает JSON Schema для валидации
   */
  getJSONSchema(): typeof REPORT_JSON_SCHEMA {
    return REPORT_JSON_SCHEMA;
  }

  /**
   * Проверяет валидность JSON по схеме
   */
  validateJSON(jsonString: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const data = JSON.parse(jsonString);
      this.validateJSONStructure(data);
      return { valid: true, errors: [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      return { valid: false, errors };
    }
  } /**
   * Создает минимальную JSON структуру
   */
  createMinimalStructure(projectName: string): JSONReportStructure {
    return {
      metadata: {
        projectName,
        version: 'unknown',
        analysisDate: new Date().toISOString(),
        reportGeneratedAt: new Date().toISOString(),
        reporterVersion: '4.0.0',
        format: 'json',
      },
      summary: {
        overallScore: 0,
        grade: 'F',
        passedChecks: 0,
        failedChecks: 0,
        totalChecks: 0,
        successRate: 0,
        recommendations: 0,
      },
      scores: {
        byCategory: {},
        byPriority: {},
      },
      analysis: {
        sections: [],
      },
      recommendations: {
        critical: [],
        high: [],
        medium: [],
        low: [],
        summary: [],
      },
      statistics: {
        filesCounted: 0,
        linesAnalyzed: 0,
        issuesFound: 0,
        techDebtHours: 0,
        estimatedFixTime: 0,
        categories: {},
      },
    };
  }

  /**
   * Экспортирует данные в различных JSON форматах
   */
  exportToFormats(structure: JSONReportStructure): {
    pretty: string;
    minified: string;
    summary: string;
    schemaOnly: string;
  } {
    return {
      pretty: JSON.stringify(structure, null, 2),
      minified: JSON.stringify(structure),
      summary: JSON.stringify(
        {
          metadata: structure.metadata,
          summary: structure.summary,
        },
        null,
        2
      ),
      schemaOnly: JSON.stringify(REPORT_JSON_SCHEMA, null, 2),
    };
  }

  /**
   * Создает диффы между двумя JSON отчетами
   */
  createReportDiff(
    current: JSONReportStructure,
    previous: JSONReportStructure
  ): {
    scoreChange: number;
    gradeChange: string;
    newIssues: number;
    resolvedIssues: number;
    changes: string[];
  } {
    const scoreChange = current.summary.overallScore - previous.summary.overallScore;
    const gradeChange = `${previous.summary.grade} → ${current.summary.grade}`;

    const currentIssues = current.analysis.sections.flatMap(s =>
      s.items.filter(i => i.type === 'issue')
    );
    const previousIssues = previous.analysis.sections.flatMap(s =>
      s.items.filter(i => i.type === 'issue')
    );

    const newIssues = currentIssues.filter(
      ci => !previousIssues.some(pi => pi.id === ci.id)
    ).length;
    const resolvedIssues = previousIssues.filter(
      pi => !currentIssues.some(ci => ci.id === pi.id)
    ).length;

    const changes: string[] = [];
    if (scoreChange !== 0) changes.push(`Score: ${scoreChange > 0 ? '+' : ''}${scoreChange}`);
    if (newIssues > 0) changes.push(`New issues: +${newIssues}`);
    if (resolvedIssues > 0) changes.push(`Resolved: -${resolvedIssues}`);

    return {
      scoreChange,
      gradeChange,
      newIssues,
      resolvedIssues,
      changes,
    };
  }

  /**
   * Строит структуру JSON отчета
   */
  private buildJSONStructure(project: Project, data: ReportData): JSONReportStructure {
    const summary = this.createSummary(data);
    const groups = this.groupItemsByType(data.sections);
    const statistics = this.calculateStatistics(data);

    return {
      metadata: {
        projectName: data.projectName,
        version: data.version || 'unknown',
        analysisDate: data.analysisDate.toISOString(),
        reportGeneratedAt: new Date().toISOString(),
        reporterVersion: '4.0.0',
        format: 'json',
      },
      summary: {
        overallScore: summary.score,
        grade: summary.grade,
        passedChecks: summary.passedChecks,
        failedChecks: summary.failedChecks,
        totalChecks: summary.passedChecks + summary.failedChecks,
        successRate: this.calculateSuccessRate(summary),
        recommendations: summary.recommendations,
        analysisTime: summary.analysisTime,
      },
      scores: this.buildScoresSection(data),
      analysis: {
        sections: data.sections.map((section, index) => this.transformSection(section, index)),
      },
      recommendations: {
        critical: groups.critical,
        high: groups.high,
        medium: groups.medium,
        low: groups.low,
        summary: this.collectAllRecommendations(data.sections),
      },
      statistics,
      rawData: this.includeRawData()
        ? {
            checkResults: data.metadata.checkResults || [],
            analysisResults: data.metadata.analysisResults || [],
            evaluationResults: data.metadata.evaluationResults || [],
          }
        : undefined,
    };
  }

  /**
   * Строит секцию оценок
   */
  private buildScoresSection(data: ReportData) {
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    // Группируем оценки по категориям
    for (const section of data.sections) {
      if (section.score !== undefined) {
        byCategory[section.title] = section.score;
      }

      // Подсчитываем приоритеты
      for (const item of section.items) {
        if (item.severity && byPriority[item.severity] !== undefined) {
          byPriority[item.severity]++;
        }
      }
    }

    return {
      byCategory,
      byPriority,
      trend: this.calculateTrend(data),
    };
  }

  /**
   * Трансформирует секцию отчета для JSON
   */
  private transformSection(section: any, index: number) {
    const issuesCount = section.items.filter((item: any) => item.type === 'issue').length;
    const status: 'passed' | 'failed' | 'warning' | 'info' =
      issuesCount === 0 ? 'passed' : issuesCount > 5 ? 'failed' : 'warning';

    return {
      title: section.title,
      description: section.description,
      score: section.score,
      status,
      items: section.items.map((item: any, itemIndex: number) =>
        this.transformItem(item, `${index}-${itemIndex}`)
      ),
      subsections: section.subsections
        ? section.subsections.map((sub: any, subIndex: number) =>
            this.transformSection(sub, index * 100 + subIndex)
          )
        : undefined,
    };
  }

  /**
   * Трансформирует элемент отчета для JSON
   */
  private transformItem(item: any, id: string) {
    return {
      id,
      type: item.type,
      title: item.title,
      description: item.description,
      severity: item.severity,
      effort: item.effort,
      impact: item.impact,
      priority: this.calculatePriority(item),
      location:
        item.filePath || item.lineNumber || item.code
          ? {
              filePath: item.filePath,
              lineNumber: item.lineNumber,
              code: item.code,
            }
          : undefined,
      recommendations: item.recommendations || [],
      metadata: item.metadata || {},
    };
  }

  /**
   * Вычисляет статистику проекта
   */
  private calculateStatistics(data: ReportData) {
    const categories: Record<string, any> = {};
    let filesCounted = 0;
    let linesAnalyzed = 0;
    let issuesFound = 0;
    let techDebtHours = 0;

    // Анализируем секции
    for (const section of data.sections) {
      const sectionStats = {
        total: section.items.length,
        passed: section.items.filter(item => item.type === 'success').length,
        failed: section.items.filter(item => item.type === 'issue').length,
        percentage: 0,
      };

      sectionStats.percentage =
        sectionStats.total > 0 ? Math.round((sectionStats.passed / sectionStats.total) * 100) : 0;

      categories[section.title] = sectionStats;

      // Подсчитываем общую статистику
      issuesFound += sectionStats.failed;

      for (const item of section.items) {
        if (item.effort) {
          techDebtHours += item.effort;
        }
      }
    }

    // Получаем статистику из метаданных если доступна
    if (data.metadata.projectStats) {
      filesCounted = data.metadata.projectStats.filesCount || 0;
      linesAnalyzed = data.metadata.projectStats.linesCount || 0;
    }

    return {
      filesCounted,
      linesAnalyzed,
      issuesFound,
      techDebtHours,
      estimatedFixTime: Math.round(techDebtHours * 1.2), // +20% на тестирование
      categories,
    };
  }

  /**
   * Форматирует JSON с учетом конфигурации
   */
  private formatJSON(structure: JSONReportStructure, config: ReporterConfig): string {
    const indent = config.custom?.indent || 2;
    const compact = config.custom?.compact || false;

    if (compact) {
      return JSON.stringify(structure);
    }

    return JSON.stringify(structure, null, indent);
  }

  // Вспомогательные методы

  private calculateSuccessRate(summary: any): number {
    const total = summary.passedChecks + summary.failedChecks;
    return total > 0 ? Math.round((summary.passedChecks / total) * 100) : 0;
  }

  private calculatePriority(item: any): number {
    // Вычисляем приоритет на основе серьезности и влияния
    let priority = 1;

    if (item.severity) {
      switch (item.severity) {
        case 'critical':
          priority = 4;
          break;
        case 'high':
          priority = 3;
          break;
        case 'medium':
          priority = 2;
          break;
        case 'low':
          priority = 1;
          break;
      }
    }

    if (item.impact) {
      priority = Math.max(priority, Math.ceil(item.impact / 3));
    }

    return priority;
  }

  private calculateTrend(data: ReportData) {
    // Если есть предыдущие данные в метаданных
    if (data.metadata.previousScore) {
      const current = this.calculateOverallScore(data);
      const previous = data.metadata.previousScore;
      return {
        current,
        previous,
        change: current - previous,
      };
    }

    return {
      current: this.calculateOverallScore(data),
    };
  }

  private collectAllRecommendations(sections: any[]): string[] {
    const recommendations: string[] = [];

    for (const section of sections) {
      for (const item of section.items) {
        if (item.recommendations) {
          recommendations.push(...item.recommendations);
        }
      }
    }

    return [...new Set(recommendations)];
  }

  private includeRawData(): boolean {
    return this.config.custom?.includeRawData === true;
  }

  // Реализация IReportFormatter
  formatHeader(project: Project, data: ReportData): string {
    return JSON.stringify(
      {
        projectName: data.projectName,
        version: data.version,
        analysisDate: data.analysisDate.toISOString(),
      },
      null,
      2
    );
  }

  formatSummary(data: ReportData): string {
    return JSON.stringify(data.summary, null, 2);
  }

  formatDetails(data: ReportData): string {
    return JSON.stringify(data.sections, null, 2);
  }

  formatRecommendations(data: ReportData): string {
    const recommendations = this.collectAllRecommendations(data.sections);
    return JSON.stringify(recommendations, null, 2);
  }

  formatContent(data: ReportData, template?: string): string {
    if (template) {
      // Для JSON шаблонизация означает преобразование в JSON с пользовательской схемой
      try {
        const templateObj = JSON.parse(template);
        const variables = this.createTemplateVariables(
          { path: '', name: data.projectName } as Project,
          data
        );
        return JSON.stringify(this.applyTemplateToObject(templateObj, variables), null, 2);
      } catch (e) {
        console.warn('Invalid JSON template, using default structure');
      }
    }

    return JSON.stringify(
      this.buildJSONStructure({ path: '', name: data.projectName } as Project, data),
      null,
      2
    );
  }

  getDefaultTemplate(): string {
    return JSON.stringify(
      {
        project: '{{projectName}}',
        date: '{{analysisDate}}',
        score: '{{summary.score}}',
        grade: '{{summary.grade}}',
        sections: '{{sections}}',
      },
      null,
      2
    );
  }

  supportsTemplating(): boolean {
    return true;
  }

  /**
   * Применяет переменные к объекту шаблона
   */
  private applyTemplateToObject(obj: any, variables: any): any {
    if (typeof obj === 'string') {
      return this.applyTemplate(obj, variables);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.applyTemplateToObject(item, variables));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.applyTemplateToObject(value, variables);
      }
      return result;
    }

    return obj;
  }
}
