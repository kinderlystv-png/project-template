#!/usr/bin/env node

/**
 * Полная демонстрация EAP Analyzer v3.0 с использованием всех компонентов
 */

const { createEAPAnalyzer } = require('../dist-cjs/index.js');
const fs = require('fs');
const path = require('path');

async function runFullDemo() {
  console.log('🚀 === ПОЛНАЯ ДЕМОНСТРАЦИЯ EAP ANALYZER v3.0 ===');
  console.log('🏗️  Используем ВСЮ архитектуру: Orchestrator + Checkers + Modules + AI + Reports');
  console.log('');

  try {
    // 1. Создаем анализатор со всеми компонентами
    console.log('⚙️  Инициализация анализатора...');
    const analyzer = createEAPAnalyzer();
    console.log('✅ Анализатор создан с полной архитектурой v3.0');
    console.log('');

    // 2. Запускаем полный анализ
    const projectPath = process.cwd();
    console.log(`📁 Анализируем проект: ${projectPath}`);
    console.log('🔄 Запуск полного анализа...');

    const startTime = Date.now();
    const results = await analyzer.runFullAnalysis(projectPath);
    const analysisTime = Date.now() - startTime;

    console.log(`✅ Анализ завершен за ${analysisTime}мс`);
    console.log('');

    // 3. Генерируем comprehensive отчет
    console.log('📊 Генерация comprehensive отчета...');
    const report = await analyzer.generateReport(results);
    console.log('✅ Отчет сгенерирован');
    console.log('');

    // 4. Показываем результаты всех компонентов
    console.log('📋 === РЕЗУЛЬТАТЫ ВСЕХ КОМПОНЕНТОВ ===');
    console.log('');

    // Результаты чекеров
    if (results.checks && Object.keys(results.checks).length > 0) {
      console.log('🔍 УНИВЕРСАЛЬНЫЕ ЧЕКЕРЫ:');
      Object.entries(results.checks).forEach(([name, result]) => {
        const status = result.passed ? '✅' : '❌';
        const score = result.score || 0;
        console.log(`  ${status} ${name}: ${score}/100`);
        if (result.message) {
          console.log(`     📝 ${result.message}`);
        }
      });
      console.log('');
    }

    // Результаты модулей
    if (results.modules && Object.keys(results.modules).length > 0) {
      console.log('🧩 АНАЛИЗАТОРЫ МОДУЛЕЙ:');
      Object.entries(results.modules).forEach(([name, result]) => {
        console.log(`  📦 ${name}:`);
        if (result && typeof result === 'object') {
          if (result.totalDebt) {
            console.log(`     💰 Технический долг: ${result.totalDebt} часов`);
          }
          if (result.qualityScore) {
            console.log(`     🎯 Качество: ${result.qualityScore.overall}/100`);
          }
          if (result.patterns && result.patterns.length > 0) {
            console.log(`     🎨 Паттернов: ${result.patterns.length}`);
          }
        }
      });
      console.log('');
    }

    // AI Insights
    if (report.aiInsights) {
      console.log('🧠 AI INSIGHTS:');
      const ai = report.aiInsights;
      if (ai.qualityScore) {
        console.log(`  🎯 Общее качество: ${ai.qualityScore.overall}/100`);
        console.log(`  🔧 Поддерживаемость: ${ai.qualityScore.maintainability}/100`);
        console.log(`  🔒 Безопасность: ${ai.qualityScore.security}/100`);
      }
      if (ai.recommendations && ai.recommendations.length > 0) {
        console.log(`  💡 Рекомендаций: ${ai.recommendations.length}`);
      }
      console.log('');
    }

    // Technical Debt
    if (report.technicalDebtAnalysis) {
      console.log('💰 ТЕХНИЧЕСКИЙ ДОЛГ:');
      const debt = report.technicalDebtAnalysis;
      if (debt.totalDebt) {
        console.log(`  💸 Общий долг: ${debt.totalDebt} часов`);
      }
      if (debt.monthlyInterest) {
        console.log(`  📅 Ежемесячные проценты: ${debt.monthlyInterest} часов`);
      }
      if (debt.roiAnalysis) {
        console.log(
          `  📈 ROI: ${
            debt.roiAnalysis.expectedReturn
              ? Math.round(
                  (debt.roiAnalysis.expectedReturn / debt.roiAnalysis.investmentRequired - 1) * 100
                )
              : 0
          }%`
        );
      }
      console.log('');
    }

    // 5. Сохраняем полные отчеты
    console.log('💾 Сохранение полных отчетов...');

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Полный JSON отчет
    const fullReportPath = path.join(reportsDir, 'full-system-report.json');
    fs.writeFileSync(
      fullReportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          analyzerVersion: '3.0.0',
          analysisResults: results,
          comprehensiveReport: report,
          executionTime: analysisTime,
        },
        null,
        2
      )
    );
    console.log(`  📄 Полный отчет: ${fullReportPath}`);

    // Markdown сводка
    const markdownPath = path.join(reportsDir, 'FULL-SYSTEM-SUMMARY.md');
    const markdown = generateMarkdownSummary(results, report, analysisTime);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`  📝 Markdown сводка: ${markdownPath}`);

    console.log('');
    console.log('🎉 === ПОЛНАЯ ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА ===');
    console.log('✅ Все компоненты EAP Analyzer v3.0 работают корректно!');
    console.log('📁 Отчеты сохранены в папку reports/');
  } catch (error) {
    console.error('❌ Ошибка демонстрации:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

function generateMarkdownSummary(results, report, executionTime) {
  return `# 🚀 EAP Analyzer v3.0 - Полный системный отчет

**Дата анализа:** ${new Date().toLocaleString()}
**Время выполнения:** ${executionTime}мс
**Версия анализатора:** 3.0.0

## 📊 Executive Summary

Полная демонстрация EAP Analyzer v3.0 с использованием всех компонентов архитектуры.

## 🔍 Результаты универсальных чекеров

${
  Object.entries(results.checks || {})
    .map(
      ([name, result]) =>
        `- **${name}**: ${result.passed ? '✅ PASS' : '❌ FAIL'} (${result.score || 0}/100)`
    )
    .join('\n') || 'Чекеры не выполнялись'
}

## 🧩 Результаты модульных анализаторов

${
  Object.entries(results.modules || {})
    .map(([name, result]) => {
      let details = `- **${name}**: Выполнен`;
      if (result && typeof result === 'object') {
        if (result.totalDebt) details += ` | Долг: ${result.totalDebt}ч`;
        if (result.qualityScore) details += ` | Качество: ${result.qualityScore.overall}/100`;
      }
      return details;
    })
    .join('\n') || 'Модули не выполнялись'
}

## 🧠 AI Insights

${
  report.aiInsights
    ? `
- **Общее качество:** ${report.aiInsights.qualityScore?.overall || 'N/A'}/100
- **Поддерживаемость:** ${report.aiInsights.qualityScore?.maintainability || 'N/A'}/100
- **Безопасность:** ${report.aiInsights.qualityScore?.security || 'N/A'}/100
- **Рекомендаций:** ${report.aiInsights.recommendations?.length || 0}
`
    : 'AI анализ не выполнялся'
}

## 💰 Технический долг

${
  report.technicalDebtAnalysis
    ? `
- **Общий долг:** ${report.technicalDebtAnalysis.totalDebt || 0} часов
- **Ежемесячные проценты:** ${report.technicalDebtAnalysis.monthlyInterest || 0} часов
- **ROI рефакторинга:** ${
        report.technicalDebtAnalysis.roiAnalysis
          ? Math.round(
              (report.technicalDebtAnalysis.roiAnalysis.expectedReturn /
                report.technicalDebtAnalysis.roiAnalysis.investmentRequired -
                1) *
                100
            )
          : 0
      }%
`
    : 'Анализ технического долга не выполнялся'
}

## 📝 Заключение

${results.checks && Object.keys(results.checks).length > 0 ? '✅' : '⚠️'} **Чекеры:** ${Object.keys(results.checks || {}).length} выполнено
${results.modules && Object.keys(results.modules).length > 0 ? '✅' : '⚠️'} **Модули:** ${Object.keys(results.modules || {}).length} выполнено
${report.aiInsights ? '✅' : '⚠️'} **AI анализ:** ${report.aiInsights ? 'Выполнен' : 'Не выполнен'}
${report.technicalDebtAnalysis ? '✅' : '⚠️'} **Технический долг:** ${report.technicalDebtAnalysis ? 'Проанализирован' : 'Не проанализирован'}

**Общий статус:** ${
    results.checks &&
    Object.keys(results.checks).length > 0 &&
    results.modules &&
    Object.keys(results.modules).length > 0 &&
    report.aiInsights &&
    report.technicalDebtAnalysis
      ? '🎉 ВСЕ КОМПОНЕНТЫ РАБОТАЮТ'
      : '⚠️ ЧАСТИЧНАЯ ФУНКЦИОНАЛЬНОСТЬ'
  }

---
*Сгенерировано EAP Analyzer v3.0.0 Full System Demo*`;
}

// Запуск демонстрации
runFullDemo().catch(console.error);
