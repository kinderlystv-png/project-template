#!/usr/bin/env node

/**
 * Демонстрация полной системы анализа v3.0 с AI инсайтами
 */

import { AnalysisOrchestrator } from '../core/orchestrator.js';
import { UltimateReportGenerator } from '../core/ultimate-report-generator.js';
import * as fs from 'fs';
import * as path from 'path';

class EAPAnalyzerDemo {
  private orchestrator: AnalysisOrchestrator;
  private ultimateGenerator: UltimateReportGenerator;

  constructor() {
    this.orchestrator = new AnalysisOrchestrator(6); // 6 параллельных потоков
    this.ultimateGenerator = new UltimateReportGenerator();
  }

  async runFullDemo(): Promise<void> {
    console.log('🚀 === ДЕМОНСТРАЦИЯ EAP ANALYZER v3.0 ===');
    console.log('🧠 AI анализ + 💰 Технический долг + 📊 ROI расчеты');
    console.log('');

    const projectPath = process.cwd();

    try {
      // Полный анализ проекта
      console.log('1️⃣ Запуск полного анализа проекта...');
      const startTime = Date.now();

      const { analysis, report } = await this.orchestrator.analyzeProjectWithReport(projectPath);

      const duration = Date.now() - startTime;
      console.log(`✅ Анализ завершен за ${duration}мс`);
      console.log('');

      // Демонстрация результатов
      await this.demonstrateResults(analysis, report);

      // Сохранение отчетов
      await this.saveReports(analysis, report);

      console.log('🎉 Демонстрация завершена успешно!');
    } catch (error) {
      console.error('❌ Ошибка демонстрации:', error);
      process.exit(1);
    }
  }

  private async demonstrateResults(analysis: any, report: any): Promise<void> {
    console.log('📋 === РЕЗУЛЬТАТЫ АНАЛИЗА ===');

    // Общая статистика
    this.showGeneralStats(analysis);

    // AI анализ
    this.showAIInsights(report);

    // Технический долг
    this.showTechnicalDebt(report);

    // Рекомендации
    this.showRecommendations(report);
  }

  private showGeneralStats(analysis: any): void {
    console.log('📊 ОБЩАЯ СТАТИСТИКА:');
    console.log(`   🎯 Общая оценка: ${analysis.summary.overallScore}/100`);
    console.log(`   📁 Файлов проанализировано: ${analysis.metadata.modulesUsed.length}`);
    console.log(`   ⚠️  Критических проблем: ${analysis.summary.criticalIssues.length}`);
    console.log(`   🔧 Модулей использовано: ${analysis.metadata.modulesUsed.join(', ')}`);
    console.log('');
  }

  private showAIInsights(report: any): void {
    console.log('🧠 AI АНАЛИЗ И ИНСАЙТЫ:');

    if (report.aiInsights?.patterns?.length > 0) {
      console.log('   🎨 Обнаруженные паттерны:');
      report.aiInsights.patterns.slice(0, 3).forEach((pattern: any) => {
        console.log(`      • ${pattern.name} (${pattern.confidence}% уверенности)`);
      });
    }

    if (report.aiInsights?.quality) {
      console.log(`   📈 Предсказание качества: ${report.aiInsights.quality.score}/100`);
      console.log(`   📊 Тренд: ${report.aiInsights.quality.trend}`);
    }

    if (report.aiInsights?.duplication) {
      console.log(`   🔄 Дублирование кода: ${report.aiInsights.duplication.percentage}%`);
    }

    if (report.aiInsights?.complexity) {
      console.log(`   🧩 Средняя сложность: ${report.aiInsights.complexity.average}`);
    }

    console.log('');
  }

  private showTechnicalDebt(report: any): void {
    console.log('💰 ТЕХНИЧЕСКИЙ ДОЛГ И ROI:');

    if (report.technicalDebtAnalysis) {
      const debt = report.technicalDebtAnalysis;
      console.log(`   💸 Общий долг: ${debt.totalDebt} часов`);
      console.log(`   📅 Ежемесячные проценты: ${debt.monthlyInterest} часов`);

      if (debt.roiAnalysis) {
        console.log(`   💹 ROI рефакторинга: ${debt.roiAnalysis.roi}%`);
        console.log(`   ⏱️  Окупаемость: ${debt.roiAnalysis.paybackPeriod} месяцев`);
        console.log(`   💡 Рекомендация: ${debt.roiAnalysis.recommendation}`);
      }

      if (debt.categories?.length > 0) {
        console.log('   📂 Категории долга:');
        debt.categories.slice(0, 3).forEach((cat: any) => {
          console.log(`      • ${cat.name}: ${cat.debt} часов (${cat.impact})`);
        });
      }

      if (debt.hotspots?.length > 0) {
        console.log('   🔥 Горячие точки:');
        debt.hotspots.slice(0, 3).forEach((hotspot: any) => {
          console.log(`      • ${hotspot.file}: ${hotspot.debt} часов`);
        });
      }
    }

    console.log('');
  }

