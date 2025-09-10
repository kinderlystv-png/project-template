/**
 * Template Loader - Загрузчик шаблонов из различных источников
 * Обеспечивает загрузку встроенных и пользовательских шаблонов
 */

import { TemplateRegistry } from './TemplateRegistry';
import {
  Template,
  TemplateSection,
  TemplateMetadata,
  TemplateFormat,
  TemplateCategory,
  TemplateComplexity,
} from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Результат загрузки шаблона
 */
interface LoadResult {
  success: boolean;
  templateId?: string;
  error?: string;
}

/**
 * Опции загрузки
 */
interface LoadOptions {
  overwrite?: boolean; // Перезаписывать существующие шаблоны
  validateContent?: boolean; // Валидировать содержимое
  autoDetectFormat?: boolean; // Автоматически определять формат
}

/**
 * Загрузчик шаблонов из файлов и встроенных источников
 */
export class TemplateLoader {
  private registry: TemplateRegistry;
  private loadedBuiltIns: boolean = false;

  constructor() {
    this.registry = TemplateRegistry.getInstance();
  }

  // ========== ЗАГРУЗКА ВСТРОЕННЫХ ШАБЛОНОВ ==========

  /**
   * Загружает все встроенные шаблоны
   */
  public async loadBuiltInTemplates(): Promise<void> {
    if (this.loadedBuiltIns) {
      console.log('Built-in templates already loaded');
      return;
    }

    try {
      // Загружаем встроенные шаблоны синхронно для гарантии порядка
      this.loadStandardMarkdownTemplates();
      this.loadStandardJsonTemplates();
      this.loadStandardHtmlTemplates();
      this.loadHtmlComponents();

      this.loadedBuiltIns = true;
      console.log('Built-in templates loaded successfully');
    } catch (error) {
      console.error('Error loading built-in templates:', error);
      throw error;
    }
  }

