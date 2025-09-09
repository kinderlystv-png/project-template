/**
 * Пример интеграции анализатора структуры с основной системой ЭАП
 * Демонстрирует полный цикл от анализа до генерации дорожной карты
 */

import StructureAnalyzer from './index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Класс интеграции с ЭАП
 */
class EAPStructureIntegration {
  constructor() {
    this.analyzer = new StructureAnalyzer();
  }

  /**
   * Полный анализ проекта с генерацией отчета и дорожной карты
   */
  async analyzeProject(projectPath, outputPath = null) {
    console.log('🔍 Запуск полного анализа структуры проекта...');

    try {
      // Выполняем полный анализ
      const fullReport = await this.analyzer.generateFullReport(projectPath, {
        includeAdvanced: true,
        enableLearning: true,
        generateRoadmap: true,
      });

      // Формируем итоговый отчет
      const finalReport = {
        metadata: {
          analyzedAt: new Date().toISOString(),
          projectPath,
          analyzer: 'EAP Structure Analyzer',
          version: fullReport.roadmap.metadata.analysisVersion,
        },

        // Основные результаты анализа
        analysis: {
          score: fullReport.verdict.score,
          grade: fullReport.verdict.grade,
          totalFiles: fullReport.summary.totalFiles,
          totalLines: fullReport.summary.totalLines,
          issues: fullReport.summary.issues,
          strengths: fullReport.summary.strengths,
        },

        // Вердикт и рекомендации
        verdict: {
          ...fullReport.verdict,
          summary: this.generateVerdictSummary(fullReport),
        },

        // Детальные результаты
        details: {
          basic: fullReport.basic,
          advanced: fullReport.advanced,
          recommendations: fullReport.recommendations,
        },

        // Дорожная карта рефакторинга
        roadmap: {
          necessity: fullReport.summary.refactoringNecessity,
          content: fullReport.roadmap.content,
          tasks: fullReport.summary.roadmap.tasks,
          phases: fullReport.summary.roadmap.phases,
          effort: fullReport.summary.roadmap.totalEffort,
          roi: fullReport.verdict.roi,
        },

        // Следующие шаги
        actionPlan: {
          immediate: fullReport.verdict.nextSteps,
          monitoring: this.generateMonitoringPlan(fullReport),
          success_criteria: this.generateSuccessCriteria(fullReport),
        },
      };

      // Сохраняем отчет, если указан путь
      if (outputPath) {
        await this.saveReport(finalReport, outputPath);
      }

      // Выводим резюме в консоль
      this.printSummary(finalReport);

      return finalReport;
    } catch (error) {
      console.error('❌ Ошибка при анализе проекта:', error.message);
      throw error;
    }
  }

  /**
   * Генерирует итоговое резюме вердикта
   */
  generateVerdictSummary(fullReport) {
    const { score, grade, criticalIssues, necessity } = fullReport.verdict;

    let summary = `Проект получил оценку ${grade} (${score}/100 баллов). `;

    if (criticalIssues > 0) {
      summary += `Обнаружено ${criticalIssues} критических проблем. `;
    }

    summary += `Необходимость рефакторинга: ${necessity}. `;

    if (fullReport.verdict.roi.roi > 50) {
      summary += `Рефакторинг высоко рентабелен (ROI: ${fullReport.verdict.roi.roi}%). `;
    }

    summary += `${fullReport.verdict.recommendation}`;

    return summary;
  }

  /**
   * Генерирует план мониторинга
   */
  generateMonitoringPlan(fullReport) {
    const plan = [];

    plan.push({
      metric: 'Общая оценка структуры',
      current: fullReport.verdict.score,
      target: Math.min(95, fullReport.verdict.score + 20),
      frequency: 'еженедельно',
    });

    if (fullReport.verdict.criticalIssues > 0) {
      plan.push({
        metric: 'Критические проблемы',
        current: fullReport.verdict.criticalIssues,
        target: 0,
        frequency: 'ежедневно',
      });
    }

    if (fullReport.analysis.technicalDebt > 0) {
      plan.push({
        metric: 'Технический долг',
        current: fullReport.summary.technicalDebt,
        target: Math.max(0, fullReport.summary.technicalDebt * 0.5),
        frequency: 'еженедельно',
      });
    }

    plan.push({
      metric: 'Покрытие тестами',
      current: 'требует измерения',
      target: '80%+',
      frequency: 'еженедельно',
    });

    return plan;
  }

