/**
 * HTML Reporter
 * Генерирует отчеты в формате HTML с интерактивными элементами
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
 * Репортер для генерации отчетов в формате HTML
 */
export class HTMLReporter extends BaseReporter implements IReportFormatter {
  constructor(config: ReporterConfig = {}) {
    super(config);
  }

  getFormat(): ReportFormat {
    return ReportFormat.HTML;
  }

  getName(): string {
    return 'HTML Reporter';
  }

  async generateReport(
    project: Project,
    data: ReportData,
    config?: ReporterConfig
  ): Promise<ReportResult> {
    this.log('Generating HTML report...');

    // Валидируем данные
    this.validateReportData(data);

    // Объединяем конфигурацию
    const finalConfig = { ...this.config, ...config };

    // Сначала пробуем использовать новую систему шаблонов EAP v4.0 Stage 4
    if (finalConfig.templateId) {
      const variables = this.createTemplateVariables(project, data);
      const compiled = await this.compileTemplate(
        finalConfig.templateId,
        TemplateFormat.HTML,
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
        this.log('HTML report generated using template system');
        return result;
      }
    }

    // Генерируем содержимое HTML отчета стандартным способом
    const content = await this.buildHTMLContent(project, data, finalConfig);

    const result: ReportResult = {
      content,
      format: this.getFormat(),
      timestamp: new Date(),
      metadata: {
        projectName: data.projectName,
        reporterName: this.getName(),
        sectionsCount: data.sections.length,
        interactive: true,
        ...data.metadata,
      },
    };

    this.log('HTML report generated successfully');
    return result;
  }

  /**
   * Строит полное содержимое HTML отчета
   */
  private async buildHTMLContent(
    project: Project,
    data: ReportData,
    config: ReporterConfig
  ): Promise<string> {
    const theme = config.custom?.theme || 'light';
    const includeCharts = config.custom?.includeCharts !== false;

    return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
    ${this.generateHead(data)}
</head>
<body>
    <div class="container">
        ${this.formatHeader(project, data)}
        ${this.formatSummary(data)}
        ${includeCharts ? this.generateCharts(data) : ''}
        ${this.formatTableOfContents(data)}
        ${this.formatDetails(data)}
        ${this.formatRecommendations(data)}
        ${this.generateFooter(data)}
    </div>
    ${this.generateScripts(data)}
</body>
</html>`;
  }

  /**
   * Генерирует секцию HEAD
   */
  private generateHead(data: ReportData): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EAP Analysis Report - ${data.projectName}</title>
    ${this.generateStyles()}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
`;
  }

  /**
   * Форматирует заголовок отчета
   */
  formatHeader(project: Project, data: ReportData): string {
    const timestamp = data.analysisDate.toLocaleString();
    const summary = this.createSummary(data);

    return `
    <header class="report-header">
        <div class="header-content">
            <h1>🔍 EAP Analysis Report</h1>
            <div class="project-info">
                <div class="info-card">
                    <h2>${data.projectName}</h2>
                    <p><strong>Version:</strong> ${data.version || 'Unknown'}</p>
                    <p><strong>Analysis Date:</strong> ${timestamp}</p>
                    <p><strong>Analysis Time:</strong> ${data.summary.analysisTime ? `${data.summary.analysisTime}ms` : 'N/A'}</p>
                </div>
                <div class="score-card">
                    <div class="score-circle" data-score="${summary.score}">
                        <span class="score-value">${summary.score}</span>
                        <span class="score-label">Score</span>
                    </div>
                    <div class="grade-badge grade-${summary.grade.toLowerCase()}">${summary.grade}</div>
                </div>
            </div>
        </div>
    </header>`;
  }

