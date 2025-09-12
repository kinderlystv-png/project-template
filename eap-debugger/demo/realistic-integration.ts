/**
 * Практическая демонстрация интеграции с существующим оркестратором
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  addDebuggerToOrchestrator,
  generateDebugSnapshot,
} from '../examples/orchestrator-integration.js';

// Имитация существующего AnalysisOrchestrator из проекта
const createRealisticOrchestrator = () => {
  const orchestrator = {
    checkers: new Map(),
    modules: new Map(),

    registerChecker(name: string, checker: any) {
      this.checkers.set(name, checker);
      console.log(`✅ Зарегистрирован чекер: ${name}`);
    },

    registerModule(name: string, module: any) {
      this.modules.set(name, module);
      console.log(`✅ Зарегистрирован модуль: ${name}`);
    },

    async runAnalysis() {
      console.log('🔍 Запуск анализа...');

      // Имитация работы чекеров
      const checkerResults = [];
      for (const [name, checker] of this.checkers) {
        console.log(`  🔧 Выполняется ${name}...`);
        const result = await checker.check();
        checkerResults.push({ name, ...result });

        // Имитация времени выполнения
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Имитация работы модулей
      const moduleResults = [];
      for (const [name, module] of this.modules) {
        console.log(`  ⚙️ Выполняется ${name}...`);
        const result = await module.analyze();
        moduleResults.push({ name, ...result });

        // Имитация времени выполнения
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const finalResult = {
        checkers: checkerResults,
        modules: moduleResults,
        summary: `Анализ завершен: ${checkerResults.length} чекеров, ${moduleResults.length} модулей`,
        timestamp: new Date(),
      };

      console.log('✅ Анализ завершен!');
      return finalResult;
    },
  };

  // Регистрируем несколько компонентов
  orchestrator.registerChecker('SecurityChecker', {
    getName: () => 'Security Analysis Checker',
    check: () => Promise.resolve({ passed: true, issues: 2 }),
  });

  orchestrator.registerChecker('PerformanceChecker', {
    getName: () => 'Performance Optimization Checker',
    check: () => Promise.resolve({ passed: false, issues: 5 }),
  });

  orchestrator.registerModule('CodeQualityAnalyzer', {
    getName: () => 'Code Quality Analyzer',
    analyze: () => Promise.resolve({ score: 78, metrics: { complexity: 45 } }),
  });

  return orchestrator;
};

const demonstrateRealisticIntegration = async () => {
  console.log('🎯 Демонстрация реалистичной интеграции EAP Debugger\n');

  // Создаем оркестратор
  const orchestrator = createRealisticOrchestrator();

  console.log('📊 Состояние оркестратора до интеграции:');
  console.log(`  - Чекеров: ${orchestrator.checkers.size}`);
  console.log(`  - Модулей: ${orchestrator.modules.size}\n`);

  try {
    // Шаг 1: Создаем снимок текущего состояния
    console.log('📸 Шаг 1: Создание снимка текущего состояния');
    await generateDebugSnapshot(orchestrator, './eap-before-integration.html');

    // Шаг 2: Интегрируем debugger
    console.log('\n🔧 Шаг 2: Интеграция EAP Debugger');
    const debugHtmlPath = addDebuggerToOrchestrator(orchestrator, true);

    // Шаг 3: Добавляем новый компонент после интеграции
    console.log('\n📦 Шаг 3: Добавление нового компонента');
    orchestrator.registerModule('TechnicalDebtAnalyzer', {
      getName: () => 'Technical Debt Analyzer',
      analyze: () => Promise.resolve({ debt: 15000, rating: 'B+' }),
    });

    // Шаг 4: Запускаем анализ (должен автоматически открыть браузер)
    console.log('\n🚀 Шаг 4: Запуск анализа с интегрированным debugger');
    console.log('🌐 Браузер должен открыться автоматически!');

    const results = await orchestrator.runAnalysis();

    console.log('\n📋 Результаты анализа:');
    console.log(JSON.stringify(results.summary, null, 2));

    console.log('\n✅ Демонстрация завершена!');
    console.log(`📄 Основной отладочный файл: ${debugHtmlPath}`);
    console.log('📄 Снимок до интеграции: ./eap-before-integration.html');
  } catch (error) {
    console.error('❌ Ошибка в демонстрации:', error);
  }
};

// Запуск демонстрации
demonstrateRealisticIntegration().catch(console.error);
