/**
 * Простой тест для EapDebugger
 */
/* eslint-disable no-console */

import { EapDebugger } from '../src/EapDebugger.js';

// Мок-данные для имитации AnalysisOrchestrator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockOrchestrator: any = {
  checkers: new Map([
    [
      'SecurityChecker',
      {
        constructor: { name: 'SecurityChecker' },
        check: () => Promise.resolve({ score: 85 }),
      },
    ],
    [
      'TestChecker',
      {
        constructor: { name: 'JestChecker' },
        check: () => Promise.resolve({ score: 90 }),
      },
    ],
    [
      'FileStructureChecker',
      {
        constructor: { name: 'FileStructureAnalyzer' },
        check: () => Promise.resolve({ score: 75 }),
      },
    ],
  ]),
  modules: new Map([
    [
      'AIAnalyzer',
      {
        constructor: { name: 'AIAnalyzer' },
        analyze: () => Promise.resolve({ score: 85 }),
        getName(): string {
          return 'AI Insights Module';
        },
      },
    ],
    [
      'TechnicalDebtAnalyzer',
      {
        constructor: { name: 'SimpleTechnicalDebtAnalyzer' },
        analyze: () => Promise.resolve({ score: 65 }),
        getName: () => 'Technical Debt Analyzer',
      },
    ],
  ]),
};

async function testEapDebugger() {
  console.log('🧪 Тестирование EapDebugger...\n');

  try {
    // Создаем экземпляр debugger'а
    const eapDebugger = new EapDebugger();

    // Тест 1: Получение статистики
    console.log('📊 Тест 1: Получение статистики компонентов');

    await eapDebugger.generateComponentsHtml(mockOrchestrator);
    const stats = eapDebugger.getComponentStats();

    console.log('Статистика:', JSON.stringify(stats, null, 2));
    console.log('✅ Тест 1 пройден\n');

    // Тест 2: Генерация HTML
    console.log('📄 Тест 2: Генерация HTML файла');

    const outputPath = './eap-debugger-test-output.html';
    const html = await eapDebugger.generateComponentsHtml(mockOrchestrator, outputPath);

    console.log(`HTML файл создан: ${outputPath}`);
    console.log(`Размер HTML: ${html.length} символов`);
    console.log('✅ Тест 2 пройден\n');

    // Тест 3: Состояние debugger'а
    console.log("🔍 Тест 3: Проверка состояния debugger'а");

    const state = eapDebugger.getState();
    console.log(`Всего компонентов: ${state.components.totalCount}`);
    console.log(`Чекеров: ${state.components.checkers.length}`);
    console.log(`Модулей: ${state.components.modules.length}`);
    console.log(`Последнее обновление: ${state.components.lastUpdated.toISOString()}`);
    console.log('✅ Тест 3 пройден\n'); // Тест 4: Быстрая генерация
    console.log('⚡ Тест 4: Быстрая генерация через статический метод');

    const quickHtml = await EapDebugger.quickGenerate(
      mockOrchestrator,
      './eap-debugger-quick-test.html'
    );

    console.log(`Быстрая генерация завершена, размер: ${quickHtml.length} символов`);
    console.log('✅ Тест 4 пройден\n');

    console.log('🎉 Все тесты пройдены успешно!');
  } catch (error) {
    console.error('❌ Ошибка в тестах:', error);
    throw error;
  }
}

// Запускаем тесты
testEapDebugger().catch(console.error);
