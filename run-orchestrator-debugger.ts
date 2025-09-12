/**
 * Запуск EAP Debugger для текущего состояния оркестратора
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EapDebugger } from './eap-debugger/src/EapDebugger.js';

// Импортируем оркестратор из eap-analyzer
async function runOrchestratorDebugger() {
  console.log('🔍 Запуск EAP Debugger для текущего оркестратора...\n');

  try {
    // Динамический импорт оркестратора
    const { AnalysisOrchestrator } = await import('./eap-analyzer/src/core/orchestrator.js');

    console.log('✅ Оркестратор импортирован успешно');

    // Создаем экземпляр оркестратора
    const orchestrator = new AnalysisOrchestrator();
    console.log('✅ Экземпляр оркестратора создан');

    // Получаем информацию о зарегистрированных компонентах
    console.log('\n📊 Текущее состояние оркестратора:');
    console.log(`  - Чекеров: ${orchestrator.checkers?.size || 'N/A'}`);
    console.log(`  - Модулей: ${orchestrator.modules?.size || 'N/A'}`);

    // Если checkers/modules недоступны напрямую, попробуем через рефлексию
    if (!orchestrator.checkers) {
      console.log('  - Детали недоступны (приватные поля)');
    }

    // Генерируем HTML с автооткрытием браузера
    console.log('\n🌐 Генерация отладочного HTML с автооткрытием браузера...');
    const html = await EapDebugger.quickGenerateAndOpen(
      orchestrator,
      './eap-orchestrator-current-state.html'
    );

    console.log(`✅ HTML сгенерирован: ${html.length} символов`);
    console.log('📁 Файл: eap-orchestrator-current-state.html');
    console.log('🌐 Браузер должен был открыться автоматически!');

    // Также создаем снимок без автооткрытия для анализа
    console.log('\n📋 Создание дополнительного снимка для анализа...');
    const stats = await createDetailedSnapshot(orchestrator);

    console.log('\n📈 Статистика:');
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('❌ Ошибка при запуске дебаггера:', error);

    // Попробуем создать фиктивный оркестратор для демонстрации
    console.log('\n🔄 Попытка создания демо-оркестратора...');
    await createDemoOrchestrator();
  }
}

// Создаем детальный снимок
async function createDetailedSnapshot(orchestrator: any) {
  const eapDebugger = new EapDebugger();

  // Генерируем HTML
  await eapDebugger.generateComponentsHtml(orchestrator, './eap-detailed-snapshot.html');

  // Получаем статистику
  const stats = eapDebugger.getComponentStats();
  const state = eapDebugger.getState();
  return {
    stats,
    componentCount: state.components.totalCount,
    lastUpdated: state.components.lastUpdated,
    htmlFiles: ['./eap-orchestrator-current-state.html', './eap-detailed-snapshot.html'],
  };
}

// Создаем демо-оркестратор если основной недоступен
async function createDemoOrchestrator() {
  console.log('🎭 Создание демонстрационного оркестратора...');

  const demoOrchestrator = {
    checkers: new Map([
      [
        'StructureChecker',
        {
          constructor: { name: 'StructureChecker' },
          check: () => Promise.resolve({ passed: true, report: 'Структура файлов проверена' }),
          getName() {
            return 'File Structure Checker';
          },
        },
      ],
      [
        'SecurityChecker',
        {
          constructor: { name: 'SecurityChecker' },
          check: () => Promise.resolve({ passed: true, report: 'Безопасность OK' }),
          getName() {
            return 'Security Analysis Checker';
          },
        },
      ],
      [
        'TestChecker',
        {
          constructor: { name: 'TestChecker' },
          check: () => Promise.resolve({ passed: false, report: 'Требуется обновление тестов' }),
          getName() {
            return 'Test Coverage Checker';
          },
        },
      ],
    ]),
    modules: new Map([
      [
        'AIAnalyzer',
        {
          constructor: { name: 'AIAnalyzer' },
          analyze: () => Promise.resolve({ score: 85, insights: ['Хорошая архитектура'] }),
          getName() {
            return 'AI-Powered Code Analyzer';
          },
        },
      ],
      [
        'TechnicalDebtAnalyzer',
        {
          constructor: { name: 'SimpleTechnicalDebtAnalyzer' },
          analyze: () => Promise.resolve({ score: 72, debt: 15000 }),
          getName() {
            return 'Technical Debt Analyzer';
          },
        },
      ],
    ]),
  };

  console.log('📊 Демо-оркестратор создан:');
  console.log(`  - Чекеров: ${demoOrchestrator.checkers.size}`);
  console.log(`  - Модулей: ${demoOrchestrator.modules.size}`);

  // Генерируем HTML для демо
  console.log('\n🌐 Генерация HTML для демо-оркестратора...');
  const html = await EapDebugger.quickGenerateAndOpen(
    demoOrchestrator,
    './eap-demo-orchestrator-state.html'
  );

  console.log(`✅ Демо HTML сгенерирован: ${html.length} символов`);
  console.log('📁 Файл: eap-demo-orchestrator-state.html');
  console.log('🌐 Браузер должен был открыться с демо-данными!');
}

// Запуск
console.log('🚀 Запуск отладчика оркестратора...\n');
runOrchestratorDebugger().catch(console.error);
