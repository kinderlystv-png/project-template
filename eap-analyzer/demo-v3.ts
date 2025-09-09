/**
 * Демонстрация нового архитектурного движка EAP Analyzer v3.0
 * Полный анализ с комплексными отчетами и дорожной картой
 */

import { AnalysisOrchestrator } from './src/core/orchestrator.js';
import { SecurityChecker } from './src/checkers/security-checker.js';
import { PerformanceChecker } from './src/checkers/performance-checker.js';
import { CodeQualityChecker } from './src/checkers/code-quality-checker.js';
import { TestingChecker } from './src/checkers/testing-checker.js';
import { EMTAnalyzer } from './src/modules/emt/emt-analyzer.js';
import { DockerAnalyzer } from './src/modules/docker/docker-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Главная функция демонстрации
 */
async function demonstrateV3Architecture() {
  console.log('🎯 === EAP ANALYZER v3.0 - КОМПЛЕКСНАЯ ДЕМОНСТРАЦИЯ ===\n');

  // 1. Создание оркестратора с параллельным выполнением
  console.log('⚙️ Инициализация оркестратора...');
  const orchestrator = new AnalysisOrchestrator(6); // 6 параллельных процессов

  // 2. Регистрация универсальных чекеров
  console.log('🔧 Регистрация универсальных чекеров...');
  orchestrator.registerChecker('security', new SecurityChecker());
  orchestrator.registerChecker('performance', new PerformanceChecker());
  orchestrator.registerChecker('codeQuality', new CodeQualityChecker());
  orchestrator.registerChecker('testing', new TestingChecker());

  // 3. Регистрация специализированных модулей
  console.log('📦 Регистрация модулей анализа...');
  orchestrator.registerModule('emt', new EMTAnalyzer());
  orchestrator.registerModule('docker', new DockerAnalyzer());

  console.log('✅ Архитектура готова к работе!\n');

  // 4. Анализ текущего проекта
  const projectPath = process.cwd();
  console.log(`🚀 Запуск анализа проекта: ${projectPath}`);
  console.log('📊 Используется кеширование и параллельное выполнение\n');

  try {
    // Полный анализ с отчетом
    const { analysis, report } = await orchestrator.analyzeProjectWithReport(projectPath);

    // 5. Вывод краткой сводки
    console.log('\n📋 === КРАТКАЯ СВОДКА АНАЛИЗА ===');
    console.log(`🎯 Общая оценка: ${analysis.summary.overallScore}/100`);
    console.log(`📊 Статус: ${analysis.summary.status}`);
    console.log(
      `✅ Успешных проверок: ${analysis.summary.passedChecks}/${analysis.summary.totalChecks}`
    );
    console.log(`🚨 Критических проблем: ${analysis.summary.criticalIssues.length}`);

    // 6. Категории
    console.log('\n📈 === ОЦЕНКИ ПО КАТЕГОРИЯМ ===');
    Object.entries(analysis.summary.categories).forEach(([category, data]) => {
      const emoji = getEmoji(data.score);
      console.log(`${emoji} ${category}: ${data.score}/100 (${data.passed}/${data.checks})`);
    });

    // 7. Дорожная карта
    console.log('\n🗺️ === ДОРОЖНАЯ КАРТА УЛУЧШЕНИЙ ===');
    if (report.roadmap.immediate.length > 0) {
      console.log(`🚨 Критические задачи (${report.roadmap.immediate.length}):`);
      report.roadmap.immediate.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.message} (${item.estimatedEffort?.days || 1} дней)`);
      });
    }

    if (report.roadmap.shortTerm.length > 0) {
      console.log(`⚡ Важные задачи (${report.roadmap.shortTerm.length}):`);
      report.roadmap.shortTerm.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.message} (${item.estimatedEffort?.days || 1} дней)`);
      });
    }

    // 8. Временная оценка
    console.log('\n⏱️ === ВРЕМЕННЫЕ ЗАТРАТЫ ===');
    console.log(`📅 Общее время: ${report.roadmap.estimatedEffort.days} дней`);
    console.log(`💰 Стоимость: $${report.roadmap.estimatedEffort.cost.toLocaleString()}`);

    console.log('\n🎯 Фазы выполнения:');
    report.roadmap.timeline.phases.forEach((phase, i) => {
      console.log(`   ${i + 1}. ${phase.name}: ${phase.duration} дней`);
    });

    // 9. Топ рекомендации
    console.log('\n💡 === ТОП РЕКОМЕНДАЦИИ ===');
    const topRecommendations = report.recommendations
      .filter(r => r.priority === 'critical' || r.priority === 'high')
      .slice(0, 5);

    topRecommendations.forEach((rec, i) => {
      const priorityEmoji = rec.priority === 'critical' ? '🚨' : '⚡';
      console.log(`${priorityEmoji} ${i + 1}. ${rec.text}`);
    });

    // 10. Статистика выполнения
    console.log('\n📊 === СТАТИСТИКА ВЫПОЛНЕНИЯ ===');
    console.log(`⏱️ Время анализа: ${analysis.metadata.duration}мс`);
    console.log(`🔧 Использовано модулей: ${analysis.metadata.modulesUsed.length}`);
    console.log(`✅ Использовано чекеров: ${analysis.metadata.checkersUsed.length}`);
    console.log(`🗂️ Версия архитектуры: ${analysis.metadata.version}`);

    // 11. Сохранение отчетов
    await saveReports(analysis, report);

    console.log('\n🎉 === ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА ===');
    console.log('📁 Отчеты сохранены в директории ./reports/');
    console.log('🔍 Архитектура v3.0 готова к продуктивному использованию!');
  } catch (error) {
    console.error('❌ Ошибка при выполнении анализа:', error);
    process.exit(1);
  }
}

