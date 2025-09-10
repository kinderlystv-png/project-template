/**
 * Чистый тест VitestCheckerAdapter с SimpleOrchestrator (без AI модулей)
 */

import { SimpleOrchestrator } from './simple-orchestrator.js';
import { VitestCheckerAdapter } from './src/checkers/testing/checkers/VitestCheckerAdapter.js';
import { CheckContext } from './src/core/types.js';

async function cleanVitestTest() {
  console.log('🔍 Чистый тест VitestCheckerAdapter (без AI)\n');

  try {
    // 1. Создаем SimpleOrchestrator без AI модулей
    console.log('🏗️  Создание SimpleOrchestrator...');
    const orchestrator = new SimpleOrchestrator();

    // 2. Создаем VitestCheckerAdapter
    console.log('⚙️  Создание VitestCheckerAdapter...');
    const vitestChecker = new VitestCheckerAdapter();

    // 3. Проверяем базовые свойства чекера
    console.log('\n📋 Информация о VitestCheckerAdapter:');
    console.log(`   - Название: ${vitestChecker.name}`);
    console.log(`   - Категория: ${vitestChecker.category}`);
    console.log(`   - Описание: ${vitestChecker.description}`);
    console.log(`   - Приоритет: ${vitestChecker.priority}`);

    // 4. Регистрируем чекер
    console.log('\n🔗 Регистрация чекера...');
    orchestrator.registerChecker('vitest-testing', vitestChecker);

    // 5. Создаем тестовый контекст
    const testContext: CheckContext = {
      projectPath: process.cwd(),
      config: {},
    };

    console.log(`\n📂 Анализируемый проект: ${testContext.projectPath}`);

    // 6. Прямой тест VitestCheckerAdapter
    console.log('\n🧪 === ПРЯМОЙ ТЕСТ VitestCheckerAdapter ===');
    const startTime = Date.now();
    const result = await vitestChecker.check(testContext);
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
    const vitestResults = Object.entries(fullAnalysis.checks).filter(
      ([key, result]) => result.checker === 'vitest-testing' || key === 'vitest-testing'
    );

    console.log(`🔧 Результаты VitestChecker через Orchestrator: ${vitestResults.length}`);

    if (vitestResults.length > 0) {
      vitestResults.forEach(([key, res]) => {
        const status = res.passed ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${res.message} (${res.score}/100)`);
      });
    }

    // 10. Сравнение результатов
    console.log('\n🔍 === СРАВНЕНИЕ РЕЗУЛЬТАТОВ ===');
    const directScore = result.score;
    const orchestratorResult = vitestResults.length > 0 ? vitestResults[0][1] : null;
    const orchestratorScore = orchestratorResult ? orchestratorResult.score : null;

    console.log(`   - Прямой вызов: ${directScore}/100`);
    console.log(
      `   - Через Orchestrator: ${orchestratorScore !== null ? orchestratorScore + '/100' : 'N/A'}`
    );

    const scoresMatch = orchestratorScore === directScore;
    console.log(`   - Соответствие результатов: ${scoresMatch ? '✅ Да' : '❌ Нет'}`);

    // 11. Проверка статуса Vitest в проекте
    console.log('\n📦 === СТАТУС VITEST В ПРОЕКТЕ ===');
    if (result.details) {
      console.log(`   - Vitest установлен: ${result.details.hasVitest ? '✅ Да' : '❌ Нет'}`);
      console.log(`   - Конфигурация найдена: ${result.details.hasConfig ? '✅ Да' : '❌ Нет'}`);
      console.log(`   - Тестовых файлов: ${result.details.testFileCount || 0}`);
      console.log(
        `   - Test скрипт настроен: ${result.details.hasTestScript ? '✅ Да' : '❌ Нет'}`
      );

      if (result.details.testFiles && result.details.testFiles.length > 0) {
        console.log('   - Примеры тестовых файлов:');
        result.details.testFiles.slice(0, 3).forEach((file: string) => {
          console.log(`     • ${file}`);
        });
      }
    }

    // 12. Финальная оценка
    console.log('\n🎯 === ФИНАЛЬНАЯ ОЦЕНКА ===');

    const integrationSuccess = scoresMatch && vitestResults.length > 0;
    const projectViability = directScore >= 40; // Минимальный порог

    console.log(`   - Интеграция работает: ${integrationSuccess ? '✅ Да' : '❌ Нет'}`);
    console.log(`   - Проект готов к Vitest: ${projectViability ? '✅ Да' : '❌ Нет'}`);

    if (integrationSuccess) {
      console.log('\n🎉 УСПЕХ: VitestCheckerAdapter полностью интегрирован!');
      console.log('✅ Готов к добавлению в основную систему EAP v4.0');

      if (projectViability) {
        console.log('✅ Текущий проект имеет хорошую базу для Vitest');
      } else {
        console.log('💡 Проект нуждается в настройке Vitest согласно рекомендациям');
      }
    } else {
      console.log('\n⚠️  ВНИМАНИЕ: Обнаружены проблемы с интеграцией');
      if (!scoresMatch) console.log('   - Результаты прямого вызова и Orchestrator не совпадают');
      if (vitestResults.length === 0)
        console.log('   - Orchestrator не получил результаты от VitestChecker');
    }
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message);
      console.error('   Стек:', error.stack?.split('\n').slice(0, 10).join('\n'));
    }
    process.exit(1);
  }
}

// Запускаем чистый тест
console.log('🚀 Запуск чистого теста VitestChecker без AI модулей...\n');
cleanVitestTest().catch(error => {
  console.error('💥 Необработанная ошибка:', error);
  process.exit(1);
});
