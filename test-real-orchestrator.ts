/**
 * Тест реального оркестратора для проверки зарегистрированных компонентов
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnalysisOrchestrator } from './eap-analyzer/src/core/orchestrator.js';
import { EapDebugger } from './eap-debugger/src/EapDebugger.js';

const testRealOrchestrator = async () => {
  console.log('🔍 Тестирование РЕАЛЬНОГО оркестратора с EAP Debugger...\n');

  try {
    // Создаем реальный оркестратор напрямую
    console.log('📦 Создание реального EAP оркестратора...');
    const orchestrator = new AnalysisOrchestrator();

    console.log('📊 Состояние РЕАЛЬНОГО оркестратора:');
    console.log(`  - Чекеров: ${(orchestrator as any).checkers.size}`);
    console.log(`  - Модулей: ${(orchestrator as any).modules.size}\n`);

    // Показываем детали зарегистрированных компонентов
    console.log('🔧 Зарегистрированные чекеры:');
    for (const [name, checker] of (orchestrator as any).checkers) {
      console.log(`  - ${name}: ${checker.constructor.name}`);
    }

    console.log('\n📦 Зарегистрированные модули:');
    for (const [name, module] of (orchestrator as any).modules) {
      console.log(`  - ${name}: ${module.constructor.name}`);
    }

    // Запускаем EAP Debugger на реальном оркестраторе
    console.log('\n🌐 Генерация HTML с реальными данными...');

    const html = await EapDebugger.quickGenerateAndOpen(
      orchestrator as any,
      './eap-real-orchestrator-debug.html'
    );

    console.log(`✅ HTML сгенерирован: ${html.length} символов`);
    console.log('📁 Файл: eap-real-orchestrator-debug.html');
    console.log('🌐 Браузер должен открыться с РЕАЛЬНЫМИ данными оркестратора!');

    // Также создаем экземпляр для получения статистики
    const eapDebugger = new EapDebugger();
    await eapDebugger.generateComponentsHtml(orchestrator as any);
    const stats = eapDebugger.getComponentStats();
    console.log('\n📈 РЕАЛЬНАЯ статистика компонентов:');
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('❌ Ошибка при тестировании реального оркестратора:', error);
  }
};

console.log('🚀 Запуск тестирования РЕАЛЬНОГО оркестратора...\n');
testRealOrchestrator().catch(console.error);
