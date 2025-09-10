/**
 * Markdown Reporter
 * Генерирует отчеты в формате Markdown
 */

import { Project } from '../types/Project';
import { BaseReporter } from './BaseReporter';
import {
  ReportData,
  ReportResult,
  ReporterConfig,
  ReportFormat,
  ReportSection,
  ReportItem,
  IReportFormatter,
} from './interfaces';
import { TemplateEngine } from './TemplateEngine';
import { TemplateFormat } from './templates/types';

/**
 * Репортер для генерации отчетов в формате Markdown
 */
export class MarkdownReporter extends BaseReporter implements IReportFormatter {
  constructor(config: ReporterConfig = {}) {
    super(config);
  }

  getFormat(): ReportFormat {
    return ReportFormat.MARKDOWN;
  }

  getName(): string {
    return 'Markdown Reporter';
  }

  async generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult> {
    this.log('Generating Markdown report...');

    // Валидируем данные
    this.validateReportData(data);

    // Объединяем конфигурацию
    const finalConfig = { ...this.config, ...config };

    // Генерируем содержимое отчета
    const content = await this.buildMarkdownContent(project, data);

    const result: ReportResult = {
      content,
      format: this.getFormat(),
      timestamp: new Date(),
      metadata: {
        projectName: data.projectName,
        reporterName: this.getName(),
        sectionsCount: data.sections.length,
        ...data.metadata,
      },
    };

    this.log('Markdown report generated successfully');
    return result;
  }

  /**
   * Строит полное содержимое Markdown отчета
   */
  private async buildMarkdownContent(project: Project, data: ReportData): Promise<string> {
    // Сначала пробуем использовать новую систему шаблонов EAP v4.0 Stage 4
    if (this.config.templateId) {
      const variables = this.createTemplateVariables(project, data);
      const compiled = await this.compileTemplate(
        this.config.templateId,
        TemplateFormat.MARKDOWN,
        variables
      );
      if (compiled) {
        return compiled;
      }
    }

    // Если указан пользовательский шаблон, используем его с TemplateEngine
    if (this.config.template) {
      const variables = this.createTemplateVariables(project, data);
      return this.applyTemplate(this.config.template, variables);
    }

    // Иначе используем стандартную структуру
    const sections = [
      this.formatHeader(project, data),
      this.formatSummary(data),
      this.formatTableOfContents(data),
      this.formatDetails(data),
      this.formatRecommendations(data),
      this.formatFooter(data),
    ];

    return sections.filter(section => section.trim().length > 0).join('\n\n');
  }

  /**
   * Форматирует заголовок отчета
   */
  formatHeader(project: Project, data: ReportData): string {
    const timestamp = data.analysisDate.toISOString().slice(0, 19).replace('T', ' ');

    return `# EAP Analysis Report

**Project:** ${data.projectName}
**Version:** ${data.version || 'Unknown'}
**Analysis Date:** ${timestamp}
**Analysis Time:** ${data.summary.analysisTime ? `${data.summary.analysisTime}ms` : 'N/A'}

---`;
  }

  /**
   * Форматирует сводную информацию
   */
  formatSummary(data: ReportData): string {
    const summary = this.createSummary(data);
    const scoreBar = this.createScoreBar(summary.score);

    return `## 📊 Executive Summary

### Overall Score: ${summary.score}/100 (Grade: ${summary.grade})

${scoreBar}

| Metric | Value |
|--------|-------|
| ✅ Passed Checks | ${summary.passedChecks} |
| ❌ Failed Checks | ${summary.failedChecks} |
| 💡 Recommendations | ${summary.recommendations} |
| 🎯 Success Rate | ${this.calculateSuccessRate(summary)}% |

### Quality Assessment

${this.getQualityAssessment(summary.score)}`;
  }

  /**
   * Форматирует оглавление
   */
  formatTableOfContents(data: ReportData): string {
    if (data.sections.length === 0) return '';

    const toc = data.sections
      .map((section, index) => {
        const anchor = this.createAnchor(section.title);
        const issueCount = section.items.filter(item => item.type === 'issue').length;
        const statusIcon = issueCount === 0 ? '✅' : '⚠️';

        return `${index + 1}. [${statusIcon} ${section.title}](#${anchor})${issueCount > 0 ? ` (${issueCount} issues)` : ''}`;
      })
      .join('\n');

    return `## 📋 Table of Contents

${toc}`;
  }

  /**
   * Форматирует детали анализа
   */
  formatDetails(data: ReportData): string {
    if (data.sections.length === 0) return '';

    const sectionsContent = data.sections.map(section => this.formatSection(section)).join('\n\n');

    return `## 🔍 Detailed Analysis

${sectionsContent}`;
  }