  /**
   * Загружает стандартные Markdown шаблоны
   */
  private loadStandardMarkdownTemplates(): void {
    // Полный отчет Markdown
    const fullReportTemplate: Template = {
      metadata: {
        id: 'markdown-full-report',
        name: 'Full Markdown Report',
        description: 'Complete analysis report with all details in Markdown format',
        format: TemplateFormat.MARKDOWN,
        category: TemplateCategory.STANDARD,
        complexity: TemplateComplexity.MEDIUM,
        version: '1.0.0',
        author: 'EAP System',
        tags: ['full', 'markdown', 'complete', 'analysis'],
        variables: [
          'projectName',
          'version',
          'analysisDate',
          'sections',
          'summary',
          'recommendations',
        ],
      },
      content: `# 📊 EAP Analysis Report: {{projectName}}

**Version:** {{version}}
**Analysis Date:** {{analysisDate}}
**Generated:** {{generatedDate}}

---

## 🎯 Executive Summary

{{#if summary}}
- **Overall Score:** {{summary.score}}/100 ({{summary.grade}})
- **Passed Checks:** ✅ {{summary.passedChecks}}
- **Failed Checks:** ❌ {{summary.failedChecks}}
- **Recommendations:** 💡 {{summary.recommendations}}
{{#if summary.analysisTime}}
- **Analysis Time:** ⏱️ {{summary.analysisTime}}ms
{{/if}}

### Quality Assessment
{{>quality-assessment}}
{{/if}}

---

## 📋 Table of Contents

{{#each sections}}
- [{{title}}](#{{anchor title}}) {{#if score}}({{score}}/100){{/if}}
{{/each}}

---

## 🔍 Detailed Analysis

{{#each sections}}
### {{title}} {#{{anchor title}}}

{{#if description}}
{{description}}

{{/if}}
{{#if score}}
**Section Score:** {{score}}/100

{{/if}}
{{#each items}}
#### {{getItemIcon type}} {{title}}

{{description}}

{{#if severity}}
**Severity:** {{formatSeverity severity}}
{{/if}}
{{#if effort}}
**Estimated Effort:** {{effort}} hours
{{/if}}
{{#if impact}}
**Impact Level:** {{impact}}/10
{{/if}}
{{#if filePath}}
**File:** \`{{filePath}}\`{{#if lineNumber}}:{{lineNumber}}{{/if}}
{{/if}}
{{#if code}}
\`\`\`
{{code}}
\`\`\`
{{/if}}
{{#if recommendations.length}}

**Recommendations:**
{{#each recommendations}}
- {{this}}
{{/each}}
{{/if}}

---

{{/each}}
{{/each}}

## 💡 Priority Recommendations

{{#if recommendations}}
### 🚨 Critical Issues
{{#each recommendations.critical}}
- **{{title}}** ({{section}})
{{/each}}

### ⚠️ High Priority Issues
{{#each recommendations.high}}
- **{{title}}** ({{section}})
{{/each}}

### 🔶 Medium Priority Issues
{{#each recommendations.medium}}
- **{{title}}** ({{section}})
{{/each}}
{{/if}}

---

## 📈 Summary Statistics

{{#if statistics}}
| Metric | Value |
|--------|-------|
| Files Analyzed | {{statistics.filesCounted}} |
| Lines of Code | {{statistics.linesAnalyzed}} |
| Issues Found | {{statistics.issuesFound}} |
| Technical Debt | {{statistics.techDebtHours}} hours |
| Estimated Fix Time | {{statistics.estimatedFixTime}} hours |
{{/if}}

---

*Generated by EAP Analyzer v4.0 on {{generatedDate}}*
*For more information, visit: [EAP Documentation](https://docs.eap-analyzer.com)*`,
    };

    // Краткий отчет Markdown
    const summaryReportTemplate: Template = {
      metadata: {
        id: 'markdown-summary-report',
        name: 'Summary Markdown Report',
        description: 'Brief summary report in Markdown format for quick overview',
        format: TemplateFormat.MARKDOWN,
        category: TemplateCategory.EXECUTIVE,
        complexity: TemplateComplexity.SIMPLE,
        version: '1.0.0',
        author: 'EAP System',
        tags: ['summary', 'brief', 'executive', 'markdown'],
        variables: ['projectName', 'version', 'summary', 'topIssues'],
      },
      content: `# 📊 {{projectName}} - Quick Summary

**Overall Score:** {{summary.score}}/100 ({{summary.grade}})

## Key Metrics
- ✅ Passed: {{summary.passedChecks}}
- ❌ Failed: {{summary.failedChecks}}
- 💡 Recommendations: {{summary.recommendations}}

## Top Issues
{{#each topIssues}}
{{@index}}. **{{title}}** - {{severity}}
{{/each}}

*Full analysis available in detailed report*`,
    };

    this.registry.registerTemplate(fullReportTemplate);
    this.registry.registerTemplate(summaryReportTemplate);
  }

