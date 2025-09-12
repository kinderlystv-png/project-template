/**
 * Тест интегрированного FileStructureChecker в оркестраторе
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnalysisOrchestrator } from './eap-analyzer/src/core/orchestrator.js';
import { FileStructureChecker } from './eap-analyzer/src/checkers/structure.checker.js';
import { EapDebugger } from './eap-debugger/src/EapDebugger.js';

const testIntegratedStructureChecker = async () => {
  console.log('🔍 Тестирование FileStructureChecker интегрированного в оркестратор...\n');

  try {
    // Создаем оркестратор
    console.log('📦 Создание оркестратора и регистрация FileStructureChecker...');
    const orchestrator = new AnalysisOrchestrator();

    // Регистрируем FileStructureChecker вручную
    const structureChecker = new FileStructureChecker();
    orchestrator.registerChecker(structureChecker.getName(), structureChecker);

    console.log('📊 Состояние оркестратора после регистрации:');
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

    // Запускаем EAP Debugger на оркестраторе с FileStructureChecker
    console.log('\n🌐 Генерация HTML с интегрированным FileStructureChecker...');

    const html = await EapDebugger.quickGenerateAndOpen(
      orchestrator as any,
      './eap-integrated-structure-debug.html'
    );

    console.log(`✅ HTML сгенерирован: ${html.length} символов`);
    console.log('📁 Файл: eap-integrated-structure-debug.html');
    console.log('🌐 Браузер должен открыться с FileStructureChecker в списке!');

    // Также создаем экземпляр для получения статистики
    const eapDebugger = new EapDebugger();
    await eapDebugger.generateComponentsHtml(orchestrator as any);

    const stats = eapDebugger.getComponentStats();
    console.log('\n📈 Статистика с интегрированным FileStructureChecker:');
    console.log(JSON.stringify(stats, null, 2));

    // Дополнительно: запускаем анализ, чтобы увидеть FileStructureChecker в действии
    console.log('\n🚀 Запуск анализа с FileStructureChecker...');
    const result = await orchestrator.analyzeProject('./docs');

    console.log('✅ Анализ завершен!');
    console.log(`📊 Общая оценка: ${result.summary.overallScore}/100`);
    console.log(`🔍 Проверок выполнено: ${result.checks.length}`);

    // Ищем результат FileStructureChecker
    const structureResult = result.checks.find(
      (check: any) => check.checker === 'FileStructureChecker'
    );
    if (structureResult) {
      console.log('\n🎯 Результат FileStructureChecker:');
      console.log(`   - Оценка: ${structureResult.score}/100`);
      console.log(`   - Прошел: ${structureResult.passed ? 'Да' : 'Нет'}`);
      console.log(`   - Сообщение: ${structureResult.message}`);
      console.log(`   - Рекомендаций: ${structureResult.recommendations?.length || 0}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при тестировании интегрированного FileStructureChecker:', error);
  }
};

console.log('🚀 Запуск тестирования интегрированного FileStructureChecker...\n');
testIntegratedStructureChecker().catch(console.error);