  /**
   * Форматирует отдельную секцию
   */
  private formatSection(section: ReportSection): string {
    const anchor = this.createAnchor(section.title);
    const scoreText = section.score !== undefined ? ` (Score: ${section.score}/100)` : '';

    let content = `### ${section.title}${scoreText} {#${anchor}}`;

    if (section.description) {
      content += `\n\n${section.description}`;
    }

    if (section.items.length > 0) {
      content += '\n\n' + this.formatItems(section.items);
    }

    if (section.subsections && section.subsections.length > 0) {
      const subsectionsContent = section.subsections
        .map(subsection => this.formatSubsection(subsection))
        .join('\n\n');
      content += '\n\n' + subsectionsContent;
    }

    return content;
  }

  /**
   * Форматирует подсекцию
   */
  private formatSubsection(subsection: ReportSection): string {
    let content = `#### ${subsection.title}`;

    if (subsection.description) {
      content += `\n\n${subsection.description}`;
    }

    if (subsection.items.length > 0) {
      content += '\n\n' + this.formatItems(subsection.items);
    }

    return content;
  }

  /**
   * Форматирует список элементов
   */
  private formatItems(items: ReportItem[]): string {
    if (items.length === 0) return '';

    return items.map(item => this.formatItem(item)).join('\n\n');
  }

  /**
   * Форматирует отдельный элемент
   */
  private formatItem(item: ReportItem): string {
    const icon = this.getItemIcon(item.type);
    const severityBadge = item.severity ? this.getSeverityBadge(item.severity) : '';

    let content = `${icon} **${item.title}** ${severityBadge}`;

    if (item.description) {
      content += `\n   ${item.description}`;
    }

    // Добавляем информацию о файле
    if (item.filePath) {
      const fileInfo = item.lineNumber
        ? `\`${item.filePath}:${item.lineNumber}\``
        : `\`${item.filePath}\``;
      content += `\n   📁 **File:** ${fileInfo}`;
    }

    // Добавляем код если есть
    if (item.code) {
      content += `\n   \`\`\`\n   ${item.code}\n   \`\`\``;
    }

    // Добавляем метрики
    if (item.effort || item.impact) {
      const metrics = [];
      if (item.effort) metrics.push(`⏱️ Effort: ${item.effort}h`);
      if (item.impact) metrics.push(`📈 Impact: ${item.impact}/10`);
      content += `\n   ${metrics.join(' | ')}`;
    }

    // Добавляем рекомендации
    if (item.recommendations && item.recommendations.length > 0) {
      const recs = item.recommendations.map(rec => `     - ${rec}`).join('\n');
      content += `\n   💡 **Recommendations:**\n${recs}`;
    }

    return content;
  }

  /**
   * Форматирует рекомендации
   */
  formatRecommendations(data: ReportData): string {
    const groups = this.groupItemsByType(data.sections);

    let content = '## 💡 Priority Recommendations';

    // Критические проблемы
    if (groups.critical.length > 0) {
      content += '\n\n### 🚨 Critical Issues (Fix Immediately)';
      content +=
        '\n\n' + groups.critical.map(item => `- **${item.title}** (${item.section})`).join('\n');
    }

    // Высокоприоритетные проблемы
    if (groups.high.length > 0) {
      content += '\n\n### ⚠️ High Priority Issues';
      content +=
        '\n\n' + groups.high.map(item => `- **${item.title}** (${item.section})`).join('\n');
    }

    // Общие рекомендации
    const allRecommendations = this.collectAllRecommendations(data.sections);
    if (allRecommendations.length > 0) {
      content += '\n\n### 📝 General Recommendations';
      content += '\n\n' + allRecommendations.map(rec => `- ${rec}`).join('\n');
    }

    return content.trim() === '## 💡 Priority Recommendations' ? '' : content;
  }

  /**
   * Форматирует футер отчета
   */
  private formatFooter(data: ReportData): string {
    return `---

*Report generated by EAP Analyzer v4.0*
*Generated on: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}*`;
  }

  // Вспомогательные методы

  private createScoreBar(score: number): string {
    const filled = Math.floor(score / 10);
    const empty = 10 - filled;
    return `\`${'█'.repeat(filled)}${'░'.repeat(empty)}\` ${score}%`;
  }

  private calculateSuccessRate(summary: any): number {
    const total = summary.passedChecks + summary.failedChecks;
    return total > 0 ? Math.round((summary.passedChecks / total) * 100) : 0;
  }

  private getQualityAssessment(score: number): string {
    if (score >= 90)
      return '🌟 **Excellent** - Your project demonstrates outstanding quality standards.';
    if (score >= 80)
      return '👍 **Good** - Your project meets most quality standards with minor improvements needed.';
    if (score >= 70)
      return '⚡ **Fair** - Your project has solid foundations but requires some attention.';
    if (score >= 60)
      return '⚠️ **Needs Improvement** - Several areas require attention to meet quality standards.';
    return '🚨 **Poor** - Significant improvements are needed across multiple areas.';
  }

