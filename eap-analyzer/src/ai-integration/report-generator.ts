/**
 * Упрощенный генератор отчетов для AI анализа
 */

import fs from 'fs';
import { IntegratedAnalysisResult } from './index.js';

export interface ReportOptions {
  format: 'html' | 'json' | 'markdown' | 'console';
  outputFile?: string;
  verbose?: boolean;
}

export class AIReportGenerator {
  async generateReport(result: IntegratedAnalysisResult, options: ReportOptions): Promise<string> {
    switch (options.format) {
      case 'json':
        return this.generateJsonReport(result);
      case 'html':
        return this.generateHtmlReport(result);
      case 'markdown':
        return this.generateMarkdownReport(result);
      default:
        return this.generateConsoleReport(result);
    }
  }

  private generateConsoleReport(result: IntegratedAnalysisResult): string {
    const lines: string[] = [];
    lines.push('🤖 === EAP AI ANALYSIS REPORT ===');
    lines.push('');
    lines.push('📊 БАЗОВАЯ СТАТИСТИКА:');
    lines.push(`   Всего файлов: ${result.fileCount}`);
    lines.push('');

    if (result.aiInsights) {
      lines.push('🧠 AI АНАЛИЗ:');
      lines.push(`   Общая AI оценка: ${result.aiInsights.summary.overallQuality}/100`);
      lines.push(
        `   Качество предсказания: ${(result.aiInsights.qualityPrediction.confidence * 100).toFixed(1)}%`
      );
      lines.push('');
    }

    lines.push('================================');
    return lines.join('\n');
  }

  private generateJsonReport(result: IntegratedAnalysisResult): string {
    const report = {
      timestamp: new Date().toISOString(),
      projectAnalysis: {
        fileCount: result.fileCount || 0,
        baseScore: result.summary?.totalScore || 0,
        basePercentage: result.summary?.percentage || 0,
      },
      aiAnalysis: result.aiInsights
        ? {
            overallQuality: result.aiInsights.summary.overallQuality,
            confidence: result.aiInsights.qualityPrediction.confidence,
            prediction: result.aiInsights.qualityPrediction.score,
            recommendations: result.aiInsights.summary.recommendations || [],
          }
        : null,
      summary: {
        totalIssues: result.summary?.criticalIssues || 0,
        passedChecks: result.summary?.passedChecks || 0,
        totalChecks: result.summary?.totalChecks || 0,
      },
    };
    return JSON.stringify(report, null, 2);
  }

  private generateHtmlReport(result: IntegratedAnalysisResult): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>EAP AI Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { color: #333; border-bottom: 2px solid #007acc; }
        .score { font-size: 2em; color: #007acc; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007acc; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 EAP AI Analysis Report</h1>
        <p>Время анализа: ${new Date().toLocaleString('ru')}</p>
    </div>

    <div class="section">
        <h2>📊 Базовая статистика</h2>
        <p>Всего файлов: ${result.fileCount}</p>
        <p>Базовая оценка: <span class="score">${result.summary?.totalScore || 0}/100</span></p>
    </div>

    ${
      result.aiInsights
        ? `
    <div class="section">
        <h2>🧠 AI Анализ</h2>
        <p>Общая AI оценка: <span class="score">${result.aiInsights.summary.overallQuality}/100</span></p>
        <p>Уверенность предсказания: ${(result.aiInsights.qualityPrediction.confidence * 100).toFixed(1)}%</p>
    </div>
    `
        : ''
    }
</body>
</html>`;
  }

  private generateMarkdownReport(result: IntegratedAnalysisResult): string {
    const lines: string[] = [];
    lines.push('# 🤖 EAP AI Analysis Report');
    lines.push('');
    lines.push(`**Время анализа:** ${new Date().toLocaleString('ru')}`);
    lines.push('');
    lines.push('## 📊 Базовая статистика');
    lines.push(`- Всего файлов: ${result.fileCount}`);
    lines.push(`- Базовая оценка: ${result.summary?.totalScore || 0}/100`);
    lines.push('');

    if (result.aiInsights) {
      lines.push('## 🧠 AI Анализ');
      lines.push(`- Общая AI оценка: ${result.aiInsights.summary.overallQuality}/100`);
      lines.push(
        `- Уверенность предсказания: ${(result.aiInsights.qualityPrediction.confidence * 100).toFixed(1)}%`
      );
      lines.push('');
    }

    return lines.join('\n');
  }
}

export default AIReportGenerator;