/**
 * Получить эмодзи для оценки
 */
function getEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 80) return '🟡';
  if (score >= 60) return '🟠';
  return '🔴';
}

/**
 * Сохранить отчеты в файлы
 */
async function saveReports(analysis: any, report: any): Promise<void> {
  const reportsDir = './reports';

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

  // Детальный анализ
  const analysisPath = path.join(reportsDir, `analysis-${timestamp}.json`);
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));

  // Комплексный отчет
  const reportPath = path.join(reportsDir, `comprehensive-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Краткая сводка
  const summaryPath = path.join(reportsDir, `summary-${timestamp}.md`);
  const summaryContent = generateMarkdownSummary(analysis, report);
  fs.writeFileSync(summaryPath, summaryContent);

  console.log(`💾 Отчеты сохранены:`);
  console.log(`   📊 ${analysisPath}`);
  console.log(`   📋 ${reportPath}`);
  console.log(`   📝 ${summaryPath}`);
}

/**
 * Генерация краткой сводки в Markdown
 */
function generateMarkdownSummary(analysis: any, report: any): string {
  const { summary, metadata } = analysis;

  return `# EAP Analyzer v3.0 - Отчет о проекте

## 📊 Общая информация
- **Оценка**: ${summary.overallScore}/100
- **Статус**: ${summary.status}
- **Проверок выполнено**: ${summary.passedChecks}/${summary.totalChecks}
- **Критических проблем**: ${summary.criticalIssues.length}
- **Время анализа**: ${metadata.duration}мс

## 📈 Оценки по категориям
${Object.entries(summary.categories)
  .map(
    ([cat, data]: [string, any]) =>
      `- **${cat}**: ${data.score}/100 (${data.passed}/${data.checks})`
  )
  .join('\n')}

## 🗺️ Дорожная карта
### Критические задачи (${report.roadmap.immediate.length})
${report.roadmap.immediate
  .slice(0, 5)
  .map(
    (item: any, i: number) => `${i + 1}. ${item.message} (${item.estimatedEffort?.days || 1} дней)`
  )
  .join('\n')}

### Важные задачи (${report.roadmap.shortTerm.length})
${report.roadmap.shortTerm
  .slice(0, 5)
  .map(
    (item: any, i: number) => `${i + 1}. ${item.message} (${item.estimatedEffort?.days || 1} дней)`
  )
  .join('\n')}

## ⏱️ Временные затраты
- **Общее время**: ${report.roadmap.estimatedEffort.days} дней
- **Стоимость**: $${report.roadmap.estimatedEffort.cost.toLocaleString()}

### Фазы выполнения
${report.roadmap.timeline.phases
  .map((phase: any, i: number) => `${i + 1}. ${phase.name}: ${phase.duration} дней`)
  .join('\n')}

## 💡 Топ рекомендации
${report.recommendations
  .slice(0, 10)
  .map((rec: any, i: number) => `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.text}`)
  .join('\n')}

---
*Отчет сгенерирован EAP Analyzer v3.0 - ${new Date().toISOString()}*
`;
}

// Запуск демонстрации
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateV3Architecture().catch(console.error);
}

export { demonstrateV3Architecture };
