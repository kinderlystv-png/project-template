/**
 * Unified Reporting System
 * Основной класс для координации всех репортеров и создания комплексных отчетов
 */

import { Project } from '../types/Project';
import { ReporterFactory } from './ReporterFactory';
import { ExecutiveSummaryReporter } from './specialized/ExecutiveSummaryReporter';
import { TechnicalDebtReporter } from './specialized/TechnicalDebtReporter';
import { RoadmapReporter } from './specialized/RoadmapReporter';
import { IReporter, ReportData, ReportResult, ReporterConfig, ReportFormat } from './interfaces';

/**
 * Конфигурация для унифицированной системы отчетов
 */
export interface UnifiedReportingConfig {
  formats?: ReportFormat[];
  outputDir?: string;
  includeExecutiveSummary?: boolean;
  includeTechnicalDebt?: boolean;
  includeRoadmap?: boolean;
  customReporters?: IReporter[];
  reportingOptions?: {
    [key: string]: any;
  };
}

/**
 * Результат унифицированной отчетности
 */
export interface UnifiedReportResult {
  reports: Map<string, ReportResult>;
  summary: {
    totalReports: number;
    generatedAt: Date;
    formats: ReportFormat[];
    outputPaths: string[];
    errors: string[];
  };
  metadata: Record<string, any>;
}

/**
 * Унифицированная система отчетности EAP v4.0
 */
export class UnifiedReportingSystem {
  private config: UnifiedReportingConfig;
  private reporters: Map<string, IReporter> = new Map();
  private specializedReporters: Map<string, IReporter> = new Map();

  constructor(config: UnifiedReportingConfig = {}) {
    this.config = {
      formats: [ReportFormat.MARKDOWN, ReportFormat.JSON, ReportFormat.HTML],
      outputDir: 'reports',
      includeExecutiveSummary: true,
      includeTechnicalDebt: true,
      includeRoadmap: true,
      ...config,
    };

    this.initializeReporters();
  }

  /**
   * Инициализирует стандартные и специализированные репортеры
   */
  private initializeReporters(): void {
    // Создаем стандартные репортеры для всех форматов
    for (const format of this.config.formats!) {
      try {
        const reporter = ReporterFactory.createReporter(format, {
          outputDir: this.config.outputDir,
          verbose: true,
        });
        this.reporters.set(format, reporter);
      } catch (error) {
        console.warn(`Failed to create reporter for format ${format}:`, error);
      }
    }

    // Создаем специализированные репортеры
    if (this.config.includeExecutiveSummary) {
      this.specializedReporters.set(
        'executive-summary',
        new ExecutiveSummaryReporter({ outputDir: this.config.outputDir })
      );
    }

    if (this.config.includeTechnicalDebt) {
      this.specializedReporters.set(
        'technical-debt',
        new TechnicalDebtReporter({ outputDir: this.config.outputDir })
      );
    }

    if (this.config.includeRoadmap) {
      this.specializedReporters.set(
        'roadmap',
        new RoadmapReporter({ outputDir: this.config.outputDir })
      );
    }

    // Добавляем пользовательские репортеры
    if (this.config.customReporters) {
      for (let i = 0; i < this.config.customReporters.length; i++) {
        const reporter = this.config.customReporters[i];
        this.specializedReporters.set(`custom-${i}`, reporter);
      }
    }
  }

  /**
   * Генерирует все отчеты
   * @param project - Анализируемый проект
   * @param data - Данные для отчетов
   */
  async generateAllReports(project: Project, data: ReportData): Promise<UnifiedReportResult> {
    console.log('🚀 Starting unified report generation...');

    const reports = new Map<string, ReportResult>();
    const errors: string[] = [];
    const outputPaths: string[] = [];

    // Генерируем стандартные отчеты
    await this.generateStandardReports(project, data, reports, errors, outputPaths);

    // Генерируем специализированные отчеты
    await this.generateSpecializedReports(project, data, reports, errors, outputPaths);

    const result: UnifiedReportResult = {
      reports,
      summary: {
        totalReports: reports.size,
        generatedAt: new Date(),
        formats: this.config.formats!,
        outputPaths,
        errors,
      },
      metadata: {
        projectName: data.projectName,
        reportingSystemVersion: '4.0.0',
        configUsed: this.config,
      },
    };

    console.log(`✅ Generated ${reports.size} reports successfully`);
    if (errors.length > 0) {
      console.warn(`⚠️ Encountered ${errors.length} errors during generation`);
    }

    return result;
  }

