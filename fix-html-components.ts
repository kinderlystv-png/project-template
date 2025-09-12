/**
 * ПРОСТОЙ И НАДЕЖНЫЙ подход - читаем, находим маркеры, заменяем блоки
 */
/* eslint-disable no-console */
import { EapDebugger } from './eap-debugger/src/EapDebugger.js';
import path from 'path';
import fs from 'fs';

async function replaceComponentsDirectly() {
  console.log('🚀 Прямая замена HTML блоков компонентов...');

  try {
    // Создаем тестовые данные
    const realOrchestrator = {
      checkers: new Map([
        [
          'FileStructureChecker',
          {
            constructor: { name: 'FileStructureChecker' },
            check: () => Promise.resolve({ passed: true, score: 89.2 }),
            getName: () => 'FileStructureAnalyzer v3.0',
          },
        ],
        [
          'SecurityChecker',
          {
            constructor: { name: 'SecurityChecker' },
            check: () => Promise.resolve({ passed: true, score: 94.8 }),
            getName: () => 'SecurityChecker v0.1',
          },
        ],
        [
          'TestingChecker',
          {
            constructor: { name: 'TestingChecker' },
            check: () => Promise.resolve({ passed: true, score: 76.5 }),
            getName: () => 'TestingChecker v2.1',
          },
        ],
        [
          'PerformanceChecker',
          {
            constructor: { name: 'PerformanceChecker' },
            check: () => Promise.resolve({ passed: true, score: 82.3 }),
            getName: () => 'PerformanceChecker v1.5',
          },
        ],
        [
          'CoverageChecker',
          {
            constructor: { name: 'CoverageChecker' },
            check: () => Promise.resolve({ passed: true, score: 91.7 }),
            getName: () => 'CoverageChecker v2.0',
          },
        ],
      ]),
      modules: new Map([
        [
          'AIAnalyzer',
          {
            constructor: { name: 'AIAnalyzer' },
            analyze: () => Promise.resolve({ score: 88.1 }),
            getName: () => 'AI Code Analyzer v2.3',
          },
        ],
        [
          'TechnicalDebtAnalyzer',
          {
            constructor: { name: 'TechnicalDebtAnalyzer' },
            analyze: () => Promise.resolve({ score: 72.5 }),
            getName: () => 'Technical Debt Analyzer v1.8',
          },
        ],
        [
          'CoverageAnalyzer',
          {
            constructor: { name: 'CoverageAnalyzer' },
            analyze: () => Promise.resolve({ score: 85.3 }),
            getName: () => 'Coverage Analyzer v3.1',
          },
        ],
      ]),
    };

    // Получаем регистрацию компонентов
    const eapDebugger = new EapDebugger();
    const registration = eapDebugger.getComponentRegistration(realOrchestrator as any);

    console.log(`📊 Будет показано: ${registration.totalCount} компонентов`);
    console.log(`  - Чекеров: ${registration.checkers.length}`);
    console.log(`  - Модулей: ${registration.modules.length}`);

    // Читаем оригинальный HTML
    const htmlPath = './eap-enhanced-analysis-test.html';
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Генерируем новый HTML для чекеров
    const newCheckersHtml = generateNewCheckersHtml(registration.checkers);
    const newModulesHtml = generateNewModulesHtml(registration.modules);

    // 1. Заменяем статистику
    html = html.replace(
      '<div class="stat-number">3</div>',
      `<div class="stat-number">${registration.totalCount}</div>`
    );
    html = html.replace(
      '<div class="stat-number">2</div>',
      `<div class="stat-number">${registration.checkers.length}</div>`
    );
    html = html.replace(
      '<div class="stat-number">1</div>',
      `<div class="stat-number">${registration.modules.length}</div>`
    );

    // 2. Заменяем заголовки
    html = html.replace(
      '🔧 Зарегистрированные чекеры (2)',
      `🔧 Зарегистрированные чекеры (${registration.checkers.length})`
    );
    html = html.replace(
      '📦 Зарегистрированные модули (1)',
      `📦 Зарегистрированные модули (${registration.modules.length})`
    );

    // 3. Находим и заменяем весь блок чекеров
    const checkersStartMarker = '<div class="section-header">🔧 Зарегистрированные чекеры';
    const checkersEndMarker = '<div class="section-header">📦 Зарегистрированные модули';

    const checkersStart = html.indexOf(checkersStartMarker);
    const checkersEnd = html.indexOf(checkersEndMarker);

    if (checkersStart !== -1 && checkersEnd !== -1) {
      const beforeCheckers = html.substring(0, checkersStart);
      const afterCheckers = html.substring(checkersEnd);

      html =
        beforeCheckers +
        `<div class="section-header">🔧 Зарегистрированные чекеры (${registration.checkers.length})</div>
      <div class="component-list">
${newCheckersHtml}
      </div>
    </div>

    <div class="section">
      ` +
        afterCheckers;
    }

    // 4. Находим и заменяем весь блок модулей
    const modulesStartMarker = '<div class="section-header">📦 Зарегистрированные модули';
    const modulesEndMarker = '<div class="test-section">';

    const modulesStart = html.indexOf(modulesStartMarker);
    const modulesEnd = html.indexOf(modulesEndMarker);

    if (modulesStart !== -1 && modulesEnd !== -1) {
      const beforeModules = html.substring(0, modulesStart);
      const afterModules = html.substring(modulesEnd);

      html =
        beforeModules +
        `<div class="section-header">📦 Зарегистрированные модули (${registration.modules.length})</div>
      <div class="component-list">
${newModulesHtml}
      </div>
    </div>

    ` +
        afterModules;
    }

    // 5. Обновляем время
    const timestamp = new Date().toLocaleString('ru-RU');
    html = html.replace(/Последнее обновление: [^<]+/, `Последнее обновление: ${timestamp}`);

    // Сохраняем
    fs.writeFileSync(htmlPath, html);

    console.log('✅ HTML файл успешно обновлен!');
    console.log(
      `📊 Показано: ${registration.totalCount} компонентов (${registration.checkers.length} чекеров + ${registration.modules.length} модулей)`
    );

    // Открываем в браузере
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const absolutePath = path.resolve(htmlPath);
    await execAsync(`start "" "${absolutePath}"`);

    console.log('🌐 Обновленная страница открыта!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

function generateNewCheckersHtml(checkers: any[]) {
  return checkers
    .map((checker, index) => {
      const timestamp = new Date().toLocaleString('ru-RU');
      return `
      <div class="component-card checker">
        <div class="component-header">
          <span class="component-icon">🔍</span>
          <div class="component-info">
            <h3 class="component-name">${checker.name}</h3>
            <span class="component-type">checker</span>
          </div>
        </div>
        <div class="component-details">
          <div class="component-id"><strong>ID:</strong> ${checker.id}</div>
          <div class="component-active"><strong>Активен:</strong> Да</div>
          <div class="component-registered"><strong>Зарегистрирован:</strong> ${timestamp}</div>

          <div class="component-metadata">
            <strong>Метаданные:</strong>
            <pre>${JSON.stringify(checker.metadata, null, 2)}</pre>
          </div>
        </div>
      </div>`;
    })
    .join('\n');
}

function generateNewModulesHtml(modules: any[]) {
  return modules
    .map((module, index) => {
      const timestamp = new Date().toLocaleString('ru-RU');
      return `
      <div class="component-card module">
        <div class="component-header">
          <span class="component-icon">⚙️</span>
          <div class="component-info">
            <h3 class="component-name">${module.name}</h3>
            <span class="component-type">module</span>
          </div>
        </div>
        <div class="component-details">
          <div class="component-id"><strong>ID:</strong> ${module.id}</div>
          <div class="component-active"><strong>Активен:</strong> Да</div>
          <div class="component-registered"><strong>Зарегистрирован:</strong> ${timestamp}</div>

          <div class="component-metadata">
            <strong>Метаданные:</strong>
            <pre>${JSON.stringify(module.metadata, null, 2)}</pre>
          </div>
        </div>
      </div>`;
    })
    .join('\n');
}

// Запуск
replaceComponentsDirectly().catch(console.error);
