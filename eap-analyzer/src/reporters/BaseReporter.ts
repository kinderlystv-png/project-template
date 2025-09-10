/**
 * Base Reporter
 * Базовый класс для всех репортеров EAP v4.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { Project } from '../types/Project';
import {
  IReporter,
  ReportData,
  ReportResult,
  ReporterConfig,
  ReportFormat,
  ReportSummary,
  ReportSection,
} from './interfaces';
import { TemplateEngine, TemplateVariables } from './TemplateEngine';
import { TemplateManager } from './templates/TemplateManager';
import { TemplateFormat, TemplateCategory, TemplateUsageStats } from './templates/types';

/**
 * Базовый класс для всех репортеров
 */
export abstract class BaseReporter implements IReporter {
  protected config: ReporterConfig;
  protected templateEngine: TemplateEngine;
  protected templateManager: TemplateManager;

  constructor(config: ReporterConfig = {}) {
    this.config = {
      outputDir: 'reports',
      includeTimestamp: true,
      verbose: false,
      ...config,
    };

    // Инициализируем TemplateEngine
    this.templateEngine = config.templateEngine || new TemplateEngine();

    // Инициализируем TemplateManager для новой системы шаблонов
    this.templateManager = new TemplateManager();
  }

  /**
   * Абстрактный метод для генерации отчета
   * Должен быть реализован в каждом конкретном репортере
   */
  abstract generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult>;

  /**
   * Абстрактный метод для получения формата отчета
   */
  abstract getFormat(): ReportFormat;

  /**
   * Абстрактный метод для получения названия репортера
   */
  abstract getName(): string;

  /**
   * Общий метод для сохранения отчета в файл
   */
  async saveReport(reportResult: ReportResult, outputPath?: string): Promise<string> {
    const filePath = outputPath || this.generateFilePath(reportResult);

    // Создаем директорию если не существует
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Записываем содержимое в файл
    fs.writeFileSync(filePath, reportResult.content, 'utf-8');

    if (this.config.verbose) {
      console.log(`Report saved to: ${filePath}`);
    }

    return filePath;
  }

  /**
   * Генерирует путь для сохранения файла отчета
   */
  protected generateFilePath(reportResult: ReportResult): string {
    const fileName = this.config.fileName || this.generateFileName(reportResult);
    return path.join(this.config.outputDir!, fileName);
  }

  /**
   * Генерирует имя файла для отчета
   */
  protected generateFileName(reportResult: ReportResult): string {
    const format = reportResult.format;
    const timestamp = this.config.includeTimestamp
      ? `-${reportResult.timestamp.toISOString().slice(0, 19).replace(/[:.]/g, '-')}`
      : '';

    return `eap-report${timestamp}.${this.getFileExtension(format)}`;
  }