  private createAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-а-я]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  private getItemIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'issue':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  }

  private getSeverityBadge(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🔶';
      case 'low':
        return '🔷';
      default:
        return '';
    }
  }

  private collectAllRecommendations(sections: ReportSection[]): string[] {
    const recommendations: string[] = [];

    for (const section of sections) {
      for (const item of section.items) {
        if (item.recommendations) {
          recommendations.push(...item.recommendations);
        }
      }
    }

    // Удаляем дубликаты
    return [...new Set(recommendations)];
  }

  /**
   * Форматирует список элементов в Markdown
   */
  formatList(items: string[], ordered: boolean = false): string {
    if (items.length === 0) return '';

    const marker = ordered ? '1.' : '-';
    return items.map(item => `${marker} ${item}`).join('\n');
  }

  /**
   * Форматирует таблицу в Markdown
   */
  formatTable(headers: string[], rows: string[][]): string {
    if (headers.length === 0 || rows.length === 0) return '';

    const headerRow = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`);

    return [headerRow, separator, ...dataRows].join('\n');
  }

  /**
   * Форматирует блок кода в Markdown
   */
  formatCode(code: string, language: string = ''): string {
    if (!code) return '';

    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * Форматирует ссылку в Markdown
   */
  formatLink(text: string, url: string, title?: string): string {
    const titleAttr = title ? ` "${title}"` : '';
    return `[${text}](${url}${titleAttr})`;
  }

  /**
   * Форматирует изображение в Markdown
   */
  formatImage(alt: string, src: string, title?: string): string {
    const titleAttr = title ? ` "${title}"` : '';
    return `![${alt}](${src}${titleAttr})`;
  }

  /**
   * Форматирует цитату в Markdown
   */
  formatQuote(text: string, author?: string): string {
    const lines = text.split('\n').map(line => `> ${line}`);
    if (author) {
      lines.push(`> \n> — *${author}*`);
    }
    return lines.join('\n');
  }

  /**
   * Форматирует заголовок с определенным уровнем
   */
  formatHeading(text: string, level: number = 1): string {
    const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
    return `${hashes} ${text}`;
  }

  /**
   * Форматирует горизонтальную линию
   */
  formatHorizontalRule(): string {
    return '---';
  }

  /**
   * Форматирует бейдж/метку
   */
  formatBadge(text: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): string {
    const emoji = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    };

    return `${emoji[type]} **${text}**`;
  }

  /**
   * Форматирует метрики в виде таблицы
   */
  formatMetrics(metrics: Record<string, number | string>): string {
    const headers = ['Метрика', 'Значение'];
    const rows = Object.entries(metrics).map(([key, value]) => [key, String(value)]);

    return this.formatTable(headers, rows);
  }

  /**
   * Форматирует деталь файла (путь, строка)
   */
  formatFileReference(filePath: string, lineNumber?: number): string {
    const line = lineNumber ? `:${lineNumber}` : '';
    return `\`${filePath}${line}\``;
  }

  /**
   * Форматирует уровень серьезности
   */
  formatSeverity(severity: 'critical' | 'high' | 'medium' | 'low'): string {
    const severityConfig = {
      critical: { emoji: '🚨', text: 'Критическая' },
      high: { emoji: '⚠️', text: 'Высокая' },
      medium: { emoji: '🔶', text: 'Средняя' },
      low: { emoji: '🔹', text: 'Низкая' },
    };

    const config = severityConfig[severity];
    return `${config.emoji} ${config.text}`;
  }

  /**
   * Форматирует время выполнения
   */
  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Форматирует процентное значение
   */
  formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    const percentage = Math.round((value / total) * 100);
    return `${percentage}%`;
  }

  /**
   * Экранирует специальные символы Markdown
   */
  escapeMarkdown(text: string): string {
    return text.replace(/([\\`*_{}[\]()#+\-.!|])/g, '\\$1');
  }

  /**
   * Создает оглавление на основе заголовков
   */
  generateTableOfContents(sections: ReportSection[]): string {
    if (sections.length === 0) return '';

    const tocItems = sections.map(section => {
      const anchor = this.createAnchor(section.title);
      const issueCount = section.items.filter(item => item.type === 'issue').length;
      const statusIcon = issueCount === 0 ? '✅' : '⚠️';

      return `- ${statusIcon} [${section.title}](#${anchor})`;
    });

    return `## 📋 Оглавление\n\n${tocItems.join('\n')}\n`;
  } /**
   * Форматирует контент с использованием шаблона
   */
  formatContent(data: ReportData, template?: string): string {
    const project = { path: '', name: data.projectName } as Project;
    const variables = this.createTemplateVariables(project, data);

    if (template) {
      return this.applyTemplate(template, variables);
    }

    return this.applyTemplate(this.getDefaultTemplate(), variables);
  }

  /**
   * Получить шаблон Markdown по умолчанию
   */
  getDefaultTemplate(): string {
    const templates = TemplateEngine.getStandardTemplates();
    return templates.markdown.header + templates.markdown.summary + templates.markdown.section;
  }

  /**
   * Проверить, поддерживается ли шаблонизация
   */
  supportsTemplating(): boolean {
    return true;
  }
}