  /**
   * Загружает стандартные JSON шаблоны
   */
  private loadStandardJsonTemplates(): void {
    // API JSON шаблон
    const apiJsonTemplate: Template = {
      metadata: {
        id: 'json-api-report',
        name: 'API JSON Report',
        description: 'Structured JSON report optimized for API consumption',
        format: TemplateFormat.JSON,
        category: TemplateCategory.TECHNICAL,
        complexity: TemplateComplexity.MEDIUM,
        version: '1.0.0',
        author: 'EAP System',
        tags: ['api', 'json', 'integration', 'structured'],
        variables: ['projectName', 'version', 'analysisDate', 'sections', 'summary'],
      },
      content: `{
  "meta": {
    "project": "{{projectName}}",
    "version": "{{version}}",
    "analysisDate": "{{analysisDate}}",
    "generatedAt": "{{generatedDate}}",
    "generator": "EAP Analyzer v4.0",
    "format": "json-api",
    "schema": "https://schemas.eap-analyzer.com/report/v1"
  },
  "summary": {
    "overallScore": {{summary.score}},
    "grade": "{{summary.grade}}",
    "metrics": {
      "passedChecks": {{summary.passedChecks}},
      "failedChecks": {{summary.failedChecks}},
      "totalChecks": {{add summary.passedChecks summary.failedChecks}},
      "successRate": {{multiply (divide summary.passedChecks (add summary.passedChecks summary.failedChecks)) 100}},
      "recommendations": {{summary.recommendations}}
    }{{#if summary.analysisTime}},
    "performance": {
      "analysisTime": {{summary.analysisTime}}
    }{{/if}}
  },
  "sections": [
    {{#each sections}}
    {
      "id": "{{@index}}",
      "title": "{{title}}",
      {{#if description}}"description": "{{description}}",{{/if}}
      {{#if score}}"score": {{score}},{{/if}}
      "itemCount": {{items.length}},
      "items": [
        {{#each items}}
        {
          "id": "{{@../index}}-{{@index}}",
          "type": "{{type}}",
          "title": "{{title}}",
          "description": "{{description}}"{{#if severity}},
          "severity": "{{severity}}"{{/if}}{{#if effort}},
          "effort": {{effort}}{{/if}}{{#if impact}},
          "impact": {{impact}}{{/if}}{{#if filePath}},
          "location": {
            "filePath": "{{filePath}}"{{#if lineNumber}},
            "lineNumber": {{lineNumber}}{{/if}}{{#if code}},
            "code": "{{escapeJson code}}"{{/if}}
          }{{/if}}{{#if recommendations.length}},
          "recommendations": [
            {{#each recommendations}}
            "{{escapeJson this}}"{{#unless @last}},{{/unless}}
            {{/each}}
          ]{{/if}}
        }{{#unless @last}},{{/unless}}
        {{/each}}
      ]
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ]{{#if statistics}},
  "statistics": {
    "filesCounted": {{statistics.filesCounted}},
    "linesAnalyzed": {{statistics.linesAnalyzed}},
    "issuesFound": {{statistics.issuesFound}},
    "techDebtHours": {{statistics.techDebtHours}},
    "estimatedFixTime": {{statistics.estimatedFixTime}},
    "categories": {
      {{#each statistics.categories}}
      "{{@key}}": {
        "total": {{total}},
        "passed": {{passed}},
        "failed": {{failed}},
        "percentage": {{percentage}}
      }{{#unless @last}},{{/unless}}
      {{/each}}
    }
  }{{/if}}
}`,
    };

    // Минимальный JSON
    const minimalJsonTemplate: Template = {
      metadata: {
        id: 'json-minimal-report',
        name: 'Minimal JSON Report',
        description: 'Minimal JSON report with essential data only',
        format: TemplateFormat.JSON,
        category: TemplateCategory.STANDARD,
        complexity: TemplateComplexity.SIMPLE,
        version: '1.0.0',
        author: 'EAP System',
        tags: ['minimal', 'json', 'lightweight'],
        variables: ['projectName', 'summary'],
      },
      content: `{
  "project": "{{projectName}}",
  "score": {{summary.score}},
  "grade": "{{summary.grade}}",
  "status": "{{#if (gt summary.score 70)}}pass{{else}}fail{{/if}}",
  "timestamp": "{{generatedDate}}"
}`,
    };

    this.registry.registerTemplate(apiJsonTemplate);
    this.registry.registerTemplate(minimalJsonTemplate);
  }