  /**
   * Возвращает расширение файла для формата
   */
  protected getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.MARKDOWN:
        return 'md';
      case ReportFormat.JSON:
        return 'json';
      case ReportFormat.HTML:
        return 'html';
      case ReportFormat.PLAIN_TEXT:
        return 'txt';
      default:
        return 'txt';
    }
  }

  /**
   * Вычисляет общий балл проекта
   */
  protected calculateOverallScore(data: ReportData): number {
    if (data.summary.score !== undefined) {
      return data.summary.score;
    }

    // Средневзвешенная оценка по секциям
    let totalScore = 0;
    let totalWeight = 0;

    for (const section of data.sections) {
      if (section.score !== undefined) {
        totalScore += section.score;
        totalWeight += 1;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Определяет буквенную оценку на основе числового балла
   */
  protected getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Создает сводную информацию если она не задана
   */
  protected createSummary(data: ReportData): ReportSummary {
    if (data.summary) {
      return data.summary;
    }

    // Подсчитываем статистику из секций
    let passedChecks = 0;
    let failedChecks = 0;
    let recommendations = 0;

    for (const section of data.sections) {
      for (const item of section.items) {
        if (item.type === 'success') {
          passedChecks++;
        } else if (item.type === 'issue') {
          failedChecks++;
        }
        if (item.recommendations) {
          recommendations += item.recommendations.length;
        }
      }
    }

    const score = this.calculateOverallScore(data);
    const grade = this.getGrade(score);

    return {
      score,
      grade,
      passedChecks,
      failedChecks,
      recommendations,
    };
  }

  /**
   * Фильтрует секции отчета по критериям
   */
  protected filterSections(
    sections: ReportSection[],
    filter?: (section: ReportSection) => boolean
  ): ReportSection[] {
    if (!filter) return sections;
    return sections.filter(filter);
  }

  /**
   * Сортирует секции отчета
   */
  protected sortSections(
    sections: ReportSection[],
    compareFn?: (a: ReportSection, b: ReportSection) => number
  ): ReportSection[] {
    if (!compareFn) {
      // Сортировка по умолчанию: по убыванию важности (количество issues)
      return sections.sort((a, b) => {
        const aIssues = a.items.filter(item => item.type === 'issue').length;
        const bIssues = b.items.filter(item => item.type === 'issue').length;
        return bIssues - aIssues;
      });
    }
    return sections.sort(compareFn);
  }

  /**
   * Группирует элементы отчета по типу
   */
  protected groupItemsByType(sections: ReportSection[]) {
    const groups = {
      critical: [] as any[],
      high: [] as any[],
      medium: [] as any[],
      low: [] as any[],
      success: [] as any[],
    };

    for (const section of sections) {
      for (const item of section.items) {
        if (item.type === 'success') {
          groups.success.push({ ...item, section: section.title });
        } else if (item.severity) {
          groups[item.severity].push({ ...item, section: section.title });
        } else {
          groups.medium.push({ ...item, section: section.title });
        }
      }
    }

    return groups;
  }

  /**
   * Валидирует структуру данных отчета
   */
  protected validateReportData(data: ReportData): void {
    if (!data.projectName) {
      throw new Error('Project name is required');
    }
    if (!data.analysisDate) {
      throw new Error('Analysis date is required');
    }
    if (!data.sections || data.sections.length === 0) {
      console.warn('Report data contains no sections');
    }
  }

  /**
   * Логирует информацию о процессе генерации отчета
   */
  protected log(message: string): void {
    if (this.config.verbose) {
      console.log(`[${this.getName()}] ${message}`);
    }
  }

  /**
   * Создает переменные для шаблона из данных отчета
   */
  protected createTemplateVariables(project: Project, data: ReportData): TemplateVariables {
    return {
      projectName: data.projectName,
      analysisDate: data.analysisDate.toLocaleDateString('ru-RU'),
      version: data.version,
      summary: data.summary,
      sections: data.sections,
      metadata: data.metadata,
      // Дополнительные переменные
      reportDate: new Date().toLocaleDateString('ru-RU'),
      reportTime: new Date().toLocaleTimeString('ru-RU'),
      reportFormat: this.getFormat(),
      reporterName: this.getName(),
      projectPath: project.path || '',
      // Вычисляемые значения
      totalIssues: data.sections.reduce(
        (total, section) => total + section.items.filter(item => item.type === 'issue').length,
        0
      ),
      totalWarnings: data.sections.reduce(
        (total, section) => total + section.items.filter(item => item.type === 'warning').length,
        0
      ),
      totalSuccess: data.sections.reduce(
        (total, section) => total + section.items.filter(item => item.type === 'success').length,
        0
      ),
      // Функции-помощники для шаблонов
      formatScore: (score: number) => score.toFixed(1),
      formatDate: (date: Date) => date.toLocaleDateString('ru-RU'),
      capitalize: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
    };
  }

  /**
   * Применяет шаблон к контенту
   */
  protected applyTemplate(template: string, variables: TemplateVariables): string {
    return this.templateEngine.render(template, variables);
  }

  /**
   * Получает шаблон по умолчанию для данного формата
   */
  protected getDefaultTemplate(): string {
    return `{{projectName}} - Анализ проекта

Дата анализа: {{analysisDate}}
Версия ЭАП: {{version}}
Общий балл: {{summary.score}}/100 ({{summary.grade}})

{{#each sections}}
## {{title}}

{{#each items}}
- {{title}}: {{description}}
{{/each}}

{{/each}}`;
  }

  /**
   * Проверяет, поддерживает ли репортер шаблонизацию
   */
  protected supportsTemplating(): boolean {
    return true;
  }

  // ===== Методы новой системы шаблонов EAP v4.0 Stage 4 =====

  /**
   * Компилирует шаблон с использованием новой системы шаблонов
   */
  protected async compileTemplate(
    templateId: string,
    format: TemplateFormat,
    variables: TemplateVariables
  ): Promise<string | null> {
    const compiled = await this.templateManager.compileTemplate(templateId, variables);
    return compiled?.content || null;
  }

  /**
   * Получает список доступных шаблонов для данного формата
   */
  protected async getAvailableTemplates(
    format: TemplateFormat,
    category?: TemplateCategory
  ): Promise<Array<{ id: string; name: string; description: string }>> {
    const searchResult = await this.templateManager.searchTemplates({
      format,
      category,
    });

    return searchResult.templates.map(template => ({
      id: template.metadata.id,
      name: template.metadata.name,
      description: template.metadata.description || '',
    }));
  }

  /**
   * Создает превью шаблона с тестовыми данными
   */
  protected async previewTemplate(
    templateId: string,
    sampleData?: TemplateVariables
  ): Promise<string | null> {
    const defaultSampleData = this.createSampleData();
    const preview = await this.templateManager.previewTemplate(
      templateId,
      sampleData || defaultSampleData
    );
    return preview.success ? preview.content || null : null;
  }

  /**
   * Создает тестовые данные для превью шаблонов
   */
  protected createSampleData(): TemplateVariables {
    return {
      projectName: 'Пример проекта',
      analysisDate: new Date().toLocaleDateString('ru-RU'),
      version: '4.0',
      summary: {
        score: 85.5,
        grade: 'B',
        passedChecks: 42,
        failedChecks: 8,
        recommendations: 15,
      },
      sections: [
        {
          title: 'Архитектура',
          score: 90,
          status: 'good',
          items: [
            {
              title: 'Модульность',
              type: 'success',
              description: 'Код хорошо разделен на модули',
            },
          ],
        },
      ],
    };
  }

  /**
   * Получает статистику использования шаблонов
   */
  protected getTemplateUsageStats(): TemplateUsageStats[] {
    return this.templateManager.getUsageStatistics();
  }
}
