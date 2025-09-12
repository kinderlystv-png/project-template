/**
 * Пример интеграции EapDebugger с реальным AnalysisOrchestrator
 * Показывает, как добавить автоматическое открытие HTML при запуске анализа
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EapDebugger } from '../src/EapDebugger.js';
import { OrchestratorIntegration } from '../src/integration/OrchestratorIntegration.js';

/**
 * Пример 1: Прямая интеграция с оркестратором
 */
export function addDebuggerToOrchestrator(orchestrator: any, autoOpenBrowser = true) {
  console.log('🔧 Добавляем EAP Debugger к оркестратору...');

  // Сохраняем оригинальные методы
  const originalRunAnalysis = orchestrator.runAnalysis?.bind(orchestrator);
  const originalRegisterChecker = orchestrator.registerChecker?.bind(orchestrator);
  const originalRegisterModule = orchestrator.registerModule?.bind(orchestrator);

  // Создаем путь для отладочного HTML
  const debugHtmlPath = './eap-orchestrator-debug.html';

  // Переопределяем метод запуска анализа
  orchestrator.runAnalysis = async function (...args: any[]) {
    console.log('🚀 EAP Debugger: Анализ начат, генерируем отладочный HTML...');

    try {
      // Генерируем HTML и открываем браузер перед анализом
      if (autoOpenBrowser) {
        await EapDebugger.quickGenerateAndOpen(this, debugHtmlPath);
      } else {
        await EapDebugger.quickGenerate(this, debugHtmlPath);
      }

      // Запускаем оригинальный анализ
      const result = originalRunAnalysis ? await originalRunAnalysis(...args) : null;

      // Обновляем HTML после завершения анализа
      await EapDebugger.quickGenerate(this, debugHtmlPath);
      console.log('✅ EAP Debugger: HTML обновлен после завершения анализа');

      return result;
    } catch (error) {
      console.error('❌ EAP Debugger: Ошибка в интеграции:', error);
      // Продолжаем выполнение оригинального анализа даже при ошибке отладки
      return originalRunAnalysis ? await originalRunAnalysis(...args) : null;
    }
  };

  // Переопределяем регистрацию чекеров для обновления HTML
  if (originalRegisterChecker) {
    orchestrator.registerChecker = async function (name: string, checker: any) {
      const result = originalRegisterChecker(name, checker);

      try {
        await EapDebugger.quickGenerate(this, debugHtmlPath);
        console.log(`🔍 EAP Debugger: HTML обновлен после регистрации чекера "${name}"`);
      } catch (error) {
        console.warn('⚠️ EAP Debugger: Не удалось обновить HTML после регистрации чекера:', error);
      }

      return result;
    };
  }

  // Переопределяем регистрацию модулей для обновления HTML
  if (originalRegisterModule) {
    orchestrator.registerModule = async function (name: string, module: any) {
      const result = originalRegisterModule(name, module);

      try {
        await EapDebugger.quickGenerate(this, debugHtmlPath);
        console.log(`⚙️ EAP Debugger: HTML обновлен после регистрации модуля "${name}"`);
      } catch (error) {
        console.warn('⚠️ EAP Debugger: Не удалось обновить HTML после регистрации модуля:', error);
      }

      return result;
    };
  }

  console.log(`✅ EAP Debugger интегрирован! HTML будет доступен в: ${debugHtmlPath}`);
  return debugHtmlPath;
}

/**
 * Пример 2: Интеграция через хуки (более продвинутый способ)
 */
export function setupAdvancedIntegration(orchestrator: any, options = {}) {
  const config = {
    autoOpenBrowser: true,
    htmlPath: './eap-advanced-debug.html',
    refreshInterval: 2000,
    ...options,
  };

  console.log('🔧 Настройка продвинутой интеграции EAP Debugger...');

  // Используем класс интеграции
  const integration = OrchestratorIntegration.getInstance();
  integration.setAutoOpenBrowser(config.autoOpenBrowser);
  integration.setDebugHtmlPath(config.htmlPath);

  const hooks = integration.getHooks();

  // Интегрируем хуки в методы оркестратора
  const originalRunAnalysis = orchestrator.runAnalysis?.bind(orchestrator);

  orchestrator.runAnalysis = async function (...args: any[]) {
    // Хук начала анализа
    if (hooks.onAnalysisStart) {
      await hooks.onAnalysisStart(this);
    }

    let result = null;
    try {
      result = originalRunAnalysis ? await originalRunAnalysis(...args) : null;
    } finally {
      // Хук завершения анализа
      if (hooks.onAnalysisComplete) {
        await hooks.onAnalysisComplete(this, result);
      }
    }

    return result;
  };

  console.log(`✅ Продвинутая интеграция настроена! HTML: ${config.htmlPath}`);
  return integration;
}

/**
 * Пример 3: Простейшая одноразовая генерация
 */
export async function generateDebugSnapshot(orchestrator: any, filename?: string) {
  const htmlPath = filename || `./eap-snapshot-${Date.now()}.html`;

  console.log(`📸 Создание снимка состояния оркестратора...`);

  const html = await EapDebugger.quickGenerateAndOpen(orchestrator, htmlPath);

  console.log(`✅ Снимок создан: ${htmlPath} (${html.length} символов)`);
  return htmlPath;
}

// Пример использования:
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📖 Примеры интеграции EAP Debugger с оркестратором:');
  console.log('');
  console.log('1. Прямая интеграция:');
  console.log('   addDebuggerToOrchestrator(orchestrator, true);');
  console.log('');
  console.log('2. Продвинутая интеграция:');
  console.log('   setupAdvancedIntegration(orchestrator, { autoOpenBrowser: true });');
  console.log('');
  console.log('3. Одноразовый снимок:');
  console.log('   generateDebugSnapshot(orchestrator);');
}
