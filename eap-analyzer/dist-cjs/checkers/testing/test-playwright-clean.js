'use strict';
/**
 * Тест PlaywrightCheckerAdapter - анализатор E2E тестирования с Playwright
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.testPlaywrightChecker = testPlaywrightChecker;
const PlaywrightCheckerAdapter_js_1 = require('./checkers/PlaywrightCheckerAdapter.js');
const SimpleOrchestrator_js_1 = require('./SimpleOrchestrator.js');
/**
 * Тестирует PlaywrightCheckerAdapter напрямую и через SimpleOrchestrator
 */
async function testPlaywrightChecker() {
  console.log('\n🎭 Тестирование PlaywrightCheckerAdapter...\n');
  const projectPath = 'C:/alphacore/project-template';
  const checker = new PlaywrightCheckerAdapter_js_1.PlaywrightCheckerAdapter();
  // Создаем контекст для тестирования
  const context = {
    projectPath,
    additionalData: {},
  };
  let directResult;
  let orchestratorResult;
  // Тест 1: Прямой вызов анализатора
  console.log('🧪 Тест 1: Прямой вызов PlaywrightCheckerAdapter');
  try {
    const result = await checker.check(context);
    directResult = {
      name: 'PlaywrightChecker Direct',
      passed: result.passed,
      score: result.score,
      message: result.message,
      details: result.details,
      recommendations: result.recommendations,
    };
    console.log(`✅ Результат: ${result.passed ? 'УСПЕХ' : 'НЕУДАЧА'}`);
    console.log(`📊 Оценка: ${result.score}/100`);
    console.log(`📝 Сообщение: ${result.message}`);
    if (result.details) {
      console.log('📋 Детали:');
      console.log(`   • Конфигурация найдена: ${result.details.configFound ? 'да' : 'нет'}`);
      if (result.details.configFound) {
        console.log(`   • Файл конфигурации: ${result.details.configPath}`);
        console.log(`   • Директория тестов: ${result.details.testDir || 'не указана'}`);
        console.log(`   • Количество тестов: ${result.details.testsFound}`);
        console.log(`   • Браузеры: ${result.details.browsers?.join(', ') || 'не указаны'}`);
        console.log(`   • Отчеты настроены: ${result.details.hasReports ? 'да' : 'нет'}`);
        console.log(`   • Параллельность: ${result.details.parallelConfig ? 'да' : 'нет'}`);
        console.log(`   • Retry механизм: ${result.details.retryConfig ? 'да' : 'нет'}`);
      } else {
        console.log(`   • Причина: ${result.details.reason}`);
        if (result.details.searchedPaths) {
          console.log(`   • Искали: ${result.details.searchedPaths.join(', ')}`);
        }
      }
    }
    if (result.recommendations && result.recommendations.length > 0) {
      console.log('💡 Рекомендации:');
      result.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
  } catch (error) {
    directResult = {
      name: 'PlaywrightChecker Direct',
      passed: false,
      score: 0,
      message: `Ошибка: ${error instanceof Error ? error.message : String(error)}`,
    };
    console.log(`❌ Ошибка при прямом вызове: ${directResult.message}`);
  }
  console.log('\n' + '─'.repeat(60) + '\n');
  // Тест 2: Вызов через SimpleOrchestrator
  console.log('🧪 Тест 2: Вызов через SimpleOrchestrator');
  try {
    const orchestrator = new SimpleOrchestrator_js_1.SimpleOrchestrator();
    // Регистрируем только PlaywrightChecker
    orchestrator.registerChecker('playwright-checker', checker);
    console.log('📋 Зарегистрированные чекеры:', orchestrator.getRegisteredCheckers());
    const result = await orchestrator.analyzeProject(projectPath);
    if (Object.keys(result.checks).length === 0) {
      orchestratorResult = {
        name: 'PlaywrightChecker Orchestrator',
        passed: false,
        score: 0,
        message: 'Результаты не получены от оркестратора',
      };
    } else {
      const checkResult = result.checks['playwright-checker'];
      orchestratorResult = {
        name: 'PlaywrightChecker Orchestrator',
        passed: checkResult.passed,
        score: checkResult.score,
        message: checkResult.message,
        details: checkResult.details,
        recommendations: checkResult.recommendations,
      };
    }
    console.log(`✅ Результат: ${orchestratorResult.passed ? 'УСПЕХ' : 'НЕУДАЧА'}`);
    console.log(`📊 Оценка: ${orchestratorResult.score}/100`);
    console.log(`📝 Сообщение: ${orchestratorResult.message}`);
    if (orchestratorResult.details) {
      console.log('📋 Детали через оркестратор:');
      console.log(
        `   • Конфигурация найдена: ${orchestratorResult.details.configFound ? 'да' : 'нет'}`
      );
      if (orchestratorResult.details.configFound) {
        console.log(`   • Количество тестов: ${orchestratorResult.details.testsFound}`);
        console.log(
          `   • Браузеры: ${orchestratorResult.details.browsers?.join(', ') || 'не указаны'}`
        );
      }
    }
  } catch (error) {
    orchestratorResult = {
      name: 'PlaywrightChecker Orchestrator',
      passed: false,
      score: 0,
      message: `Ошибка оркестратора: ${error instanceof Error ? error.message : String(error)}`,
    };
    console.log(`❌ Ошибка в оркестраторе: ${orchestratorResult.message}`);
  }
  console.log('\n' + '='.repeat(60) + '\n');
  // Сравнение результатов
  console.log('📊 СРАВНЕНИЕ РЕЗУЛЬТАТОВ:');
  console.log('─'.repeat(60));
  console.log(`Метод                  | Успех | Оценка | Совпадение`);
  console.log('─'.repeat(60));
  console.log(
    `Прямой вызов          | ${directResult.passed ? '✅' : '❌'}    | ${directResult.score.toString().padStart(3)}    | -`
  );
  console.log(
    `Через оркестратор     | ${orchestratorResult.passed ? '✅' : '❌'}    | ${orchestratorResult.score.toString().padStart(3)}    | ${directResult.score === orchestratorResult.score ? '✅' : '❌'}`
  );
  console.log('─'.repeat(60));
  // Проверка совпадения
  const scoresMatch = directResult.score === orchestratorResult.score;
  const statusMatch = directResult.passed === orchestratorResult.passed;
  if (scoresMatch && statusMatch) {
    console.log('🎉 РЕЗУЛЬТАТ: Полное совпадение - интеграция работает корректно!');
  } else {
    console.log('⚠️  РЕЗУЛЬТАТ: Есть расхождения в результатах');
    if (!scoresMatch) {
      console.log(`   • Оценки не совпадают: ${directResult.score} vs ${orchestratorResult.score}`);
    }
    if (!statusMatch) {
      console.log(
        `   • Статусы не совпадают: ${directResult.passed} vs ${orchestratorResult.passed}`
      );
    }
  }
  console.log('\n🎭 АНАЛИЗ PLAYWRIGHT:');
  if (directResult.details?.configFound) {
    console.log('✅ Playwright конфигурация найдена и проанализирована');
    console.log(`📁 Найдено ${directResult.details.testsFound} E2E тестов`);
    console.log(
      `🌐 Поддерживаемые браузеры: ${directResult.details.browsers?.join(', ') || 'chromium (по умолчанию)'}`
    );
    if (directResult.details.hasReports) {
      console.log('📊 Отчеты настроены');
    }
    if (directResult.details.parallelConfig) {
      console.log('⚡ Параллельное выполнение включено');
    }
  } else {
    console.log('⚠️  Playwright конфигурация не найдена или не настроена');
    if (directResult.details?.reason === 'no_dependency') {
      console.log('💡 Установите Playwright: npm install --save-dev @playwright/test');
    } else if (directResult.details?.reason === 'no_config') {
      console.log('💡 Создайте playwright.config.ts');
    } else if (directResult.details?.reason === 'no_tests') {
      console.log('💡 Добавьте E2E тесты в директорию tests/e2e');
    }
  }
  return {
    directResult,
    orchestratorResult,
    scoresMatch,
    statusMatch,
    success: scoresMatch && statusMatch,
  };
}
// Запуск тестирования
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  testPlaywrightChecker()
    .then(results => {
      console.log(`\n🏁 Тестирование завершено: ${results.success ? 'УСПЕХ' : 'ОШИБКА'}`);
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Критическая ошибка тестирования:', error);
      process.exit(1);
    });
}
//# sourceMappingURL=test-playwright-clean.js.map