  /**
   * Форматирует сводную информацию
   */
  formatSummary(data: ReportData): string {
    const summary = this.createSummary(data);
    const successRate = this.calculateSuccessRate(summary);

    return `
    <section class="summary-section">
        <h2>📊 Executive Summary</h2>
        <div class="metrics-grid">
            <div class="metric-card success">
                <div class="metric-icon">✅</div>
                <div class="metric-content">
                    <span class="metric-value">${summary.passedChecks}</span>
                    <span class="metric-label">Passed Checks</span>
                </div>
            </div>
            <div class="metric-card failure">
                <div class="metric-icon">❌</div>
                <div class="metric-content">
                    <span class="metric-value">${summary.failedChecks}</span>
                    <span class="metric-label">Failed Checks</span>
                </div>
            </div>
            <div class="metric-card info">
                <div class="metric-icon">💡</div>
                <div class="metric-content">
                    <span class="metric-value">${summary.recommendations}</span>
                    <span class="metric-label">Recommendations</span>
                </div>
            </div>
            <div class="metric-card rate">
                <div class="metric-icon">🎯</div>
                <div class="metric-content">
                    <span class="metric-value">${successRate}%</span>
                    <span class="metric-label">Success Rate</span>
                </div>
            </div>
        </div>
        <div class="quality-assessment">
            <h3>Quality Assessment</h3>
            <p class="assessment-text">${this.getQualityAssessment(summary.score)}</p>
        </div>
    </section>`;
  }

  /**
   * Форматирует оглавление
   */
  formatTableOfContents(data: ReportData): string {
    if (data.sections.length === 0) return '';

    const tocItems = data.sections
      .map((section, index) => {
        const anchor = this.createAnchor(section.title);
        const issueCount = section.items.filter(item => item.type === 'issue').length;
        const statusClass = issueCount === 0 ? 'success' : issueCount > 5 ? 'critical' : 'warning';
        const statusIcon = issueCount === 0 ? '✅' : '⚠️';

        return `
        <li class="toc-item ${statusClass}">
            <a href="#${anchor}" class="toc-link">
                <span class="toc-icon">${statusIcon}</span>
                <span class="toc-title">${section.title}</span>
                ${issueCount > 0 ? `<span class="toc-badge">${issueCount}</span>` : ''}
            </a>
        </li>`;
      })
      .join('');

    return `
    <section class="toc-section">
        <h2>📋 Table of Contents</h2>
        <ul class="toc-list">
            ${tocItems}
        </ul>
    </section>`;
  }

  /**
   * Форматирует детали анализа
   */
  formatDetails(data: ReportData): string {
    if (data.sections.length === 0) return '';

    const sectionsHtml = data.sections.map(section => this.formatSection(section)).join('');

    return `
    <section class="details-section">
        <h2>🔍 Detailed Analysis</h2>
        <div class="sections-container">
            ${sectionsHtml}
        </div>
    </section>`;
  }

  /**
   * Форматирует отдельную секцию
   */
  private formatSection(section: ReportSection): string {
    const anchor = this.createAnchor(section.title);
    const issueCount = section.items.filter(item => item.type === 'issue').length;
    const statusClass = issueCount === 0 ? 'success' : issueCount > 5 ? 'critical' : 'warning';

    return `
    <div class="analysis-section ${statusClass}" id="${anchor}">
        <div class="section-header">
            <h3>${section.title}</h3>
            ${section.score !== undefined ? `<span class="section-score">${section.score}/100</span>` : ''}
        </div>
        ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        ${this.formatItems(section.items)}
        ${section.subsections ? section.subsections.map(sub => this.formatSubsection(sub)).join('') : ''}
    </div>`;
  }

  /**
   * Форматирует подсекцию
   */
  private formatSubsection(subsection: ReportSection): string {
    return `
    <div class="subsection">
        <h4>${subsection.title}</h4>
        ${subsection.description ? `<p class="subsection-description">${subsection.description}</p>` : ''}
        ${this.formatItems(subsection.items)}
    </div>`;
  }

  /**
   * Форматирует список элементов
   */
  private formatItems(items: ReportItem[]): string {
    if (items.length === 0) return '<p class="no-items">No items to display.</p>';

    const itemsHtml = items.map(item => this.formatItem(item)).join('');

    return `<div class="items-container">${itemsHtml}</div>`;
  }

