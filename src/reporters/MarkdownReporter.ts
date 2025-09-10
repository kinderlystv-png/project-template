/**
 * 📝 EAP ANALYZER v6.0 - MARKDOWN REPORTER
 * Генерация документации в формате Markdown
 */

import type { ReportData, ReportConfig, IReporter } from './types.js';

export class MarkdownReporter implements IReporter {
  async generate(data: ReportData, config: ReportConfig): Promise<string> {
    const markdown = this.generateMarkdown(data, config);

    if (config.outputPath) {
      const fs = await import('fs/promises');
      const path = await import('path');

      const outputFile = path.join(config.outputPath, 'eap-analysis-report.md');
      await fs.writeFile(outputFile, markdown, 'utf8');

      return outputFile;
    }

    return markdown;
  }

  getDefaultConfig(): ReportConfig {
    return {
      format: 'markdown',
      includeDetails: true,
      includeRecommendations: true,
      interactive: false,
      minifyOutput: false,
    };
  }

  getSupportedFormats(): string[] {
    return ['markdown', 'md'];
  }

  private generateMarkdown(data: ReportData, config: ReportConfig): string {
    const sections: string[] = [];

    // Заголовок отчета
    sections.push(this.generateHeader(data));

    // Сводка
    sections.push(this.generateSummary(data));

    // Детальная информация по категориям
    sections.push(this.generateCategories(data, config));

    // Рекомендации
    if (config.includeRecommendations && data.recommendations.length > 0) {
      sections.push(this.generateRecommendations(data));
    }

    // Техническая информация
    sections.push(this.generateTechnicalInfo(data));

    // Метрики производительности
    sections.push(this.generatePerformanceMetrics(data));

    // Информация о безопасности
    sections.push(this.generateSecurityInfo(data));

    // Информация о тестировании
    sections.push(this.generateTestingInfo(data));

    // Метаданные
    sections.push(this.generateMetadata(data));

    return sections.join('\\n\\n---\\n\\n');
  }

  private generateHeader(data: ReportData): string {
    const date = new Date(data.timestamp);
    const formattedDate = date.toLocaleString('ru-RU');

    return `# 🔍 EAP Analyzer Report

**Проект:** \`${data.projectPath}\`
**Дата генерации:** ${formattedDate}
**Анализатор:** EAP Analyzer v${data.metadata.version}

> Автоматически сгенерированный отчет анализа проекта`;
  }

  private generateSummary(data: ReportData): string {
    const { summary } = data;
    const statusEmoji = this.getStatusEmoji(summary.status);
    const statusText = this.getStatusText(summary.status);

    return `## 📊 Общая сводка

| Метрика | Значение | Статус |
|---------|----------|--------|
| **Общая готовность** | **${summary.totalReadiness}%** | ${statusEmoji} ${statusText} |
| Компонентов | ${summary.componentsCount} | 🧩 |
| Проблем найдено | ${summary.issuesCount} | ${summary.issuesCount > 10 ? '⚠️' : '✅'} |
| Рекомендаций | ${summary.recommendationsCount} | 💡 |
| Критичных проблем | ${summary.criticalIssues} | ${summary.criticalIssues > 0 ? '🚨' : '✅'} |

### 📈 Прогресс-индикатор
\`\`\`
████████████████${summary.totalReadiness >= 80 ? '████' : summary.totalReadiness >= 60 ? '███' : summary.totalReadiness >= 40 ? '██' : '█'}░░░░ ${summary.totalReadiness}%
\`\`\``;
  }

  private generateCategories(data: ReportData, config: ReportConfig): string {
    const sections: string[] = ['## 📂 Анализ по категориям'];

    data.categories.forEach(category => {
      sections.push(this.generateCategorySection(category, config));
    });

    return sections.join('\\n\\n');
  }

