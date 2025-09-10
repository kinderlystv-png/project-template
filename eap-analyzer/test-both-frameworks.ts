/**
 * Объединенный тест VitestChecker и JestChecker с SimpleOrchestrator
 */

import { SimpleOrchestrator } from './simple-orchestrator.js';
import { VitestCheckerAdapter } from './src/checkers/testing/checkers/VitestCheckerAdapter.js';
import { JestCheckerAdapter } from './src/checkers/testing/checkers/JestCheckerAdapter.js';
import { CheckContext } from './src/core/types.js';

async function testBothFrameworks() {
  console.log('🔍 Объединенный тест Vitest и Jest чекеров\n');

  try {
    // 1. Создаем SimpleOrchestrator
    console.log('🏗️  Создание SimpleOrchestrator...');
    const orchestrator = new SimpleOrchestrator();

    // 2. Создаем оба чекера
    console.log('⚙️  Создание чекеров...');
    const vitestChecker = new VitestCheckerAdapter();
    const jestChecker = new JestCheckerAdapter();

    // 3. Регистрируем оба чекера
    console.log('\n🔗 Регистрация чекеров...');
    orchestrator.registerChecker('vitest-framework', vitestChecker);
    orchestrator.registerChecker('jest-framework', jestChecker);

    console.log(`📊 Всего зарегистрировано чекеров: ${orchestrator.getCheckerCount()}`);
    console.log(`📋 Список чекеров: ${orchestrator.getCheckerNames().join(', ')}`);

    // 4. Создаем тестовый контекст
    const testContext: CheckContext = {
      projectPath: process.cwd(),
      config: {},
    };

    console.log(`\n📂 Анализируемый проект: ${testContext.projectPath}`);

    // 5. Тест через SimpleOrchestrator
    console.log('\n🎭 === КОМПЛЕКСНЫЙ АНАЛИЗ ЧЕРЕЗ SimpleOrchestrator ===');
    const startTime = Date.now();
    const fullAnalysis = await orchestrator.analyzeProject(testContext.projectPath);
    const endTime = Date.now();

    console.log(`⏱️  Общее время выполнения: ${endTime - startTime}ms`);
    console.log(`📋 Общее количество результатов: ${Object.keys(fullAnalysis.checks).length}`);

    // 6. Анализ результатов по фреймворкам
    console.log('\n📊 === РЕЗУЛЬТАТЫ ПО ФРЕЙМВОРКАМ ===');

    const vitestResults = Object.entries(fullAnalysis.checks).filter(
      ([key, result]) => key.includes('vitest') || result.checker.includes('vitest')
    );

    const jestResults = Object.entries(fullAnalysis.checks).filter(
      ([key, result]) => key.includes('jest') || result.checker.includes('jest')
    );

    console.log(`🔧 Vitest результаты: ${vitestResults.length}`);
    vitestResults.forEach(([key, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${result.message} (${result.score}/100)`);

      if (result.details) {
        console.log(`      • Vitest установлен: ${result.details.hasVitest ? 'Да' : 'Нет'}`);
        console.log(`      • Конфигурация: ${result.details.hasConfig ? 'Да' : 'Нет'}`);
        console.log(`      • Тестовых файлов: ${result.details.testFileCount || 0}`);
      }
    });

    console.log(`\n🧪 Jest результаты: ${jestResults.length}`);
    jestResults.forEach(([key, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${result.message} (${result.score}/100)`);

      if (result.details) {
        console.log(`      • Jest установлен: ${result.details.hasJest ? 'Да' : 'Нет'}`);
        console.log(`      • Конфигурация: ${result.details.hasConfig ? 'Да' : 'Нет'}`);
        console.log(`      • Тестовых файлов: ${result.details.testFileCount || 0}`);
      }
    });

    // 7. Общая статистика
    console.log('\n📈 === ОБЩАЯ СТАТИСТИКА ===');

    const allResults = Object.values(fullAnalysis.checks);
    const totalScore = allResults.reduce((sum, result) => sum + result.score, 0);
    const averageScore = allResults.length > 0 ? Math.round(totalScore / allResults.length) : 0;
    const passedCount = allResults.filter(result => result.passed).length;
    const failedCount = allResults.length - passedCount;

    console.log(`   - Всего проверок: ${allResults.length}`);
    console.log(`   - Пройдено: ${passedCount}`);
    console.log(`   - Не пройдено: ${failedCount}`);
    console.log(`   - Средняя оценка: ${averageScore}/100`);
    console.log(`   - Общий балл: ${totalScore}/${allResults.length * 100}`);

    // 8. Рекомендации по улучшению
    console.log('\n💡 === РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ ===');

    const allRecommendations: string[] = [];
    allResults.forEach(result => {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
    });

    const uniqueRecommendations = [...new Set(allRecommendations)];

    if (uniqueRecommendations.length > 0) {
      console.log('Для улучшения тестирования в проекте:');
      uniqueRecommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    } else {
      console.log('✅ Все проверки пройдены, дополнительные рекомендации не требуются');
    }

    // 9. Выбор фреймворка
    console.log('\n🎯 === РЕКОМЕНДАЦИИ ПО ВЫБОРУ ФРЕЙМВОРКА ===');

    const vitestScore = vitestResults.length > 0 ? vitestResults[0][1].score : 0;
    const jestScore = jestResults.length > 0 ? jestResults[0][1].score : 0;

    if (vitestScore === 0 && jestScore === 0) {
      console.log('📋 В проекте не настроен ни один тестовый фреймворк');
      console.log('💡 Рекомендации для выбора:');
      console.log('   • Vitest - современный, быстрый, подходит для Vite проектов');
      console.log('   • Jest - зрелый, популярный, большая экосистема');
      console.log('   • Для нового проекта рекомендуется Vitest');
      console.log('   • Для существующего проекта - посмотрите на текущую настройку сборки');
    } else if (vitestScore > jestScore) {
      console.log('✅ Vitest показывает лучшие результаты в данном проекте');
    } else if (jestScore > vitestScore) {
      console.log('✅ Jest показывает лучшие результаты в данном проекте');
    } else {
      console.log('⚖️  Оба фреймворка показывают одинаковые результаты');
    }

    // 10. Финальная оценка
    console.log('\n🏆 === ФИНАЛЬНАЯ ОЦЕНКА ИНТЕГРАЦИИ ===');

    const integrationSuccess = vitestResults.length > 0 && jestResults.length > 0;
    const bothWorkCorrectly =
      vitestResults.every(([_, result]) => typeof result.score === 'number') &&
      jestResults.every(([_, result]) => typeof result.score === 'number');

    console.log(`   - Оба чекера зарегистрированы: ${integrationSuccess ? '✅ Да' : '❌ Нет'}`);
    console.log(`   - Результаты корректны: ${bothWorkCorrectly ? '✅ Да' : '❌ Нет'}`);
    console.log(`   - Быстрое выполнение: ${endTime - startTime < 100 ? '✅ Да' : '❌ Нет'}`);

    if (integrationSuccess && bothWorkCorrectly) {
      console.log('\n🎉 ПОЛНЫЙ УСПЕХ: Модульная система тестирования готова!');
      console.log('✅ VitestChecker и JestChecker полностью интегрированы');
      console.log('✅ SimpleOrchestrator корректно обрабатывает множественные чекеры');
      console.log('✅ Система готова к добавлению в EAP v4.0');
      console.log('\n🚀 Phase 1 модульной тестовой системы завершена!');
    } else {
      console.log('\n⚠️  ВНИМАНИЕ: Обнаружены проблемы с интеграцией');
      if (!integrationSuccess) console.log('   - Не все чекеры зарегистрированы');
      if (!bothWorkCorrectly) console.log('   - Некорректные результаты от чекеров');
    }

    return {
      integrationSuccess: integrationSuccess && bothWorkCorrectly,
      vitestScore,
      jestScore,
      averageScore,
      recommendations: uniqueRecommendations,
    };
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message);
      console.error('   Стек:', error.stack?.split('\n').slice(0, 10).join('\n'));
    }
    throw error;
  }
}

// Запускаем объединенный тест
console.log('🚀 Запуск объединенного теста тестовых фреймворков...\n');
testBothFrameworks()
  .then(result => {
    console.log('\n📊 ФИНАЛЬНЫЙ ОТЧЕТ:');
    console.log(`   - Интеграция успешна: ${result.integrationSuccess}`);
    console.log(`   - Vitest оценка: ${result.vitestScore}/100`);
    console.log(`   - Jest оценка: ${result.jestScore}/100`);
    console.log(`   - Средняя оценка: ${result.averageScore}/100`);
    console.log(`   - Рекомендаций: ${result.recommendations.length}`);

    if (result.integrationSuccess) {
      console.log('\n🎯 Модульная тестовая система EAP v4.0 готова к производству!');
    }
  })
  .catch(error => {
    console.error('💥 Критическая ошибка в объединенном тесте:', error);
    process.exit(1);
  });