  /**
   * Загружает стандартные HTML шаблоны
   */
  private loadStandardHtmlTemplates(): void {
    // Интерактивный HTML отчет
    const interactiveHtmlTemplate: Template = {
      metadata: {
        id: 'html-interactive-report',
        name: 'Interactive HTML Report',
        description: 'Full-featured interactive HTML report with charts and filtering',
        format: TemplateFormat.HTML,
        category: TemplateCategory.STANDARD,
        complexity: TemplateComplexity.ADVANCED,
        version: '1.0.0',
        author: 'EAP System',
        tags: ['interactive', 'html', 'charts', 'full-featured'],
        variables: ['projectName', 'version', 'analysisDate', 'sections', 'summary'],
      },
      content: `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EAP Analysis: {{projectName}}</title>
    {{>html-styles}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    {{>html-header}}

    <main class="container">
        {{>html-summary}}
        {{>html-filters}}
        {{>html-charts}}
        {{>html-toc}}

        <div class="content-wrapper">
            {{#each sections}}
            <section id="section-{{@index}}" class="report-section" data-category="{{title}}">
                <h2>
                    <span class="section-icon">{{getSectionIcon title}}</span>
                    {{title}}
                    {{#if score}}
                    <span class="score-badge score-{{getScoreClass score}}">{{score}}/100</span>
                    {{/if}}
                </h2>

                {{#if description}}
                <p class="section-description">{{description}}</p>
                {{/if}}

                <div class="items-container">
                    {{#each items}}
                    <div class="report-item {{type}}" data-severity="{{severity}}" data-type="{{type}}">
                        <div class="item-header">
                            <span class="item-icon">{{getItemIcon type}}</span>
                            <h3>{{title}}</h3>
                            {{#if severity}}
                            <span class="severity-badge {{severity}}">{{severity}}</span>
                            {{/if}}
                        </div>

                        <div class="item-content">
                            <p>{{description}}</p>

                            {{#if filePath}}
                            <div class="file-reference">
                                <code>{{filePath}}{{#if lineNumber}}:{{lineNumber}}{{/if}}</code>
                            </div>
                            {{/if}}

                            {{#if code}}
                            <div class="code-snippet">
                                <pre><code>{{code}}</code></pre>
                            </div>
                            {{/if}}

                            {{#if recommendations.length}}
                            <div class="recommendations">
                                <h4>💡 Recommendations:</h4>
                                <ul>
                                    {{#each recommendations}}
                                    <li>{{this}}</li>
                                    {{/each}}
                                </ul>
                            </div>
                            {{/if}}
                        </div>
                    </div>
                    {{/each}}
                </div>
            </section>
            {{/each}}
        </div>
    </main>

    {{>html-footer}}
    {{>html-scripts}}
</body>
</html>`,
    };

    this.registry.registerTemplate(interactiveHtmlTemplate);
  }

