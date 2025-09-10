/**
 * 🖥️ EAP ANALYZER v6.0 - CONSOLE REPORTER
 * Вывод отчетов в консоль для быстрого просмотра
 */

import type { ReportData, ReportConfig, IReporter } from './types.js';

export class ConsoleReporter implements IReporter {
  async generate(data: ReportData, config: ReportConfig): Promise<string> {
    const output = this.generateConsoleOutput(data, config);

    // eslint-disable-next-line no-console
    console.log(output);

    return output;
  }

  getDefaultConfig(): ReportConfig {
    return {
      format: 'console',
      includeDetails: true,
      includeRecommendations: true,
      interactive: false,
      minifyOutput: false,
    };
  }

  getSupportedFormats(): string[] {
    return ['console'];
  }

  private generateConsoleOutput(data: ReportData, config: ReportConfig): string {
    const lines: string[] = [];

    // Заголовок
    lines.push('');
    lines.push('🔍 EAP ANALYZER REPORT');
    lines.push('═'.repeat(60));
    lines.push(`📁 Проект: ${data.projectPath}`);
    lines.push(`📅 Время: ${new Date(data.timestamp).toLocaleString('ru-RU')}`);
    lines.push('');

    // Общая сводка
    lines.push('📊 ОБЩАЯ СВОДКА');
    lines.push('─'.repeat(40));
    lines.push(
      `📈 Общая готовность: ${data.summary.totalReadiness}% (${this.getStatusEmoji(data.summary.status)})`
    );
    lines.push(`🧩 Компонентов: ${data.summary.componentsCount}`);
    lines.push(`⚠️  Проблем: ${data.summary.issuesCount}`);
    lines.push(`💡 Рекомендаций: ${data.summary.recommendationsCount}`);
    lines.push(`🚨 Критичных: ${data.summary.criticalIssues}`);
    lines.push('');

    // Категории
    lines.push('📂 КАТЕГОРИИ');
    lines.push('─'.repeat(40));

    data.categories.forEach(category => {
      lines.push(
        `${this.getCategoryEmoji(category.slug)} ${category.name}: ${category.readiness}% ${this.getStatusEmoji(category.status)}`
      );

      if (config.includeDetails) {
        category.components.forEach(component => {
          const status = this.getStatusEmoji(component.status);
          lines.push(`  └─ ${component.name}: ${component.readiness}% ${status}`);

          if (component.issues.length > 0) {
            lines.push(`     ⚠️  ${component.issues.length} проблем`);
          }
        });
      }
      lines.push('');
    });

    // Рекомендации
    if (config.includeRecommendations && data.recommendations.length > 0) {
      lines.push('💡 ТОП РЕКОМЕНДАЦИИ');
      lines.push('─'.repeat(40));

      data.recommendations
        .slice(0, 5) // Показываем только топ-5
        .forEach(rec => {
          const priority = this.getPriorityEmoji(rec.priority);
          lines.push(`${priority} ${rec.title}`);
          lines.push(`   📝 ${rec.description}`);
          lines.push(`   ⏱️  ${rec.estimatedTime} | 🎯 ${rec.impact}`);
          lines.push('');
        });
    }

    // Метаданные
    lines.push('ℹ️  ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ');
    lines.push('─'.repeat(40));
    lines.push(`🔧 Версия анализатора: ${data.metadata.version}`);
    lines.push(`🟢 Node.js: ${data.metadata.nodeVersion}`);
    lines.push(`💻 ОС: ${data.metadata.os}`);
    lines.push(`⏱️  Время анализа: ${Math.round(data.metadata.totalAnalysisTime / 1000)}с`);
    lines.push('');

    return lines.join('\\n');
  }

  private getStatusEmoji(status: string): string {
    const statusMap: Record<string, string> = {
      excellent: '✅',
      good: '👍',
      warning: '⚠️',
      critical: '❌',
    };
    return statusMap[status] || '❓';
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

  private getPriorityEmoji(priority: string): string {
    const priorityMap: Record<string, string> = {
      critical: '🚨',
      high: '🔥',
      medium: '⚠️',
      low: '💡',
    };
    return priorityMap[priority] || '📝';
  }
}