  private generateCategorySection(category: any, config: ReportConfig): string {
    const statusEmoji = this.getStatusEmoji(category.status);
    const statusText = this.getStatusText(category.status);

    let section = `### ${this.getCategoryEmoji(category.slug)} ${category.name}

**Готовность:** ${category.readiness}% ${statusEmoji}
**Статус:** ${statusText}
**Описание:** ${category.description}`;

    if (config.includeDetails && category.components.length > 0) {
      section += '\\n\\n#### 🔧 Компоненты\\n';

      category.components.forEach((component: any) => {
        section += this.generateComponentMarkdown(component, config);
      });
    }

    return section;
  }

  private generateComponentMarkdown(component: any, _config: ReportConfig): string {
    const statusEmoji = this.getStatusEmoji(component.status);

    let markdown = `
##### ${component.name} (${component.readiness}% ${statusEmoji})

| Параметр | Значение |
|----------|----------|
| Файлов проанализировано | ${component.details.filesAnalyzed} |
| Строк кода | ${component.details.linesOfCode.toLocaleString()} |
| Тестов | ${component.details.testsCount} |
| Покрытие | ${component.details.coverage ? component.details.coverage + '%' : 'N/A'} |
| Проблем | ${component.issues.length} |`;

    // Добавляем проблемы если есть
    if (component.issues.length > 0) {
      markdown += '\\n\\n**🚨 Обнаруженные проблемы:**\\n';

      component.issues.forEach((issue: any) => {
        const severityEmoji = this.getSeverityEmoji(issue.severity);
        markdown += `\\n- ${severityEmoji} **${issue.type.toUpperCase()}:** ${issue.message}`;
        if (issue.file) {
          markdown += `\\n  - 📁 \`${issue.file}\`${issue.line ? `:${issue.line}` : ''}`;
        }
        if (issue.suggestion) {
          markdown += `\\n  - 💡 *Предложение:* ${issue.suggestion}`;
        }
      });
    }

    // Добавляем рекомендации если есть
    if (component.recommendations.length > 0) {
      markdown += '\\n\\n**💡 Рекомендации:**\\n';
      component.recommendations.forEach((rec: string) => {
        markdown += `\\n- ${rec}`;
      });
    }

    return markdown;
  }

  private generateRecommendations(data: ReportData): string {
    let section = `## 💡 Рекомендации по улучшению

Найдено **${data.recommendations.length}** рекомендаций для улучшения проекта:

| Приоритет | Категория | Заголовок | Время |
|-----------|-----------|-----------|-------|`;

    data.recommendations.forEach(rec => {
      const priorityEmoji = this.getPriorityEmoji(rec.priority);
      section += `\\n| ${priorityEmoji} ${rec.priority.toUpperCase()} | ${rec.category} | ${rec.title} | ${rec.estimatedTime} |`;
    });

    section += '\\n\\n### 📋 Детальные рекомендации\\n';

    data.recommendations.forEach((rec, index) => {
      const priorityEmoji = this.getPriorityEmoji(rec.priority);
      section += `
#### ${index + 1}. ${rec.title} ${priorityEmoji}

**Категория:** ${rec.category} → ${rec.component}
**Приоритет:** ${rec.priority.toUpperCase()}
**Время выполнения:** ${rec.estimatedTime}
**Ожидаемый эффект:** ${rec.impact}

**Описание:**
${rec.description}

**Действие:**
${rec.action}`;
    });

    return section;
  }

  private generateTechnicalInfo(data: ReportData): string {
    return `## ⚙️ Техническая информация

### 🏗️ Архитектура проекта
- **Всего компонентов:** ${data.summary.componentsCount}
- **Анализаторов активно:** ${data.categories.length}
- **Время анализа:** ${Math.round(data.metadata.totalAnalysisTime / 1000)}с

### 🔧 Используемая конфигурация
- **Конфигурационный файл:** \`${data.metadata.configUsed}\`
- **Версия анализатора:** ${data.metadata.version}
- **Платформа:** ${data.metadata.os}
- **Node.js:** ${data.metadata.nodeVersion}`;
  }

