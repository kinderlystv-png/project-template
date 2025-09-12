/**
 * Простой запуск EAP Debugger для проверки оркестратора
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EapDebugger } from './eap-debugger/src/EapDebugger.js';

// Создаем простую версию оркестратора для тестирования
const createTestOrchestrator = () => {
  return {
    checkers: new Map([
      [
        'StructureChecker',
        {
          constructor: { name: 'StructureChecker' },
          check: () =>
            Promise.resolve({ passed: true, report: 'Обновленная структура файлов проверена' }),
          getName(): string {
            return 'Updated File Structure Checker';
          },
        },
      ],
      [
        'SecurityChecker',
        {
          constructor: { name: 'SecurityChecker' },
          check: () => Promise.resolve({ passed: true, report: 'Безопасность проверена' }),
          getName(): string {
            return 'Security Analysis Checker';
          },
        },
      ],
    ]),
    modules: new Map([
      [
        'TechnicalDebtAnalyzer',
        {
          constructor: { name: 'SimpleTechnicalDebtAnalyzer' },
          analyze: () => Promise.resolve({ score: 75, debt: 12000 }),
          getName(): string {
            return 'Updated Technical Debt Analyzer';
          },
        },
      ],
    ]),
  };
};

const runDebugger = async () => {
  console.log('🔍 Запуск EAP Debugger для текущего состояния оркестратора...\n');

  try {
    // Создаем тестовый оркестратор (имитация текущего состояния)
    const orchestrator = createTestOrchestrator();

    console.log('📊 Состояние оркестратора:');
    console.log(`  - Чекеров: ${orchestrator.checkers.size}`);
    console.log(`  - Модулей: ${orchestrator.modules.size}\n`);

    // Запускаем дебаггер с автоматическим открытием браузера
    console.log('🌐 Генерация HTML и автоматическое открытие браузера...');

    const html = await EapDebugger.quickGenerateAndOpen(
      orchestrator,
      './eap-current-orchestrator-debug.html'
    );

    console.log(`✅ HTML сгенерирован: ${html.length} символов`);
    console.log('📁 Файл: eap-current-orchestrator-debug.html');
    console.log('🌐 Браузер должен открыться автоматически с отладочной информацией!');

    // Также создаем экземпляр для получения статистики
    const eapDebugger = new EapDebugger();
    await eapDebugger.generateComponentsHtml(orchestrator);

    const stats = eapDebugger.getComponentStats();
    console.log('\n📈 Статистика компонентов:');
    console.log(JSON.stringify(stats, null, 2));

    const state = eapDebugger.getState();
    console.log('\n🔍 Состояние дебаггера:');
    console.log(`  - Всего компонентов: ${state.components.totalCount}`);
    console.log(
      `  - Последнее обновление: ${state.components.lastUpdated.toLocaleString('ru-RU')}`
    );
  } catch (error) {
    console.error('❌ Ошибка при запуске дебаггера:', error);
  }
};

console.log('🚀 Запуск отладчика оркестратора...\n');
runDebugger().catch(console.error);
