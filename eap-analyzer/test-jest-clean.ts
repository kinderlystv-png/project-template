/**
 * Тест JestCheckerAdapter с SimpleOrchestrator
 */

import { SimpleOrchestrator } from './simple-orchestrator.js';
import { JestCheckerAdapter } from './src/checkers/testing/checkers/JestCheckerAdapter.js';
import { CheckContext } from './src/core/types.js';

async function testJestChecker() {
  console.log('🔍 Тест JestCheckerAdapter интеграции\n');

  try {
    // 1. Создаем SimpleOrchestrator
    console.log('🏗️  Создание SimpleOrchestrator...');
    const orchestrator = new SimpleOrchestrator();

    // 2. Создаем JestCheckerAdapter
    console.log('⚙️  Создание JestCheckerAdapter...');
    const jestChecker = new JestCheckerAdapter();

    // 3. Проверяем базовые свойства чекера
    console.log('\n📋 Информация о JestCheckerAdapter:');
    console.log(`   - Название: ${jestChecker.name}`);
    console.log(`   - Категория: ${jestChecker.category}`);
    console.log(`   - Описание: ${jestChecker.description}`);
    console.log(`   - Приоритет: ${jestChecker.priority}`);

    // 4. Регистрируем чекер
    console.log('\n🔗 Регистрация чекера...');
    orchestrator.registerChecker('jest-testing', jestChecker);

    // 5. Создаем тестовый контекст
    const testContext: CheckContext = {
      projectPath: process.cwd(),
      config: {},
    };

    console.log(`\n📂 Анализируемый проект: ${testContext.projectPath}`);

    // 6. Прямой тест JestCheckerAdapter
    console.log('\n🧪 === ПРЯМОЙ ТЕСТ JestCheckerAdapter ===');
    const startTime = Date.now();
    const result = await jestChecker.check(testContext);
    const endTime = Date.now();

    console.log(`⏱️  Время выполнения: ${endTime - startTime}ms`);
    console.log('\n📊 Результат проверки:');

    // 7. Детальный анализ результата
    const status = result.passed ? '✅ ПРОЙДЕНО' : '❌ НЕ ПРОЙДЕНО';
    console.log(`${status} - ${result.checker}`);
    console.log(`📈 Оценка: ${result.score}/100`);
    console.log(`📝 Сообщение: ${result.message}`);
    console.log(`📂 Категория: ${result.category}`);
    console.log(`⏰ Время: ${result.timestamp.toLocaleTimeString()}`);

    if (result.details) {
      console.log('\n📋 Подробные детали:');
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`   - ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      });
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('\n💡 Рекомендации по улучшению:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // 8. Тест через SimpleOrchestrator
    console.log('\n🎭 === ТЕСТ ЧЕРЕЗ SimpleOrchestrator ===');
    const orchestratorStartTime = Date.now();
    const fullAnalysis = await orchestrator.analyzeProject(testContext.projectPath);
    const orchestratorEndTime = Date.now();

    console.log(
      `⏱️  Время выполнения Orchestrator: ${orchestratorEndTime - orchestratorStartTime}ms`
    );
    console.log(`📋 Количество результатов: ${Object.keys(fullAnalysis.checks).length}`);

    // 9. Анализ результатов от Orchestrator
    const jestResults = Object.entries(fullAnalysis.checks).filter(
      ([key, result]) => result.checker === 'jest-testing' || key === 'jest-testing'
    );

    console.log(`🔧 Результаты JestChecker через Orchestrator: ${jestResults.length}`);

    if (jestResults.length > 0) {
      jestResults.forEach(([key, res]) => {
        const status = res.passed ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${res.message} (${res.score}/100)`);
      });
    }

    // 10. Сравнение результатов
    console.log('\n🔍 === СРАВНЕНИЕ РЕЗУЛЬТАТОВ ===');
    const directScore = result.score;
    const orchestratorResult = jestResults.length > 0 ? jestResults[0][1] : null;
    const orchestratorScore = orchestratorResult ? orchestratorResult.score : null;

    console.log(`   - Прямой вызов: ${directScore}/100`);
    console.log(
      `   - Через Orchestrator: ${orchestratorScore !== null ? orchestratorScore + '/100' : 'N/A'}`
    );

    const scoresMatch = orchestratorScore === directScore;
    console.log(`   - Соответствие результатов: ${scoresMatch ? '✅ Да' : '❌ Нет'}`);

    // 11. Проверка статуса Jest в проекте
    console.log('\n📦 === СТАТУС JEST В ПРОЕКТЕ ===');
    if (result.details) {
      console.log(`   - Jest установлен: ${result.details.hasJest ? '✅ Да' : '❌ Нет'}`);
      console.log(`   - Конфигурация найдена: ${result.details.hasConfig ? '✅ Да' : '❌ Нет'}`);
      console.log(`   - Тестовых файлов: ${result.details.testFileCount || 0}`);
      console.log(
        `   - Test скрипт настроен: ${result.details.hasTestScript ? '✅ Да' : '❌ Нет'}`
      );
      console.log(`   - Coverage настроен: ${result.details.hasCoverage ? '✅ Да' : '❌ Нет'}`);

      if (result.details.testFiles && result.details.testFiles.length > 0) {
        console.log('   - Примеры тестовых файлов:');
        result.details.testFiles.slice(0, 3).forEach((file: string) => {
          console.log(`     • ${file}`);
        });
      }
    }

    // 12. Финальная оценка
    console.log('\n🎯 === ФИНАЛЬНАЯ ОЦЕНКА ===');

    const integrationSuccess = scoresMatch && jestResults.length > 0;
    const projectViability = directScore >= 40; // Минимальный порог

    console.log(`   - Интеграция работает: ${integrationSuccess ? '✅ Да' : '❌ Нет'}`);
    console.log(`   - Проект готов к Jest: ${projectViability ? '✅ Да' : '❌ Нет'}`);

    if (integrationSuccess) {
      console.log('\n🎉 УСПЕХ: JestCheckerAdapter полностью интегрирован!');
      console.log('✅ Готов к добавлению в основную систему EAP v4.0');

      if (projectViability) {
        console.log('✅ Текущий проект имеет хорошую базу для Jest');
      } else {
        console.log('💡 Проект нуждается в настройке Jest согласно рекомендациям');
      }
    } else {
      console.log('\n⚠️  ВНИМАНИЕ: Обнаружены проблемы с интеграцией');
      if (!scoresMatch) console.log('   - Результаты прямого вызова и Orchestrator не совпадают');
      if (jestResults.length === 0)
        console.log('   - Orchestrator не получил результаты от JestChecker');
    }

    return {
      integrationSuccess,
      projectViability,
      score: directScore,
      recommendations: result.recommendations || [],
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

// Запускаем тест
console.log('🚀 Запуск теста JestChecker...\n');
testJestChecker()
  .then(result => {
    console.log('\n📈 ИТОГОВЫЙ РЕЗУЛЬТАТ:');
    console.log(`   - Интеграция: ${result.integrationSuccess ? 'Успешна' : 'Не работает'}`);
    console.log(
      `   - Готовность проекта: ${result.projectViability ? 'Готов' : 'Требует настройки'}`
    );
    console.log(`   - Оценка: ${result.score}/100`);

    if (result.recommendations.length > 0) {
      console.log('   - Основные рекомендации:');
      result.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
      });
    }
  })
  .catch(error => {
    console.error('💥 Необработанная ошибка:', error);
    process.exit(1);
  });