  private generatePerformanceMetrics(data: ReportData): string {
    const { performance } = data;
    const bundleSizeMB = (performance.bundleSize.total / 1024 / 1024).toFixed(2);
    const gzippedSizeMB = (performance.bundleSize.gzipped / 1024 / 1024).toFixed(2);
    const buildTimeSec = (performance.buildTime / 1000).toFixed(1);

    let section = `## ⚡ Метрики производительности

### 📦 Размер бандла
- **Общий размер:** ${bundleSizeMB} MB
- **Сжатый (gzip):** ${gzippedSizeMB} MB
- **Коэффициент сжатия:** ${((1 - performance.bundleSize.gzipped / performance.bundleSize.total) * 100).toFixed(1)}%

### ⏱️ Время сборки
- **Время сборки:** ${buildTimeSec}с
- **Использование памяти:** ${(performance.memoryUsage / 1024 / 1024).toFixed(0)} MB`;

    if (performance.coreWebVitals) {
      section += `

### 🌐 Core Web Vitals
| Метрика | Значение | Статус |
|---------|----------|--------|
| **LCP** (Largest Contentful Paint) | ${performance.coreWebVitals.lcp}s | ${performance.coreWebVitals.lcp <= 2.5 ? '✅ Хорошо' : performance.coreWebVitals.lcp <= 4 ? '⚠️ Требует внимания' : '❌ Плохо'} |
| **FID** (First Input Delay) | ${performance.coreWebVitals.fid}ms | ${performance.coreWebVitals.fid <= 100 ? '✅ Хорошо' : performance.coreWebVitals.fid <= 300 ? '⚠️ Требует внимания' : '❌ Плохо'} |
| **CLS** (Cumulative Layout Shift) | ${performance.coreWebVitals.cls} | ${performance.coreWebVitals.cls <= 0.1 ? '✅ Хорошо' : performance.coreWebVitals.cls <= 0.25 ? '⚠️ Требует внимания' : '❌ Плохо'} |
| **FCP** (First Contentful Paint) | ${performance.coreWebVitals.fcp}s | ${performance.coreWebVitals.fcp <= 1.8 ? '✅ Хорошо' : performance.coreWebVitals.fcp <= 3 ? '⚠️ Требует внимания' : '❌ Плохо'} |
| **TTFB** (Time to First Byte) | ${performance.coreWebVitals.ttfb}ms | ${performance.coreWebVitals.ttfb <= 600 ? '✅ Хорошо' : performance.coreWebVitals.ttfb <= 1500 ? '⚠️ Требует внимания' : '❌ Плохо'} |`;
    }

    return section;
  }

  private generateSecurityInfo(data: ReportData): string {
    const { security } = data;

    return `## 🔒 Безопасность

### 📊 Общий рейтинг безопасности: ${security.securityScore}/100

| Компонент | Статус |
|-----------|--------|
| **Content Security Policy** | ${this.getSecurityStatusEmoji(security.cspStatus)} ${security.cspStatus} |
| **HTTPS** | ${this.getSecurityStatusEmoji(security.httpsStatus)} ${security.httpsStatus} |
| **Аутентификация** | ${this.getSecurityStatusEmoji(security.authenticationStatus)} ${security.authenticationStatus} |
| **Защита данных** | ${this.getSecurityStatusEmoji(security.dataProtectionStatus)} ${security.dataProtectionStatus} |

### 🚨 Обнаруженные уязвимости: ${security.vulnerabilities.length}

${
  security.vulnerabilities.length > 0
    ? security.vulnerabilities
        .map(
          (vuln: any, index: number) =>
            `${index + 1}. **${vuln.type.toUpperCase()}** (${vuln.severity}) в \`${vuln.file}:${vuln.line}\`
   ${vuln.description}
   💡 *Рекомендация:* ${vuln.recommendation}`
        )
        .join('\\n\\n')
    : '✅ Критических уязвимостей не обнаружено'
}`;
  }

  private generateTestingInfo(data: ReportData): string {
    const { testing } = data;

    return `## 🧪 Тестирование

