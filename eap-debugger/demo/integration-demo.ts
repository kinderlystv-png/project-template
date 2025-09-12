/**
 * Демонстрация интеграции EapDebugger с AnalysisOrchestrator
 * Показывает автоматическое открытие браузера при запуске анализа
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EapDebugger } from '../src/EapDebugger.js';
import { OrchestratorIntegration } from '../src/integration/OrchestratorIntegration.js';

// Имитация простого оркестратора для демонстрации
const createMockOrchestrator = () => {
  return {
    checkers: new Map([
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
        'PerformanceChecker',
        {
          constructor: { name: 'PerformanceChecker' },
          check: () => Promise.resolve({ passed: false, report: 'Проблемы производительности' }),
          getName() {
            return 'Performance Checker';
          },
        },
      ],
      [
        'TestChecker',
        {
          constructor: { name: 'TestChecker' },
          check: () => Promise.resolve({ passed: true, report: 'Тесты прошли' }),
          getName() {
            return 'Test Coverage Checker';
          },
        },
      ],
    ]),
    modules: new Map([
      [
        'CodeAnalyzer',
        {
          constructor: { name: 'CodeAnalyzer' },
          analyze: () => Promise.resolve({ score: 78 }),
          getName() {
            return 'Advanced Code Analyzer';
          },
        },
      ],
      [
        'AIInsights',
        {
          constructor: { name: 'AIInsights' },
          analyze: () => Promise.resolve({ score: 92 }),
          getName() {
            return 'AI-Powered Insights Module';
          },
        },
      ],
    ]),

    // Методы оркестратора
    addChecker(name: string, checker: any) {
      this.checkers.set(name, checker);
      console.log(`✅ Чекер "${name}" зарегистрирован`);
    },

    addModule(name: string, module: any) {
      this.modules.set(name, module);
      console.log(`✅ Модуль "${name}" зарегистрирован`);
    },

    async runAnalysis() {
      console.log('🚀 Запуск полного анализа...');

      // Имитация процесса анализа
      const checkerResults = [];
      for (const [name, checker] of this.checkers) {
        console.log(`🔍 Выполняется чекер: ${name}`);
        const result = await checker.check();
        checkerResults.push({ name, result });
      }

      const moduleResults = [];
      for (const [name, module] of this.modules) {
        console.log(`⚙️ Выполняется модуль: ${name}`);
        const result = await module.analyze();
        moduleResults.push({ name, result });
      }

      return {
        checkers: checkerResults,
        modules: moduleResults,
        timestamp: new Date(),
        summary: `Анализ завершен: ${checkerResults.length} чекеров, ${moduleResults.length} модулей`,
      };
    },
  };
};

const demonstrateIntegration = async () => {
  console.log('🎯 Демонстрация интеграции EapDebugger с оркестратором\n');

  // Создаем мок оркестратора
  const orchestrator = createMockOrchestrator();

  // Настраиваем интеграцию с автоматическим открытием браузера
  console.log('🔧 Настройка интеграции...');
  const hooks = OrchestratorIntegration.setupQuickIntegration(
    true, // автоматически открывать браузер
    './eap-live-demo-debug.html' // путь к HTML файлу
  );

  try {
    // Шаг 1: Симулируем начало анализа
    console.log('\n📋 Шаг 1: Начало анализа');
    if (hooks.onAnalysisStart) {
      await hooks.onAnalysisStart(orchestrator);
    }

    // Пауза для демонстрации
    console.log('⏳ Ожидание 3 секунды для демонстрации автообновления...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Шаг 2: Добавляем новый компонент во время анализа
    console.log('\n🔧 Шаг 2: Добавление нового компонента');
    orchestrator.addChecker('NewDynamicChecker', {
      constructor: { name: 'NewDynamicChecker' },
      check: () => Promise.resolve({ passed: true, report: 'Динамически добавленный чекер' }),
      getName() {
        return 'Dynamic Runtime Checker';
      },
    });

    if (hooks.onComponentRegistered) {
      await hooks.onComponentRegistered(orchestrator, 'NewDynamicChecker');
    }

    // Шаг 3: Запускаем основной анализ
    console.log('\n⚡ Шаг 3: Выполнение анализа');
    const results = await orchestrator.runAnalysis();

    // Шаг 4: Завершаем анализ
    console.log('\n✅ Шаг 4: Завершение анализа');
    if (hooks.onAnalysisComplete) {
      await hooks.onAnalysisComplete(orchestrator, results);
    }

    console.log('\n🎉 Демонстрация завершена!');
    console.log('📄 Проверьте файл: eap-live-demo-debug.html');
    console.log('🌐 HTML должен был автоматически открыться в браузере');
  } catch (error) {
    console.error('❌ Ошибка в демонстрации:', error);
  }
};

// Дополнительная демонстрация без автоматического открытия браузера
const demonstrateManualIntegration = async () => {
  console.log('\n🔧 Демонстрация ручной интеграции (без автооткрытия браузера)\n');

  const orchestrator = createMockOrchestrator();
  const eapDebugger = new EapDebugger();

  try {
    // Генерируем HTML без автооткрытия
    console.log('📄 Генерация HTML отчета...');
    const html = await eapDebugger.generateComponentsHtml(orchestrator, './eap-manual-debug.html');

    console.log(`✅ HTML сгенерирован (${html.length} символов)`);
    console.log('📁 Файл: eap-manual-debug.html');

    // Показываем статистику
    const stats = eapDebugger.getComponentStats();
    console.log('📊 Статистика:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('❌ Ошибка в ручной демонстрации:', error);
  }
};

// Запуск демонстраций
const runDemo = async () => {
  console.log('🚀 Запуск демонстрации EAP Debugger Integration\n');

  // Основная демонстрация с автооткрытием браузера
  await demonstrateIntegration();

  // Пауза между демонстрациями
  console.log('\n⏳ Пауза 2 секунды...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Дополнительная демонстрация
  await demonstrateManualIntegration();

  console.log('\n🎯 Все демонстрации завершены!');
};

// Запуск если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { demonstrateIntegration, demonstrateManualIntegration, createMockOrchestrator };
