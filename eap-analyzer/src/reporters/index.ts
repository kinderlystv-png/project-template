/**
 * Reporter Index
 * Экспорт всех репортеров и интерфейсов
 */

// Базовые интерфейсы и типы
export * from './interfaces';
export { BaseReporter } from './BaseReporter';

// Движок шаблонов
export { TemplateEngine } from './TemplateEngine';
export type { TemplateVariables, TemplateEngineConfig } from './TemplateEngine';

// Новая система шаблонов EAP v4.0 Stage 4
export { TemplateManager } from './templates/TemplateManager';
export { TemplateRegistry } from './templates/TemplateRegistry';
export { TemplateLoader } from './templates/TemplateLoader';
export * from './templates/types';

// Адаптер для интеграции с анализаторами
export { AnalysisReportAdapter } from './AnalysisReportAdapter';

// Стандартные репортеры
export { MarkdownReporter } from './MarkdownReporter';
export { JSONReporter } from './JSONReporter';
export { HTMLReporter } from './HTMLReporter';

// Фабрика репортеров
export { ReporterFactory } from './ReporterFactory';

// Специализированные репортеры
export { ExecutiveSummaryReporter } from './specialized/ExecutiveSummaryReporter';
export { TechnicalDebtReporter } from './specialized/TechnicalDebtReporter';
export { RoadmapReporter } from './specialized/RoadmapReporter';

// Унифицированная система отчетности
export { UnifiedReportingSystem } from './UnifiedReportingSystem';

// Типы для специализированных репортеров
export type { ExecutiveSummaryConfig } from './specialized/ExecutiveSummaryReporter';
export type { TechnicalDebtConfig } from './specialized/TechnicalDebtReporter';
export type { RoadmapConfig } from './specialized/RoadmapReporter';
export type { UnifiedReportingConfig, UnifiedReportResult } from './UnifiedReportingSystem';