  /**
   * Загружает HTML компоненты
   */
  private loadHtmlComponents(): void {
    // HTML стили
    const htmlStyles: TemplateSection = {
      id: 'html-styles',
      name: 'HTML Styles',
      description: 'Base CSS styles for HTML reports',
      format: TemplateFormat.HTML,
      content: `<style>
        :root {
            --primary-color: #3b82f6;
            --success-color: #059669;
            --warning-color: #d97706;
            --error-color: #dc2626;
            --info-color: #0891b2;
            --bg-color: #ffffff;
            --text-color: #1f2937;
            --border-color: #e5e7eb;
            --surface-color: #f9fafb;
        }

        [data-theme="dark"] {
            --bg-color: #1f2937;
            --text-color: #f9fafb;
            --border-color: #374151;
            --surface-color: #111827;
        }

        * { box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background: var(--bg-color);
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
            color: white;
            padding: 2rem 0;
            margin-bottom: 2rem;
        }

        .score-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.85em;
        }

        .score-a { background: var(--success-color); color: white; }
        .score-b { background: #10b981; color: white; }
        .score-c { background: var(--warning-color); color: white; }
        .score-d { background: #f59e0b; color: white; }
        .score-f { background: var(--error-color); color: white; }

        .report-item {
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: box-shadow 0.2s;
        }

        .report-item:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .report-item.issue { border-left: 4px solid var(--error-color); }
        .report-item.warning { border-left: 4px solid var(--warning-color); }
        .report-item.success { border-left: 4px solid var(--success-color); }
        .report-item.info { border-left: 4px solid var(--info-color); }

        .severity-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .severity-badge.critical { background: #fef2f2; color: var(--error-color); }
        .severity-badge.high { background: #fef3c7; color: var(--warning-color); }
        .severity-badge.medium { background: #dbeafe; color: var(--primary-color); }
        .severity-badge.low { background: #f0f9ff; color: var(--info-color); }

        .code-snippet {
            background: #f3f4f6;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
            overflow-x: auto;
        }

        .code-snippet pre {
            margin: 0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875em;
        }

        .theme-toggle {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .theme-toggle:hover {
            background: rgba(255,255,255,0.3);
        }

        @media (max-width: 768px) {
            .container { padding: 10px; }
            .report-item { padding: 1rem; }
        }
    </style>`,
    };

    // HTML заголовок
    const htmlHeader: TemplateSection = {
      id: 'html-header',
      name: 'HTML Header',
      description: 'Header component for HTML reports',
      format: TemplateFormat.HTML,
      content: `<header>
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="margin: 0; font-size: 2.5rem;">📊 {{projectName}}</h1>
                    <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">
                        Analysis Report • {{version}} • {{analysisDate}}
                    </p>
                </div>
                <div>
                    <button class="theme-toggle" onclick="toggleTheme()">🌓 Theme</button>
                </div>
            </div>
        </div>
    </header>`,
    };

    // HTML сводка
    const htmlSummary: TemplateSection = {
      id: 'html-summary',
      name: 'HTML Summary',
      description: 'Summary section for HTML reports',
      format: TemplateFormat.HTML,
      content: `<section class="summary-section" style="background: var(--surface-color); padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
        <h2 style="margin-top: 0;">📈 Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="metric-card">
                <div class="metric-value" style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">
                    {{summary.score}}/100
                </div>
                <div class="metric-label">Overall Score</div>
                <div class="score-badge score-{{toLowerCase summary.grade}}">Grade {{summary.grade}}</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="font-size: 1.5rem; color: var(--success-color);">
                    ✅ {{summary.passedChecks}}
                </div>
                <div class="metric-label">Passed Checks</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="font-size: 1.5rem; color: var(--error-color);">
                    ❌ {{summary.failedChecks}}
                </div>
                <div class="metric-label">Failed Checks</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="font-size: 1.5rem; color: var(--info-color);">
                    💡 {{summary.recommendations}}
                </div>
                <div class="metric-label">Recommendations</div>
            </div>
        </div>
    </section>`,
    };

    // HTML скрипты
    const htmlScripts: TemplateSection = {
      id: 'html-scripts',
      name: 'HTML Scripts',
      description: 'JavaScript functionality for HTML reports',
      format: TemplateFormat.HTML,
      content: `<script>
        // Переключение темы
        function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('eap-theme', newTheme);
        }

        // Восстановление темы
        const savedTheme = localStorage.getItem('eap-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Инициализация при загрузке
        document.addEventListener('DOMContentLoaded', function() {
            console.log('EAP Report loaded successfully');

            // Плавная прокрутка для якорей
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        });
    </script>`,
    };

    // Регистрируем все компоненты
    this.registry.registerSection(htmlStyles);
    this.registry.registerSection(htmlHeader);
    this.registry.registerSection(htmlSummary);
    this.registry.registerSection(htmlScripts);
  }

  // ========== ЗАГРУЗКА ИЗ ФАЙЛОВ ==========

  /**
   * Загружает шаблон из файла
   */
  public async loadTemplateFromFile(
    filePath: string,
    metadata?: Partial<TemplateMetadata>,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    try {
      // Проверяем существование файла
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return { success: false, error: `Path is not a file: ${filePath}` };
      }

      // Читаем содержимое
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath, path.extname(filePath));

      // Определяем формат
      const format =
        options.autoDetectFormat !== false
          ? this.detectFormatFromExtension(filePath)
          : metadata?.format || TemplateFormat.MARKDOWN;

      // Создаем метаданные
      const templateMetadata: TemplateMetadata = {
        id: metadata?.id || `custom-${fileName}-${Date.now()}`,
        name: metadata?.name || fileName,
        description: metadata?.description || `Custom template from ${filePath}`,
        format,
        category: metadata?.category || TemplateCategory.CUSTOM,
        complexity: metadata?.complexity || TemplateComplexity.SIMPLE,
        version: metadata?.version || '1.0.0',
        author: metadata?.author || 'Custom',
        tags: metadata?.tags || ['custom'],
        variables: metadata?.variables || this.extractVariables(content),
      };