  /**
   * Форматирует отдельный элемент
   */
  private formatItem(item: ReportItem): string {
    const typeClass = item.type;
    const severityClass = item.severity ? `severity-${item.severity}` : '';
    const icon = this.getItemIcon(item.type);

    return `
    <div class="report-item ${typeClass} ${severityClass}">
        <div class="item-header">
            <span class="item-icon">${icon}</span>
            <h5 class="item-title">${item.title}</h5>
            ${item.severity ? `<span class="severity-badge ${item.severity}">${item.severity}</span>` : ''}
        </div>
        <p class="item-description">${item.description}</p>
        ${this.formatItemDetails(item)}
        ${this.formatItemRecommendations(item)}
    </div>`;
  }

  /**
   * Форматирует детали элемента
   */
  private formatItemDetails(item: ReportItem): string {
    const details = [];

    if (item.filePath) {
      const fileInfo = item.lineNumber ? `${item.filePath}:${item.lineNumber}` : item.filePath;
      details.push(
        `<span class="detail-item"><strong>File:</strong> <code>${fileInfo}</code></span>`
      );
    }

    if (item.effort) {
      details.push(`<span class="detail-item"><strong>Effort:</strong> ${item.effort}h</span>`);
    }

    if (item.impact) {
      details.push(`<span class="detail-item"><strong>Impact:</strong> ${item.impact}/10</span>`);
    }

    if (item.code) {
      details.push(
        `<div class="code-snippet"><pre><code>${this.escapeHtml(item.code)}</code></pre></div>`
      );
    }

    return details.length > 0 ? `<div class="item-details">${details.join('')}</div>` : '';
  }

  /**
   * Форматирует рекомендации элемента
   */
  private formatItemRecommendations(item: ReportItem): string {
    if (!item.recommendations || item.recommendations.length === 0) return '';

    const recList = item.recommendations.map(rec => `<li>${rec}</li>`).join('');

    return `
    <div class="item-recommendations">
        <strong>💡 Recommendations:</strong>
        <ul>${recList}</ul>
    </div>`;
  }

  /**
   * Форматирует рекомендации
   */
  formatRecommendations(data: ReportData): string {
    const groups = this.groupItemsByType(data.sections);

    let content = `
    <section class="recommendations-section">
        <h2>💡 Priority Recommendations</h2>`;

    // Критические проблемы
    if (groups.critical.length > 0) {
      content += `
        <div class="recommendation-group critical">
            <h3>🚨 Critical Issues (Fix Immediately)</h3>
            <ul class="recommendation-list">
                ${groups.critical.map(item => `<li><strong>${item.title}</strong> (${item.section})</li>`).join('')}
            </ul>
        </div>`;
    }

    // Высокоприоритетные проблемы
    if (groups.high.length > 0) {
      content += `
        <div class="recommendation-group high">
            <h3>⚠️ High Priority Issues</h3>
            <ul class="recommendation-list">
                ${groups.high.map(item => `<li><strong>${item.title}</strong> (${item.section})</li>`).join('')}
            </ul>
        </div>`;
    }

    return content + '</section>';
  }

  /**
   * Генерирует диаграммы
   */
  private generateCharts(data: ReportData): string {
    return `
    <section class="charts-section">
        <h2>📈 Visual Analytics</h2>
        <div class="charts-grid">
            <div class="chart-container">
                <canvas id="scoreChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="severityChart"></canvas>
            </div>
        </div>
    </section>`;
  }

  /**
   * Генерирует футер
   */
  private generateFooter(data: ReportData): string {
    return `
    <footer class="report-footer">
        <div class="footer-content">
            <p>Report generated by <strong>EAP Analyzer v4.0</strong></p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <button class="theme-toggle" onclick="toggleTheme()">🌓 Toggle Theme</button>
        </div>
    </footer>`;
  }