  /**
   * Генерирует стандартные отчеты (Markdown, JSON, HTML)
   */
  private async generateStandardReports(
    project: Project,
    data: ReportData,
    reports: Map<string, ReportResult>,
    errors: string[],
    outputPaths: string[]
  ): Promise<void> {
    for (const [format, reporter] of this.reporters) {
      try {
        console.log(`📝 Generating ${format} report...`);

        const reportResult = await reporter.generateReport(project, data);
        const savedPath = await reporter.saveReport(reportResult);

        reports.set(`standard-${format}`, reportResult);
        outputPaths.push(savedPath);

        console.log(`✅ ${format} report saved to: ${savedPath}`);
      } catch (error) {
        const errorMsg = `Failed to generate ${format} report: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
  }

  /**
   * Генерирует специализированные отчеты
   */
  private async generateSpecializedReports(
    project: Project,
    data: ReportData,
    reports: Map<string, ReportResult>,
    errors: string[],
    outputPaths: string[]
  ): Promise<void> {
    for (const [name, reporter] of this.specializedReporters) {
      try {
        console.log(`📊 Generating ${name} report...`);

        // Настраиваем специализированные репортеры если нужно
        this.configureSpecializedReporter(name, reporter);

        const reportResult = await reporter.generateReport(project, data);
        const savedPath = await reporter.saveReport(reportResult);

        reports.set(name, reportResult);
        outputPaths.push(savedPath);

        console.log(`✅ ${name} report saved to: ${savedPath}`);
      } catch (error) {
        const errorMsg = `Failed to generate ${name} report: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
  }

  /**
   * Настраивает специализированные репортеры
   */
  private configureSpecializedReporter(name: string, reporter: IReporter): void {
    const options = this.config.reportingOptions?.[name];
    if (!options) return;

    // Проверяем, поддерживает ли репортер настройку
    if ('configure' in reporter && typeof reporter.configure === 'function') {
      (reporter as any).configure(options);
    }
  }

  /**
   * Генерирует отчет определенного типа
   * @param reportType - Тип отчета ('executive-summary', 'technical-debt', 'roadmap', или формат)
   * @param project - Анализируемый проект
   * @param data - Данные для отчета
   */
  async generateReport(
    reportType: string,
    project: Project,
    data: ReportData
  ): Promise<ReportResult> {
    console.log(`📝 Generating ${reportType} report...`);

    let reporter: IReporter | undefined;

    // Ищем среди специализированных репортеров
    if (this.specializedReporters.has(reportType)) {
      reporter = this.specializedReporters.get(reportType);
    }
    // Ищем среди стандартных репортеров
    else if (this.reporters.has(reportType)) {
      reporter = this.reporters.get(reportType);
    }
    // Пытаемся создать репортер по формату
    else {
      try {
        const format = reportType as ReportFormat;
        reporter = ReporterFactory.createReporter(format, {
          outputDir: this.config.outputDir,
        });
      } catch (error) {
        throw new Error(`Unknown report type: ${reportType}`);
      }
    }

    if (!reporter) {
      throw new Error(`Reporter not found for type: ${reportType}`);
    }

    return await reporter.generateReport(project, data);
  }

  /**
   * Сохраняет все отчеты
   * @param unifiedResult - Результат унифицированной генерации
   */
  async saveAllReports(unifiedResult: UnifiedReportResult): Promise<string[]> {
    const savedPaths: string[] = [];

    for (const [name, reportResult] of unifiedResult.reports) {
      try {
        // Получаем соответствующий репортер
        let reporter: IReporter | undefined;

        if (this.specializedReporters.has(name)) {
          reporter = this.specializedReporters.get(name);
        } else {
          const format = name.replace('standard-', '') as ReportFormat;
          reporter = this.reporters.get(format);
        }

        if (reporter) {
          const savedPath = await reporter.saveReport(reportResult);
          savedPaths.push(savedPath);
        }
      } catch (error) {
        console.error(`Failed to save report ${name}:`, error);
      }
    }

    return savedPaths;
  }

  /**
   * Создает сводный отчет со всеми результатами
   * @param unifiedResult - Результат унифицированной генерации
   */
  async generateSummaryReport(unifiedResult: UnifiedReportResult): Promise<ReportResult> {
    const content = this.buildSummaryContent(unifiedResult);

    return {
      content,
      format: ReportFormat.MARKDOWN,
      timestamp: new Date(),
      metadata: {
        reportType: 'unified-summary',
        totalReports: unifiedResult.summary.totalReports,
        ...unifiedResult.metadata,
      },
    };
  }

  /**
   * Строит содержимое сводного отчета
   */
  private buildSummaryContent(unifiedResult: UnifiedReportResult): string {
    const { summary, metadata } = unifiedResult;

    return `# EAP Analysis - Report Summary

**Project:** ${metadata.projectName}
**Generated:** ${summary.generatedAt.toLocaleString()}
**System Version:** ${metadata.reportingSystemVersion}

## 📊 Generation Summary

- **Total Reports:** ${summary.totalReports}
- **Formats Generated:** ${summary.formats.join(', ')}
- **Output Files:** ${summary.outputPaths.length}
- **Errors:** ${summary.errors.length}

## 📁 Generated Reports

${this.buildReportsList(unifiedResult)}

## 📈 Report Highlights

${this.buildReportHighlights(unifiedResult)}

${summary.errors.length > 0 ? this.buildErrorsSection(summary.errors) : ''}

---

*All reports are available in the specified output directory and provide comprehensive analysis of your project.*`;
  }

  /**
   * Строит список сгенерированных отчетов
   */
  private buildReportsList(unifiedResult: UnifiedReportResult): string {
    const reportsList = [];

    for (const [name, report] of unifiedResult.reports) {
      const formatIcon = this.getFormatIcon(report.format);
      const timestamp = report.timestamp.toLocaleString();

      reportsList.push(
        `- ${formatIcon} **${name}** (${report.format}) - Generated at ${timestamp}`
      );
    }

    return reportsList.join('\n');
  }

  /**
   * Строит основные моменты отчетов
   */
  private buildReportHighlights(unifiedResult: UnifiedReportResult): string {
    const highlights = [];

    // Ищем основные метрики из отчетов
    for (const [name, report] of unifiedResult.reports) {
      if (name.includes('executive-summary')) {
        highlights.push(
          '📋 **Executive Summary** - High-level business overview and strategic recommendations'
        );
      } else if (name.includes('technical-debt')) {
        highlights.push(
          '🔧 **Technical Debt Analysis** - Detailed breakdown of technical debt and refactoring plan'
        );
      } else if (name.includes('roadmap')) {
        highlights.push(
          '🗺️ **Development Roadmap** - Strategic planning and implementation timeline'
        );
      } else if (name.includes('standard')) {
        const format = report.format;
        highlights.push(
          `📄 **${format.toUpperCase()} Report** - Comprehensive analysis in ${format} format`
        );
      }
    }

    return highlights.length > 0 ? highlights.join('\n') : 'No specific highlights available.';
  }

  /**
   * Строит секцию ошибок
   */
  private buildErrorsSection(errors: string[]): string {
    return `
## ⚠️ Generation Errors

The following errors occurred during report generation:

${errors.map(error => `- ${error}`).join('\n')}

*Please review these errors and ensure all required dependencies are available.*`;
  }

  /**
   * Возвращает иконку для формата
   */
  private getFormatIcon(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.MARKDOWN:
        return '📝';
      case ReportFormat.JSON:
        return '📊';
      case ReportFormat.HTML:
        return '🌐';
      case ReportFormat.PLAIN_TEXT:
        return '📄';
      default:
        return '📋';
    }
  }

  /**
   * Возвращает список доступных репортеров
   */
  getAvailableReporters(): string[] {
    const reporters = [];

    // Стандартные репортеры
    for (const format of this.reporters.keys()) {
      reporters.push(`standard-${format}`);
    }

    // Специализированные репортеры
    for (const name of this.specializedReporters.keys()) {
      reporters.push(name);
    }

    return reporters;
  }

  /**
   * Проверяет готовность системы отчетности
   */
  validateSystem(): { isReady: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.reporters.size === 0) {
      issues.push('No standard reporters initialized');
    }

    if (!this.config.outputDir) {
      issues.push('Output directory not configured');
    }

    if (!this.config.formats || this.config.formats.length === 0) {
      issues.push('No output formats specified');
    }

    return {
      isReady: issues.length === 0,
      issues,
    };
  }

  /**
   * Обновляет конфигурацию системы
   */
  updateConfig(newConfig: Partial<UnifiedReportingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Переинициализируем репортеры если изменились критические настройки
    if (
      newConfig.formats ||
      newConfig.includeExecutiveSummary !== undefined ||
      newConfig.includeTechnicalDebt !== undefined ||
      newConfig.includeRoadmap !== undefined
    ) {
      this.reporters.clear();
      this.specializedReporters.clear();
      this.initializeReporters();
    }
  }
}
