#!/usr/bin/env node

/**
 * Тестовый скрипт для запуска полного анализа проекта kinderly-events
 * Использует AnalysisOrchestrator для координации всех анализаторов включая FileStructureAnalyzer v3.0
 */

const path = require('path');
const fs = require('fs');

async function testKinderlyAnalysis() {
  console.log(
    '🔍 Запуск полного анализа проекта kinderly-events через EAP AnalysisOrchestrator...\n'
  );

  try {
    // Импортируем AnalysisOrchestrator
    const { AnalysisOrchestrator } = require('./dist-cjs/core/orchestrator.js');

    // Создаем экземпляр оркестратора
    const orchestrator = new AnalysisOrchestrator();

    // Путь к проекту kinderly-events
    const projectPath = 'C:\\kinderly-events';

    // Проверяем существование проекта
    if (!fs.existsSync(projectPath)) {
      console.log(`❌ Проект не найден: ${projectPath}`);
      console.log('📝 Проверьте, что папка kinderly-events существует');
      return;
    }

    console.log(`📂 Анализируемый проект: ${projectPath}`);

    // Конфигурация анализа
    const analysisRequest = {
      projectPath: projectPath,
      config: {
        enabledCategories: [
          'STRUCTURE', // FileStructureAnalyzer v3.0
          'SECURITY', // SecurityChecker
          'PERFORMANCE', // PerformanceChecker
          'TESTING', // TestingChecker
          'TECHNICAL_DEBT', // TechnicalDebtAnalyzer
        ],
        analyzerTimeout: 30000, // 30 секунд на анализатор
        totalTimeout: 180000, // 3 минуты общий таймаут
        parallelExecution: true, // Параллельное выполнение
        continueOnError: true, // Продолжать при ошибках
        verbosity: 'normal',
      },
    };

    console.log('⚙️  Конфигурация анализа:');
    console.log(`   - Категории: ${analysisRequest.config.enabledCategories.join(', ')}`);
    console.log(`   - Таймаут анализатора: ${analysisRequest.config.analyzerTimeout}ms`);
    console.log(`   - Общий таймаут: ${analysisRequest.config.totalTimeout}ms`);
    console.log(`   - Параллельное выполнение: ${analysisRequest.config.parallelExecution}`);
    console.log('');

    // Запускаем полный анализ
    console.log('🚀 Запуск AnalysisOrchestrator.runFullAnalysis()...');
    const startTime = Date.now();

    const result = await orchestrator.runFullAnalysis(analysisRequest);

    const duration = Date.now() - startTime;
    console.log(`✅ Анализ завершен за ${duration}ms\n`);

    // Выводим результаты
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
    console.log('='.repeat(50));
    console.log(`📋 ID анализа: ${result.analysisId}`);
    console.log(`📂 Проект: ${result.projectName}`);
    console.log(`📅 Время: ${new Date(result.timestamp).toLocaleString()}`);
    console.log(`⏱️  Время выполнения: ${result.totalExecutionTime}ms`);
    console.log(`🎯 Общий балл: ${result.overallScore}/${result.maxOverallScore}`);
    console.log(`📈 Статус: ${result.status}`);
    console.log('');

    // Детали по категориям
    console.log('📊 РЕЗУЛЬТАТЫ ПО КАТЕГОРИЯМ:');
    console.log('-'.repeat(40));

    if (result.categoryResults && result.categoryResults.length > 0) {
      result.categoryResults.forEach(category => {
        console.log(`\n🔹 ${category.category}:`);
        console.log(`   Балл: ${category.score}/${category.maxScore}`);
        console.log(`   Статус: ${category.status}`);
        console.log(`   Время: ${category.executionTime}ms`);

        if (category.checkResults && category.checkResults.length > 0) {
          console.log(`   Проверки: ${category.checkResults.length}`);
          category.checkResults.forEach(check => {
            const status = check.status === 'passed' ? '✅' : '❌';
            console.log(`     ${status} ${check.name}`);
          });
        }
      });
    }

    // Резюме
    console.log('\n📈 РЕЗЮМЕ:');
    console.log('-'.repeat(30));
    if (result.summary) {
      console.log(`✅ Пройдено проверок: ${result.summary.passedChecks || 0}`);
      console.log(`❌ Провалено проверок: ${result.summary.failedChecks || 0}`);
      console.log(`🔴 Критические проблемы: ${result.summary.criticalIssues || 0}`);
      console.log(`🟡 Высокий приоритет: ${result.summary.highPriorityIssues || 0}`);
      console.log(`🔵 Средний приоритет: ${result.summary.mediumPriorityIssues || 0}`);
      console.log(`🟢 Низкий приоритет: ${result.summary.lowPriorityIssues || 0}`);
    }

    // Сохраняем отчет
    const reportPath = path.join(__dirname, 'reports', `kinderly-analysis-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Полный отчет сохранен: ${reportPath}`);

    // Специально проверяем FileStructureAnalyzer v3.0
    console.log('\n🔍 СПЕЦИАЛЬНАЯ ПРОВЕРКА FileStructureAnalyzer v3.0:');
    console.log('='.repeat(55));

    const structureCategory = result.categoryResults?.find(
      cat => cat.category === 'STRUCTURE' || cat.category.includes('STRUCTURE')
    );

    if (structureCategory) {
      console.log(`✅ FileStructureAnalyzer найден в результатах!`);
      console.log(`   Балл: ${structureCategory.score}/${structureCategory.maxScore}`);
      console.log(`   Статус: ${structureCategory.status}`);
      console.log(`   Время выполнения: ${structureCategory.executionTime}ms`);

      if (structureCategory.checkResults) {
        console.log(`   Проведено проверок: ${structureCategory.checkResults.length}`);
        structureCategory.checkResults.forEach(check => {
          console.log(`     - ${check.name}: ${check.status}`);
        });
      }
    } else {
      console.log(`⚠️  FileStructureAnalyzer не найден в результатах`);
      console.log(
        `   Доступные категории: ${result.categoryResults?.map(c => c.category).join(', ')}`
      );
    }

    return result;
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error);
    console.error('\nДетали ошибки:');
    console.error(error.stack);
    throw error;
  }
}

// Запуск, если файл вызван напрямую
if (require.main === module) {
  testKinderlyAnalysis()
    .then(result => {
      console.log('\n🎉 Тестирование завершено успешно!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Тестирование провалено:', error.message);
      process.exit(1);
    });
}

module.exports = { testKinderlyAnalysis };