  private showRecommendations(report: any): void {
    console.log('💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:');

    if (report.ultimateAnalysis?.aiInsights?.aiRecommendations?.length > 0) {
      console.log('   🎯 AI рекомендации:');
      report.ultimateAnalysis.aiInsights.aiRecommendations.slice(0, 3).forEach((rec: string) => {
        console.log(`      • ${rec}`);
      });
    }

    if (report.refactoringRecommendations?.opportunities?.length > 0) {
      console.log('   🔧 Возможности рефакторинга:');
      report.refactoringRecommendations.opportunities.slice(0, 3).forEach((opp: any) => {
        console.log(`      • ${opp.type} в ${opp.file} (${opp.priority} приоритет)`);
      });
    }

    if (report.technicalDebtAnalysis?.payoffPlan?.length > 0) {
      console.log('   📋 План погашения долга:');
      report.technicalDebtAnalysis.payoffPlan.slice(0, 3).forEach((plan: any) => {
        console.log(`      • ${plan.category}: ${plan.refactoringTime} часов (${plan.priority})`);
      });
    }

    console.log('');
  }

  private async saveReports(analysis: any, report: any): Promise<void> {
    console.log('💾 Сохранение отчетов...');

    const reportsDir = path.join(process.cwd(), 'reports');

    try {
      await fs.promises.mkdir(reportsDir, { recursive: true });

      // Полный анализ
      const analysisPath = path.join(reportsDir, 'full-analysis.json');
      await fs.promises.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
      console.log(`   📄 Полный анализ: ${analysisPath}`);

      // Comprehensive отчет
      const reportPath = path.join(reportsDir, 'comprehensive-report.json');
      await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`   📊 Comprehensive отчет: ${reportPath}`);

      // Ultimate отчет
      if (report.ultimateAnalysis) {
        const ultimatePath = path.join(reportsDir, 'ultimate-report.json');
        await fs.promises.writeFile(ultimatePath, JSON.stringify(report.ultimateAnalysis, null, 2));
        console.log(`   🚀 Ultimate отчет: ${ultimatePath}`);
      }

      // AI инсайты
      if (report.aiInsights) {
        const aiPath = path.join(reportsDir, 'ai-insights.json');
        await fs.promises.writeFile(aiPath, JSON.stringify(report.aiInsights, null, 2));
        console.log(`   🧠 AI инсайты: ${aiPath}`);
      }

      // Технический долг
      if (report.technicalDebtAnalysis) {
        const debtPath = path.join(reportsDir, 'technical-debt.json');
        await fs.promises.writeFile(
          debtPath,
          JSON.stringify(report.technicalDebtAnalysis, null, 2)
        );
        console.log(`   💰 Технический долг: ${debtPath}`);
      }

      // Краткий отчет в формате MD
      await this.generateMarkdownSummary(report, reportsDir);
    } catch (error) {
      console.error('❌ Ошибка сохранения отчетов:', error);
    }

    console.log('');
  }

  private async generateMarkdownSummary(report: any, dir: string): Promise<void> {
    const mdPath = path.join(dir, 'ANALYSIS-SUMMARY.md');

    let md = '# 🚀 EAP Analyzer v3.0 - Отчет\n\n';
    md += `**Дата анализа:** ${new Date().toLocaleString()}\n\n`;

    // AI анализ
    if (report.aiInsights) {
      md += '## 🧠 AI Анализ\n\n';

      if (report.aiInsights.quality) {
        md += `**Качество кода:** ${report.aiInsights.quality.score}/100\n`;
        md += `**Тренд:** ${report.aiInsights.quality.trend}\n\n`;
      }

      if (report.aiInsights.patterns?.length > 0) {
        md += '**Обнаруженные паттерны:**\n';
        report.aiInsights.patterns.forEach((pattern: any) => {
          md += `- ${pattern.name} (${pattern.confidence}% уверенности)\n`;
        });
        md += '\n';
      }
    }

    // Технический долг
    if (report.technicalDebtAnalysis) {
      md += '## 💰 Технический долг\n\n';
      const debt = report.technicalDebtAnalysis;

      md += `**Общий долг:** ${debt.totalDebt} часов\n`;
      md += `**Ежемесячные проценты:** ${debt.monthlyInterest} часов\n`;

      if (debt.roiAnalysis) {
        md += `**ROI рефакторинга:** ${debt.roiAnalysis.roi}%\n`;
        md += `**Окупаемость:** ${debt.roiAnalysis.paybackPeriod} месяцев\n\n`;
      }
    }

    // Рекомендации
    md += '## 💡 Главные рекомендации\n\n';

    if (report.ultimateAnalysis?.aiInsights?.aiRecommendations?.length > 0) {
      report.ultimateAnalysis.aiInsights.aiRecommendations.slice(0, 5).forEach((rec: string) => {
        md += `- ${rec}\n`;
      });
    }

    md += '\n---\n*Сгенерировано EAP Analyzer v3.0*';

    await fs.promises.writeFile(mdPath, md);
    console.log(`   📝 Краткий отчет (MD): ${mdPath}`);
  }
}

// Запуск демонстрации
try {
  if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new EAPAnalyzerDemo();
    demo.runFullDemo().catch(console.error);
  }
} catch (e) {
  // Игнорируем в CJS среде
}

export { EAPAnalyzerDemo };