### 📊 Покрытие кода
| Тип | Покрытие |
|-----|----------|
| **Строки** | ${testing.coverage.lines}% ${testing.coverage.lines >= 80 ? '✅' : testing.coverage.lines >= 60 ? '⚠️' : '❌'} |
| **Функции** | ${testing.coverage.functions}% ${testing.coverage.functions >= 80 ? '✅' : testing.coverage.functions >= 60 ? '⚠️' : '❌'} |
| **Ветки** | ${testing.coverage.branches}% ${testing.coverage.branches >= 80 ? '✅' : testing.coverage.branches >= 60 ? '⚠️' : '❌'} |
| **Выражения** | ${testing.coverage.statements}% ${testing.coverage.statements >= 80 ? '✅' : testing.coverage.statements >= 60 ? '⚠️' : '❌'} |

### 🎯 Результаты тестов
- **Всего тестов:** ${testing.testResults.total}
- **Пройдено:** ${testing.testResults.passed} ✅
- **Провалено:** ${testing.testResults.failed} ${testing.testResults.failed > 0 ? '❌' : '✅'}
- **Пропущено:** ${testing.testResults.skipped} ⏭️
- **Время выполнения:** ${(testing.testResults.duration / 1000).toFixed(1)}с

### 🔧 Конфигурация тестирования
- **Mock системы:** ${this.getTestingStatusEmoji(testing.mockingStatus)} ${testing.mockingStatus}
- **E2E тесты:** ${this.getTestingStatusEmoji(testing.e2eStatus)} ${testing.e2eStatus}`;
  }

  private generateMetadata(data: ReportData): string {
    return `## ℹ️ Метаданные отчета

**Дата генерации:** ${new Date(data.timestamp).toLocaleString('ru-RU')}
**Версия анализатора:** EAP Analyzer v${data.metadata.version}
**Время выполнения анализа:** ${Math.round(data.metadata.totalAnalysisTime / 1000)}с
**Конфигурация:** \`${data.metadata.configUsed}\`
**Среда выполнения:** Node.js ${data.metadata.nodeVersion} на ${data.metadata.os}

---

*Этот отчет автоматически сгенерирован системой EAP Analyzer v6.0*
*Для получения дополнительной информации посетите документацию проекта*`;
  }

  // Вспомогательные методы для эмодзи и форматирования
  private getStatusEmoji(status: string): string {
    const statusMap: Record<string, string> = {
      excellent: '✅',
      good: '👍',
      warning: '⚠️',
      critical: '❌',
    };
    return statusMap[status] || '❓';
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      excellent: 'Отлично',
      good: 'Хорошо',
      warning: 'Требует внимания',
      critical: 'Критично',
    };
    return statusMap[status] || 'Неизвестно';
  }

  private getCategoryEmoji(slug: string): string {
    const categoryMap: Record<string, string> = {
      security: '🔒',
      testing: '🧪',
      performance: '⚡',
      quality: '✨',
      documentation: '📚',
    };
    return categoryMap[slug] || '📊';
  }

  private getSeverityEmoji(severity: string): string {
    const severityMap: Record<string, string> = {
      critical: '🚨',
      high: '🔥',
      medium: '⚠️',
      low: '💡',
    };
    return severityMap[severity] || '❓';
  }

  private getPriorityEmoji(priority: string): string {
    const priorityMap: Record<string, string> = {
      critical: '🚨',
      high: '🔥',
      medium: '⚠️',
      low: '💡',
    };
    return priorityMap[priority] || '📝';
  }

  private getSecurityStatusEmoji(status: string): string {
    const statusMap: Record<string, string> = {
      enabled: '✅',
      disabled: '❌',
      partial: '⚠️',
      unknown: '❓',
      basic: '⚠️',
      'gdpr-compliant': '✅',
    };
    return statusMap[status] || '❓';
  }

  private getTestingStatusEmoji(status: string): string {
    const statusMap: Record<string, string> = {
      comprehensive: '✅',
      basic: '⚠️',
      none: '❌',
      unknown: '❓',
    };
    return statusMap[status] || '❓';
  }
}