  /**
   * Генерирует критерии успеха
   */
  generateSuccessCriteria(fullReport) {
    const criteria = [];

    criteria.push(`Достижение оценки A- (80+ баллов)`);

    if (fullReport.verdict.criticalIssues > 0) {
      criteria.push('Устранение всех критических проблем');
    }

    criteria.push('Снижение технического долга на 50%');
    criteria.push('Улучшение сопровождаемости кода до 80+');
    criteria.push('Устранение циклических зависимостей');
    criteria.push('Достижение покрытия тестами 80%+');

    return criteria;
  }

  /**
   * Сохраняет отчет в файл
   */
  async saveReport(report, outputPath) {
    try {
      // Создаем директорию, если не существует
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Сохраняем JSON отчет
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');

      // Сохраняем Markdown дорожную карту
      const markdownPath = outputPath.replace('.json', '-roadmap.md');
      await fs.writeFile(markdownPath, report.roadmap.content, 'utf8');

      console.log(`📄 Отчет сохранен: ${outputPath}`);
      console.log(`📋 Дорожная карта сохранена: ${markdownPath}`);
    } catch (error) {
      console.error('❌ Ошибка при сохранении отчета:', error.message);
    }
  }

  /**
   * Выводит краткое резюме в консоль
   */
  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА СТРУКТУРЫ ПРОЕКТА');
    console.log('='.repeat(60));

    console.log(`\n🎯 ОЦЕНКА: ${report.analysis.grade} (${report.analysis.score}/100)`);
    console.log(`📁 Файлов: ${report.analysis.totalFiles}`);
    console.log(`📝 Строк кода: ${report.analysis.totalLines.toLocaleString()}`);

    if (report.verdict.criticalIssues > 0) {
      console.log(`\n⚠️  КРИТИЧЕСКИЕ ПРОБЛЕМЫ: ${report.verdict.criticalIssues}`);
    }

    console.log(`\n🔧 НЕОБХОДИМОСТЬ РЕФАКТОРИНГА: ${report.roadmap.necessity}`);
    console.log(`⏱️  ОБЩИЕ ЗАТРАТЫ: ${report.roadmap.effort} часов`);
    console.log(
      `💰 ROI: ${report.roadmap.roi.roi}% (окупаемость: ${report.roadmap.roi.paybackPeriod} мес.)`
    );

    console.log('\n📋 ДОРОЖНАЯ КАРТА:');
    console.log(`   • Немедленно (0-2 нед.): ${report.roadmap.phases.immediate.length} задач`);
    console.log(`   • Краткосрочно (2-4 нед.): ${report.roadmap.phases.shortTerm.length} задач`);
    console.log(`   • Долгосрочно (4-8 нед.): ${report.roadmap.phases.longTerm.length} задач`);

    console.log('\n💡 РЕКОМЕНДАЦИЯ:');
    console.log(`   ${report.verdict.recommendation}`);

    console.log('\n🎯 СЛЕДУЮЩИЕ ШАГИ:');
    report.actionPlan.immediate.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });

    console.log('\n' + '='.repeat(60));
  }
}

/**
 * Пример использования
 */
async function exampleUsage() {
  const integration = new EAPStructureIntegration();

  // Анализируем текущий проект
  const projectPath = process.cwd();
  const outputPath = path.join(projectPath, 'reports', 'structure-analysis.json');

  try {
    const report = await integration.analyzeProject(projectPath, outputPath);

    console.log('\n✅ Анализ завершен успешно!');
    console.log(`📊 Оценка: ${report.analysis.grade}`);
    console.log(`🔧 Рефакторинг: ${report.roadmap.necessity}`);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Экспорт для использования в других модулях
export { EAPStructureIntegration, exampleUsage };

// Запуск примера, если файл вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage();
}
