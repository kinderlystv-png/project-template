/**
 * Report Factory
 * Фабрика для создания репортеров различных типов
 */

import { BaseReporter } from './BaseReporter';
import { MarkdownReporter } from './MarkdownReporter';
import { JSONReporter } from './JSONReporter';
import { HTMLReporter } from './HTMLReporter';
import { IReporter, ReportFormat, ReporterConfig } from './interfaces';

/**
 * Фабрика репортеров
 */
export class ReporterFactory {
  private static registeredReporters = new Map<
    ReportFormat,
    new (config?: ReporterConfig) => IReporter
  >();

  static {
    // Регистрируем стандартные репортеры
    this.registerReporter(ReportFormat.MARKDOWN, MarkdownReporter);
    this.registerReporter(ReportFormat.JSON, JSONReporter);
    this.registerReporter(ReportFormat.HTML, HTMLReporter);
  }

  /**
   * Создает репортер для указанного формата
   * @param format - Формат отчета
   * @param config - Конфигурация репортера
   */
  static createReporter(format: ReportFormat, config?: ReporterConfig): IReporter {
    const ReporterClass = this.registeredReporters.get(format);

    if (!ReporterClass) {
      throw new Error(`No reporter registered for format: ${format}`);
    }

    return new ReporterClass(config);
  }

  /**
   * Создает несколько репортеров для указанных форматов
   * @param formats - Список форматов
   * @param config - Общая конфигурация для всех репортеров
   */
  static createReporters(formats: ReportFormat[], config?: ReporterConfig): IReporter[] {
    return formats.map(format => this.createReporter(format, config));
  }

  /**
   * Регистрирует новый репортер
   * @param format - Формат отчета
   * @param reporterClass - Класс репортера
   */
  static registerReporter(
    format: ReportFormat,
    reporterClass: new (config?: ReporterConfig) => IReporter
  ): void {
    this.registeredReporters.set(format, reporterClass);
  }

  /**
   * Возвращает список поддерживаемых форматов
   */
  static getSupportedFormats(): ReportFormat[] {
    return Array.from(this.registeredReporters.keys());
  }

  /**
   * Проверяет, поддерживается ли формат
   * @param format - Формат для проверки
   */
  static isFormatSupported(format: ReportFormat): boolean {
    return this.registeredReporters.has(format);
  }

  /**
   * Создает репортер по строковому названию формата
   * @param formatString - Строковое название формата
   * @param config - Конфигурация репортера
   */
  static createReporterByString(formatString: string, config?: ReporterConfig): IReporter {
    const format = this.parseFormatString(formatString);
    return this.createReporter(format, config);
  }

  /**
   * Парсит строковое название формата в enum
   * @param formatString - Строковое название формата
   */
  private static parseFormatString(formatString: string): ReportFormat {
    const normalized = formatString.toLowerCase().trim();

    switch (normalized) {
      case 'md':
      case 'markdown':
        return ReportFormat.MARKDOWN;
      case 'json':
        return ReportFormat.JSON;
      case 'html':
      case 'htm':
        return ReportFormat.HTML;
      case 'txt':
      case 'text':
      case 'plain':
        return ReportFormat.PLAIN_TEXT;
      default:
        throw new Error(`Unsupported format string: ${formatString}`);
    }
  }

  /**
   * Создает репортер с настройками по умолчанию для конкретного случая использования
   * @param useCase - Случай использования ('ci', 'development', 'production', 'debug')
   * @param format - Формат отчета
   */
  static createReporterForUseCase(useCase: string, format: ReportFormat): IReporter {
    const config = this.getConfigForUseCase(useCase);
    return this.createReporter(format, config);
  }

  /**
   * Возвращает конфигурацию для конкретного случая использования
   * @param useCase - Случай использования
   */
  private static getConfigForUseCase(useCase: string): ReporterConfig {
    switch (useCase.toLowerCase()) {
      case 'ci':
      case 'continuous-integration':
        return {
          outputDir: 'reports/ci',
          includeTimestamp: true,
          verbose: false,
          custom: {
            compact: true,
            includeRawData: false,
            theme: 'light',
          },
        };

      case 'development':
      case 'dev':
        return {
          outputDir: 'reports/dev',
          includeTimestamp: true,
          verbose: true,
          custom: {
            compact: false,
            includeRawData: true,
            includeCharts: true,
            theme: 'dark',
          },
        };

      case 'production':
      case 'prod':
        return {
          outputDir: 'reports/prod',
          includeTimestamp: true,
          verbose: false,
          custom: {
            compact: false,
            includeRawData: false,
            includeCharts: true,
            theme: 'light',
          },
        };

      case 'debug':
        return {
          outputDir: 'reports/debug',
          includeTimestamp: true,
          verbose: true,
          custom: {
            compact: false,
            includeRawData: true,
            includeCharts: false,
            indent: 4,
          },
        };

      default:
        return {
          outputDir: 'reports',
          includeTimestamp: true,
          verbose: false,
        };
    }
  }

  /**
   * Создает все стандартные репортеры с одинаковой конфигурацией
   * @param config - Конфигурация для всех репортеров
   */
  static createAllReporters(config?: ReporterConfig): Map<ReportFormat, IReporter> {
    const reporters = new Map<ReportFormat, IReporter>();

    for (const format of this.getSupportedFormats()) {
      try {
        reporters.set(format, this.createReporter(format, config));
      } catch (error) {
        console.warn(`Failed to create reporter for format ${format}:`, error);
      }
    }

    return reporters;
  }
}
