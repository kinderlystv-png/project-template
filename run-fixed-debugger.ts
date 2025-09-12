/**
 * Обновленный простой запуск EAP Debugger с правильной интеграцией FileStructureChecker
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnalysisOrchestrator } from './eap-analyzer/src/core/orchestrator.js';
import { FileStructureChecker } from './eap-analyzer/src/checkers/structure.checker.js';
import { EapDebugger } from './eap-debugger/src/EapDebugger.js';

const runFixedDebugger = async () => {
  console.log('🔍 Запуск ИСПРАВЛЕННОГО EAP Debugger с FileStructureChecker...\n');

  try {
    // Создаем оркестратор с правильной интеграцией
    console.log('📦 Создание оркестратора с FileStructureChecker...');
    const orchestrator = new AnalysisOrchestrator();

    // Регистрируем FileStructureChecker
    const structureChecker = new FileStructureChecker();
    orchestrator.registerChecker(structureChecker.getName(), structureChecker);

    console.log('📊 Состояние ИСПРАВЛЕННОГО оркестратора:');
    console.log(`  - Чекеров: ${(orchestrator as any).checkers.size}`);
    console.log(`  - Модулей: ${(orchestrator as any).modules.size}\n`);

    // Детали зарегистрированных компонентов
    console.log('🔧 Зарегистрированные чекеры:');
    for (const [name, checker] of (orchestrator as any).checkers) {
      console.log(`  - ${name}: ${checker.constructor.name} (${(checker as any).category})`);
    }

    console.log('\n📦 Зарегистрированные модули:');
    for (const [name, module] of (orchestrator as any).modules) {
      console.log(`  - ${name}: ${module.constructor.name}`);
    }

    // Запускаем дебаггер с автоматическим открытием браузера
    console.log('\n🌐 Генерация HTML и автоматическое открытие браузера...');

    const html = await EapDebugger.quickGenerateAndOpen(
      orchestrator as any,
      './eap-fixed-orchestrator-debug.html'
    );

    console.log(`✅ HTML сгенерирован: ${html.length} символов`);
    console.log('📁 Файл: eap-fixed-orchestrator-debug.html');
    console.log('🌐 Браузер должен открыться с FileStructureChecker в отладочной информации!');

    // Статистика компонентов
    const eapDebugger = new EapDebugger();
    await eapDebugger.generateComponentsHtml(orchestrator as any);

    const stats = eapDebugger.getComponentStats();
    console.log('\n📈 ИСПРАВЛЕННАЯ статистика компонентов:');
    console.log(JSON.stringify(stats, null, 2));

    const state = eapDebugger.getState();
    console.log('\n🔍 Состояние исправленного дебаггера:');
    console.log(`  - Всего компонентов: ${state.components.totalCount}`);
    console.log(
      `  - Последнее обновление: ${state.components.lastUpdated.toLocaleString('ru-RU')}`
    );
    console.log(
      `  - Есть FileStructureChecker: ${(orchestrator as any).checkers.has('FileStructureChecker') ? 'ДА ✅' : 'НЕТ ❌'}`
    );
  } catch (error) {
    console.error('❌ Ошибка при запуске исправленного дебаггера:', error);
  }
};

console.log('🚀 Запуск ИСПРАВЛЕННОГО отладчика оркестратора...\n');
runFixedDebugger().catch(console.error);
