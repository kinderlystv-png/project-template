/**
 * Простой тест интеграции VitestCheckerAdapter с AnalysisOrchestrator
 */

import { AnalysisOrchestrator } from './src/core/orchestrator.js';
import { VitestCheckerAdapter } from './src/checkers/testing/checkers/VitestCheckerAdapter.js';
import { CheckContext } from './src/core/types.js';

async function simpleVitestTest() {
  console.log('🔍 Простой тест VitestCheckerAdapter интеграции\n');

  try {
    // 1. Создаем минимальный AnalysisOrchestrator без модулей
    console.log('🏗️  Создание AnalysisOrchestrator...');
    const orchestrator = new AnalysisOrchestrator(1); // 1 поток

    // 2. Создаем и тестируем VitestCheckerAdapter
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
    orchestrator.registerChecker('vitest-adapter', vitestChecker);

    // 5. Создаем тестовый контекст
    const testContext: CheckContext = {
      projectPath: process.cwd(),
      config: {},
    };

    // 6. Прямой тест VitestCheckerAdapter
    console.log('\n🧪 Прямой тест VitestCheckerAdapter...');
    const startTime = Date.now();
    const result = await vitestChecker.check(testContext);
    const endTime = Date.now();

    console.log(`⏱️  Время выполнения: ${endTime - startTime}ms`);
    console.log('\n📊 Результат проверки:');

    // 7. Анализ результата
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.checker} (оценка: ${result.score}/100)`);
    console.log(`📝 ${result.message}`);
    console.log(`📂 Категория: ${result.category}`);
    console.log(`⏰ Время: ${result.timestamp.toLocaleTimeString()}`);

    if (result.details) {
      console.log('� Детали:');
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`   - ${key}: ${JSON.stringify(value)}`);
      });
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('💡 Рекомендации:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // 8. Проверка корректности BaseChecker наследования
    console.log('\n🔍 Проверка BaseChecker наследования:');

    const hasRequiredMethods = [
      typeof vitestChecker.check === 'function',
      typeof vitestChecker.isApplicable === 'function',
      typeof vitestChecker['createResult'] === 'function',
    ];

    console.log(`   - Метод check(): ${hasRequiredMethods[0] ? '✅' : '❌'}`);
    console.log(`   - Метод isApplicable(): ${hasRequiredMethods[1] ? '✅' : '❌'}`);
    console.log(`   - Метод createResult(): ${hasRequiredMethods[2] ? '✅' : '❌'}`);

    // 9. Проверка формата результата
    console.log('\n📋 Проверка формата результата:');

    const correctFormat =
      typeof result.checker === 'string' &&
      typeof result.category === 'string' &&
      typeof result.passed === 'boolean' &&
      typeof result.score === 'number' &&
      typeof result.message === 'string' &&
      result.timestamp instanceof Date;

    console.log(`   - Все поля корректны: ${correctFormat ? '✅' : '❌'}`);
    console.log(
      `   - Оценка в диапазоне 0-100: ${result.score >= 0 && result.score <= 100 ? '✅' : '❌'}`
    );

    // 10. Тест через AnalysisOrchestrator
    console.log('\n🎭 Тестирование через AnalysisOrchestrator...');
    const fullAnalysis = await orchestrator.analyzeProject(testContext.projectPath, false);

    console.log(`📋 Общее количество результатов: ${Object.keys(fullAnalysis.checks).length}`);

    // Фильтруем результаты от VitestChecker
    const vitestResults = Object.entries(fullAnalysis.checks).filter(
      ([key, result]) => result.checker === 'vitest-adapter' || result.checker === 'vitest-checker'
    );

    console.log(`🔧 Результаты от VitestChecker: ${vitestResults.length}`);
    vitestResults.forEach(([key, res], index) => {
      const status = res.passed ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${res.checker} (${res.score}/100)`);
      console.log(`      ${res.message}`);
    }); // 11. Проверяем совместимость результатов
    console.log('\n📊 Анализ совместимости:');
    console.log(`   - Прямой вызов: результат получен`);
    console.log(`   - Через Orchestrator: ${vitestResults.length} результатов`);

    const compatible = vitestResults.length > 0;
    console.log(`   - Совместимость: ${compatible ? '✅ Да' : '❌ Нет'}`);

    // 12. Финальная проверка
    if (correctFormat && hasRequiredMethods.every(Boolean) && compatible) {
      console.log('\n🎉 УСПЕХ: VitestCheckerAdapter корректно работает с AnalysisOrchestrator!');
      console.log('✅ Интеграция готова к использованию');

      // Показываем краткую статистику
      console.log('\n📈 Краткая статистика:');
      console.log(`   - Vitest обнаружен: ${result.details?.hasVitest ? 'Да' : 'Нет'}`);
      console.log(`   - Конфигурация найдена: ${result.details?.hasConfig ? 'Да' : 'Нет'}`);
      console.log(`   - Тестовых файлов: ${result.details?.testFileCount || 0}`);
      console.log(`   - Test скрипт: ${result.details?.hasTestScript ? 'Да' : 'Нет'}`);
      console.log(`   - Общая оценка: ${result.score}/100`);
    } else {
      console.log('\n⚠️  ВНИМАНИЕ: Обнаружены проблемы с интеграцией');
      if (!correctFormat) console.log('   - Неправильный формат результата');
      if (!hasRequiredMethods.every(Boolean)) console.log('   - Отсутствуют требуемые методы');
      if (!compatible) console.log('   - Проблемы с совместимостью AnalysisOrchestrator');
    }
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error);
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message);
      console.error('   Стек:', error.stack?.split('\n').slice(0, 5).join('\n'));
    }
  }
}

// Запускаем простой тест
simpleVitestTest().catch(console.error);
