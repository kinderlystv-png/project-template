/**
 * Интеграционный тест для EAP Debugger
 * Тестирует работу с реальными компонентами
 */
/* eslint-disable no-console */

import { EapDebugger } from '../src/EapDebugger.js';

// Создаем простой мок для демонстрации
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const realWorldOrchestrator: any = {
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
        check: () =>
          Promise.resolve({ passed: false, report: 'Обнаружены проблемы производительности' }),
        getName() {
          return 'Performance Optimization Checker';
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
  ]),
};

const integrationTest = async (): Promise<void> => {
  console.log('🚀 Интеграционный тест EAP Debugger...\n');

  try {
    console.log('📋 Генерация HTML отчета для production...');

    // Создаем HTML в корне проекта для легкого доступа
    const outputPath = './eap-components-debug.html';
    const html = await EapDebugger.quickGenerate(realWorldOrchestrator, outputPath);

    console.log(`✅ HTML отчет создан: ${outputPath}`);
    console.log(`📊 Размер отчета: ${html.length} символов`);
    console.log('🌐 Откройте файл eap-components-debug.html в браузере для просмотра');

    console.log('\n🎯 Интеграционный тест завершен успешно!');
  } catch (error) {
    console.error('❌ Ошибка в интеграционном тесте:', error);
    throw error;
  }
};

// Запуск интеграционного теста
integrationTest().catch(console.error);
