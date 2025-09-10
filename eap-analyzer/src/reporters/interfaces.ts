/**
 * Reporter Interfaces
 * Базовые интерфейсы для системы отчетов EAP v4.0
 */

import { Project } from '../types/Project';
import { TemplateEngine, TemplateVariables } from './TemplateEngine';

/**
 * Базовая конфигурация для всех репортеров
 */
export interface ReporterConfig {
  outputDir?: string;
  fileName?: string;
  includeTimestamp?: boolean;
  verbose?: boolean;
  format?: string;
  template?: string;
  templateId?: string; // ID шаблона для новой системы шаблонов EAP v4.0 Stage 4
  templateEngine?: TemplateEngine;
  custom?: Record<string, any>;
}

/**
 * Результат генерации отчета
 */
export interface ReportResult {
  content: string;
  format: ReportFormat;
  filePath?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Поддерживаемые форматы отчетов
 */
export enum ReportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  HTML = 'html',
  PLAIN_TEXT = 'text',
}

/**
 * Структурированные данные для отчета
 */
export interface ReportData {
  projectName: string;
  analysisDate: Date;
  version: string;
  summary: ReportSummary;
  sections: ReportSection[];
  metadata: Record<string, any>;
}

/**
 * Сводная информация отчета
 */
export interface ReportSummary {
  score: number; // 0-100 общий балл
  grade: string; // A, B, C, D, F
  passedChecks: number;
  failedChecks: number;
  recommendations: number;
  analysisTime?: number;
}

/**
 * Секция отчета
 */
export interface ReportSection {
  title: string;
  description?: string;
  score?: number;
  items: ReportItem[];
  subsections?: ReportSection[];
}

/**
 * Элемент отчета
 */
export interface ReportItem {
  type: 'issue' | 'success' | 'info' | 'warning';
  title: string;
  description: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  effort?: number; // в часах
  impact?: number; // 1-10
  code?: string;
  filePath?: string;
  lineNumber?: number;
  recommendations?: string[];
  metadata?: Record<string, any>;
}

/**
 * Базовый интерфейс для всех репортеров
 */
export interface IReporter {
  /**
   * Генерирует отчет на основе данных анализа
   * @param project - Анализируемый проект
   * @param data - Данные для отчета
   * @param config - Конфигурация отчета
   */
  generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult>;

  /**
   * Сохраняет отчет в файл
   * @param reportResult - Результат генерации отчета
   * @param outputPath - Путь для сохранения (опционально)
   */
  saveReport(reportResult: ReportResult, outputPath?: string): Promise<string>;

  /**
   * Возвращает поддерживаемый формат отчета
   */
  getFormat(): ReportFormat;

  /**
   * Возвращает название репортера
   */
  getName(): string;
}

/**
 * Интерфейс для специализированных отчетов
 */
export interface ISpecializedReporter<T = any> extends IReporter {
  /**
   * Настраивает содержимое специализированного отчета
   * @param options - Дополнительные опции для настройки
   */
  configure(options: T): void;
}

/**
 * Интерфейс для интеграции с внешними системами
 */
export interface IExternalSystemReporter extends IReporter {
  /**
   * Аутентифицирует репортер во внешней системе
   * @param credentials - Учетные данные для аутентификации
   */
  authenticate(credentials: Record<string, string>): Promise<boolean>;

  /**
   * Публикует отчет во внешней системе
   * @param reportResult - Результат генерации отчета
   */
  publish(reportResult: ReportResult): Promise<string>;
}

/**
 * Интерфейс для форматирования секций отчета
 */
export interface IReportFormatter {
  /**
   * Форматирует заголовок отчета
   * @param project - Информация о проекте
   * @param data - Данные отчета
   */
  formatHeader(project: Project, data: ReportData): string;

  /**
   * Форматирует сводную информацию
   * @param data - Данные отчета
   */
  formatSummary(data: ReportData): string;

  /**
   * Форматирует детали анализа
   * @param data - Данные отчета
   */
  formatDetails(data: ReportData): string;

  /**
   * Форматирует рекомендации
   * @param data - Данные отчета
   */
  formatRecommendations(data: ReportData): string;

  /**
   * Форматирует контент с использованием шаблона
   * @param data - Данные отчета
   * @param template - Пользовательский шаблон (опционально)
   */
  formatContent(data: ReportData, template?: string): string | Promise<string>;

  /**
   * Получить шаблон по умолчанию
   */
  getDefaultTemplate(): string;

  /**
   * Проверить, поддерживается ли шаблонизация
   */
  supportsTemplating(): boolean;
}