  /**
   * Генерирует CSS стили
   */
  private generateStyles(): string {
    return `
    <style>
        :root {
            --primary-color: #2563eb;
            --success-color: #059669;
            --warning-color: #d97706;
            --error-color: #dc2626;
            --bg-color: #ffffff;
            --text-color: #111827;
            --border-color: #e5e7eb;
            --card-bg: #f9fafb;
        }

        [data-theme="dark"] {
            --bg-color: #111827;
            --text-color: #f9fafb;
            --border-color: #374151;
            --card-bg: #1f2937;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            transition: all 0.3s ease;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .report-header {
            background: linear-gradient(135deg, var(--primary-color), #3b82f6);
            color: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }

        .score-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .score-value {
            font-size: 24px;
            font-weight: bold;
        }

        .score-label {
            font-size: 12px;
            opacity: 0.8;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .metric-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .metric-icon {
            font-size: 24px;
        }

        .metric-value {
            font-size: 28px;
            font-weight: bold;
            display: block;
        }

        .metric-label {
            color: #6b7280;
            font-size: 14px;
        }

        .analysis-section {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin: 20px 0;
            padding: 25px;
        }

        .analysis-section.success {
            border-left: 4px solid var(--success-color);
        }

        .analysis-section.warning {
            border-left: 4px solid var(--warning-color);
        }

        .analysis-section.critical {
            border-left: 4px solid var(--error-color);
        }

        .report-item {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            margin: 10px 0;
            padding: 15px;
        }

        .report-item.issue {
            border-left: 4px solid var(--error-color);
        }

        .report-item.success {
            border-left: 4px solid var(--success-color);
        }

        .report-item.warning {
            border-left: 4px solid var(--warning-color);
        }

        .severity-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }

        .severity-badge.critical {
            background: #fef2f2;
            color: var(--error-color);
        }

        .code-snippet {
            background: #f3f4f6;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            overflow-x: auto;
        }

        .code-snippet code {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 13px;
        }

        .theme-toggle {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .theme-toggle:hover {
            opacity: 0.8;
        }

        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                text-align: center;
            }

            .metrics-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>`;
  }

  /**
   * Генерирует JavaScript скрипты
   */
  private generateScripts(data: ReportData): string {
    return `
    <script>
        function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }

        // Загружаем тему из localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Инициализация диаграмм
        document.addEventListener('DOMContentLoaded', function() {
            initCharts();
        });

        function initCharts() {
            const scoreChart = document.getElementById('scoreChart');
            if (scoreChart) {
                new Chart(scoreChart, {
                    type: 'doughnut',
                    data: {
                        labels: ['Passed', 'Failed'],
                        datasets: [{
                            data: [${this.createSummary(data).passedChecks}, ${this.createSummary(data).failedChecks}],
                            backgroundColor: ['#059669', '#dc2626']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Test Results'
                            }
                        }
                    }
                });
            }
        }
    </script>`;
  }

  // Вспомогательные методы

  private calculateSuccessRate(summary: any): number {
    const total = summary.passedChecks + summary.failedChecks;
    return total > 0 ? Math.round((summary.passedChecks / total) * 100) : 0;
  }

  private getQualityAssessment(score: number): string {
    if (score >= 90)
      return '🌟 Excellent - Your project demonstrates outstanding quality standards.';
    if (score >= 80)
      return '👍 Good - Your project meets most quality standards with minor improvements needed.';
    if (score >= 70)
      return '⚡ Fair - Your project has solid foundations but requires some attention.';
    if (score >= 60)
      return '⚠️ Needs Improvement - Several areas require attention to meet quality standards.';
    return '🚨 Poor - Significant improvements are needed across multiple areas.';
  }

  private createAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Дополнительные методы IReportFormatter
  async formatContent(data: ReportData, template?: string): Promise<string> {
    if (template) {
      const variables = this.createTemplateVariables(
        { path: '', name: data.projectName } as Project,
        data
      );
      return this.applyTemplate(template, variables);
    }

    return await this.buildHTMLContent(
      { path: '', name: data.projectName } as Project,
      data,
      this.config
    );
  }

  getDefaultTemplate(): string {
    const templates = TemplateEngine.getStandardTemplates();
    return templates.html.header + templates.html.summary + templates.html.footer;
  }

  supportsTemplating(): boolean {
    return true;
  }
}