      // Проверяем на существование
      if (!options.overwrite && this.registry.getTemplate(templateMetadata.id)) {
        return {
          success: false,
          error: `Template with id '${templateMetadata.id}' already exists. Use overwrite option.`,
        };
      }

      // Валидируем содержимое
      if (options.validateContent !== false) {
        const validation = this.validateTemplateContent(content, format);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Template validation failed: ${validation.errors.join(', ')}`,
          };
        }
      }

      // Создаем и регистрируем шаблон
      const template: Template = {
        metadata: templateMetadata,
        content,
      };

      this.registry.registerTemplate(template);

      return {
        success: true,
        templateId: templateMetadata.id,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load template: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Загружает все шаблоны из директории
   */
  public async loadTemplatesFromDirectory(
    dirPath: string,
    options: LoadOptions & { recursive?: boolean } = {}
  ): Promise<LoadResult[]> {
    const results: LoadResult[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isFile() && this.isTemplateFile(entry.name)) {
          const result = await this.loadTemplateFromFile(fullPath, undefined, options);
          results.push(result);
        } else if (entry.isDirectory() && options.recursive) {
          const subResults = await this.loadTemplatesFromDirectory(fullPath, options);
          results.push(...subResults);
        }
      }
    } catch (error) {
      results.push({
        success: false,
        error: `Failed to read directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return results;
  }

  // ========== УТИЛИТЫ ==========

  /**
   * Определяет формат по расширению файла
   */
  private detectFormatFromExtension(filePath: string): TemplateFormat {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.md':
      case '.markdown':
        return TemplateFormat.MARKDOWN;
      case '.json':
        return TemplateFormat.JSON;
      case '.html':
      case '.htm':
        return TemplateFormat.HTML;
      default:
        return TemplateFormat.MARKDOWN; // По умолчанию
    }
  }

  /**
   * Проверяет, является ли файл шаблоном
   */
  private isTemplateFile(fileName: string): boolean {
    const validExtensions = ['.md', '.markdown', '.json', '.html', '.htm'];
    const ext = path.extname(fileName).toLowerCase();
    return validExtensions.includes(ext);
  }

  /**
   * Извлекает переменные из содержимого шаблона
   */
  private extractVariables(content: string): string[] {
    // Простое извлечение переменных в формате {{variable}}
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      // Убираем хелперы и оставляем только имена переменных
      const variable = match[1].trim().split(' ')[0];
      if (
        variable &&
        !variable.startsWith('#') &&
        !variable.startsWith('/') &&
        !variable.startsWith('>')
      ) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  /**
   * Валидирует содержимое шаблона
   */
  private validateTemplateContent(
    content: string,
    format: TemplateFormat
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Базовые проверки
    if (!content || content.trim().length === 0) {
      errors.push('Template content is empty');
    }

    // Проверка баланса фигурных скобок
    const openBraces = (content.match(/\{\{/g) || []).length;
    const closeBraces = (content.match(/\}\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced template braces');
    }

    // Специфичные для формата проверки
    switch (format) {
      case TemplateFormat.JSON:
        // Для JSON проверяем базовую структуру
        if (!content.includes('{') || !content.includes('}')) {
          errors.push('JSON template should contain object structure');
        }
        break;
      case TemplateFormat.HTML:
        // Для HTML проверяем наличие базовых тегов
        if (!content.includes('<') || !content.includes('>')) {
          errors.push('HTML template should contain HTML tags');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Получает статистику загруженных шаблонов
   */
  public getLoadStats(): {
    builtInLoaded: boolean;
    totalTemplates: number;
    byFormat: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    return {
      builtInLoaded: this.loadedBuiltIns,
      ...this.registry.getRegistryStats(),
    };
  }
}
