/**
 * Полный тест AnalysisOrchestrator с оптимизированным FileStructureAnalyzer v3.2
 * Использует скомпилированные ES-модули
 */

import { AnalysisOrchestrator } from './dist/core/orchestrator.js';

console.log(
  '🔍 Запуск полного анализа проекта kinderly-events через EAP AnalysisOrchestrator...\n'
);

async function runFullAnalysis() {
  try {
    // Создаем оркестратор
    console.log('🚀 Создание оркестратора...');
    const orchestrator = new AnalysisOrchestrator(4);

    // Настройки анализа
    const projectPath = 'C:\\kinderly-events';
    const config = {
      categories: ['STRUCTURE', 'SECURITY', 'PERFORMANCE', 'TESTING', 'TECHNICAL_DEBT'],
      timeout: 180000, // 3 минуты общий таймаут
      checkerTimeout: 30000, // 30 секунд на чекер
      parallel: true,
      detailed: true,
      includeRecommendations: true,
      generateReport: true,
    };

    console.log(`📁 Анализируемый проект: ${projectPath}`);
    console.log(`🔧 Категории анализа: ${config.categories.join(', ')}`);
    console.log(
      `⏱️  Таймаут: ${config.timeout / 1000}с (${config.checkerTimeout / 1000}с на чекер)`
    );
    console.log(`🔄 Параллельное выполнение: ${config.parallel ? 'Включено' : 'Отключено'}\n`);

    // Запускаем полный анализ
    const startTime = Date.now();
    console.log('▶️  Запуск анализа...');

    const result = await orchestrator.analyzeProject(projectPath, config);

    const duration = Date.now() - startTime;
    console.log(`✅ Анализ завершен за ${duration}мс (${(duration / 1000).toFixed(2)}с)\n`);

    // Выводим результаты
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
    console.log('='.repeat(60));

    if (result.summary) {
      console.log(`🎯 Общий счет: ${result.summary.overallScore}/100`);
      console.log(`📈 Качество кода: ${result.summary.codeQuality}/100`);
      console.log(`🛡️  Безопасность: ${result.summary.security}/100`);
      console.log(`⚡ Производительность: ${result.summary.performance}/100`);
      console.log(`🏗️  Архитектура: ${result.summary.architecture}/100`);
      console.log(`🧪 Тестирование: ${result.summary.testing}/100`);
      console.log(`💳 Технический долг: ${result.summary.technicalDebt}/100`);
      console.log(`📏 Сопровождаемость: ${result.summary.maintainability}/100\n`);
    }

    // Детали по категориям
    if (result.categories) {
      console.log('📋 ДЕТАЛИ ПО КАТЕГОРИЯМ:');
      console.log('-'.repeat(40));

      for (const [category, details] of Object.entries(result.categories)) {
        console.log(`\n🔍 ${category}:`);
        console.log(`   Счет: ${details.score}/100`);
        console.log(`   Статус: ${details.status}`);

        if (details.metrics && Object.keys(details.metrics).length > 0) {
          console.log('   Метрики:');
          for (const [metric, value] of Object.entries(details.metrics)) {
            if (typeof value === 'number') {
              console.log(
                `     • ${metric}: ${typeof value === 'number' ? value.toFixed(2) : value}`
              );
            } else {
              console.log(`     • ${metric}: ${value}`);
            }
          }
        }

        if (details.issues && details.issues.length > 0) {
          console.log(`   Проблемы (${details.issues.length}):`);
          details.issues.slice(0, 3).forEach(issue => {
            console.log(`     ⚠️  ${issue.severity}: ${issue.message}`);
          });
          if (details.issues.length > 3) {
            console.log(`     ... и еще ${details.issues.length - 3} проблем`);
          }
        }

        if (details.recommendations && details.recommendations.length > 0) {
          console.log(`   Рекомендации (${details.recommendations.length}):`);
          details.recommendations.slice(0, 2).forEach(rec => {
            console.log(`     💡 ${rec.priority}: ${rec.description}`);
          });
          if (details.recommendations.length > 2) {
            console.log(`     ... и еще ${details.recommendations.length - 2} рекомендаций`);
          }
        }
      }
    }

    // Статистика выполнения
    if (result.executionStats) {
      console.log('\n⏱️  СТАТИСТИКА ВЫПОЛНЕНИЯ:');
      console.log('-'.repeat(30));
      console.log(`Общее время: ${result.executionStats.totalTime}мс`);
      console.log(`Параллельные задачи: ${result.executionStats.parallelTasks || 'N/A'}`);
      console.log(`Использовано кеша: ${result.executionStats.cacheHits || 0} хитов`);

      if (result.executionStats.checkerTimes) {
        console.log('\nВремя по чекерам:');
        for (const [checker, time] of Object.entries(result.executionStats.checkerTimes)) {
          console.log(`  • ${checker}: ${time}мс`);
        }
      }
    }

    // Файлы с проблемами (топ-5)
    if (result.fileIssues && Object.keys(result.fileIssues).length > 0) {
      console.log('\n📁 ФАЙЛЫ С ПРОБЛЕМАМИ (топ-5):');
      console.log('-'.repeat(30));

      const sortedFiles = Object.entries(result.fileIssues)
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 5);

      sortedFiles.forEach(([file, issues]) => {
        console.log(`\n📄 ${file.slice(-50)} (${issues.length} проблем):`);
        issues.slice(0, 2).forEach(issue => {
          console.log(`   ${issue.severity}: ${issue.message}`);
        });
        if (issues.length > 2) {
          console.log(`   ... и еще ${issues.length - 2} проблем`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Анализ успешно завершен!');

    return result;
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error.message);
    console.error('Детали ошибки:');
    console.error(error.stack || error);
    console.error('💥 Тестирование провалено:', error.message);
    throw error;
  }
}

// Запускаем анализ
runFullAnalysis()
  .then(() => {
    console.log('\n✨ Тест завершен успешно!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Тест провалился:', error.message);
    process.exit(1);
  });
