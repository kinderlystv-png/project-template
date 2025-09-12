/**
 * Простой тест автооткрытия браузера
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EapDebugger } from '../src/EapDebugger.js';

const testAutoOpen = async () => {
  console.log('🧪 Тест автоматического открытия браузера\n');

  // Простой мок оркестратора
  const mockOrchestrator: any = {
    checkers: new Map([
      [
        'TestChecker',
        {
          constructor: { name: 'TestChecker' },
          check: () => Promise.resolve({ passed: true }),
          getName() {
            return 'Test Browser Opener Checker';
          },
        },
      ],
    ]),
    modules: new Map([
      [
        'TestModule',
        {
          constructor: { name: 'TestModule' },
          analyze: () => Promise.resolve({ score: 95 }),
          getName() {
            return 'Test Browser Opener Module';
          },
        },
      ],
    ]),
  };

  try {
    console.log('📄 Генерируем HTML и автоматически открываем в браузере...');

    // Используем новый метод с автооткрытием браузера
    const html = await EapDebugger.quickGenerateAndOpen(
      mockOrchestrator,
      './eap-auto-browser-test.html'
    );

    console.log(`✅ HTML сгенерирован: ${html.length} символов`);
    console.log('📁 Файл: eap-auto-browser-test.html');
    console.log('🌐 Браузер должен был открыться автоматически!');

    // Также протестируем экземплярный метод
    console.log('\n🔧 Тест с экземпляром класса...');
    const eapDebugger = new EapDebugger();

    await eapDebugger.generateComponentsHtmlWithAutoOpen(
      mockOrchestrator,
      './eap-instance-test.html',
      true
    );

    console.log('✅ Второй тест завершен');
    console.log('📁 Файл: eap-instance-test.html');
  } catch (error) {
    console.error('❌ Ошибка в тесте:', error);
  }
};

testAutoOpen().catch(console.error);
