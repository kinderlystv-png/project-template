/**
 * Генератор реальных данных для eap-enhanced-analysis-test.html
 * Подключается к настоящему AnalysisOrchestrator и извлекает актуальные компоненты
 */
/* eslint-disable no-console */
import { EapDebugger } from './eap-debugger/src/EapDebugger.js';
import path from 'path';
import fs from 'fs';

async function generateRealAnalysisPage() {
  console.log('🚀 Подключение к реальному AnalysisOrchestrator...');

  try {
    // Импортируем реальный оркестратор
    const { AnalysisOrchestrator } = await import('./eap-analyzer/src/core/orchestrator.js');

    console.log('✅ AnalysisOrchestrator импортирован успешно');

    // Создаем экземпляр реального оркестратора
    const realOrchestrator = new AnalysisOrchestrator();
    console.log('✅ Экземпляр оркестратора создан');

    // Получаем актуальную информацию о зарегистрированных компонентах
    const eapDebugger = new EapDebugger();
    const registration = eapDebugger.getComponentRegistration(realOrchestrator as any);

    console.log('📊 Реальные данные оркестратора:');
    console.log(`  - Чекеров: ${registration.checkers.length}`);
    console.log(`  - Модулей: ${registration.modules.length}`);
    console.log(`  - Всего компонентов: ${registration.totalCount}`);

    // Выводим детали компонентов
    console.log('\n🔧 Зарегистрированные чекеры:');
    registration.checkers.forEach(checker => {
      console.log(`  - ${checker.name} (${checker.type}): ${checker.metadata.className}`);
    });

    console.log('\n⚙️ Зарегистрированные модули:');
    registration.modules.forEach(module => {
      console.log(`  - ${module.name} (${module.type}): ${module.metadata.className}`);
    });

    // Читаем оригинальный HTML файл
    const originalHtmlPath = './eap-enhanced-analysis-test.html';
    let htmlContent = fs.readFileSync(originalHtmlPath, 'utf8');

    // Обновляем статистику в HTML
    htmlContent = htmlContent.replace(
      /<div class="stat-number">3<\/div>/g,
      `<div class="stat-number">${registration.totalCount}</div>`
    );

    htmlContent = htmlContent.replace(
      /<div class="stat-number">2<\/div>/g,
      `<div class="stat-number">${registration.checkers.length}</div>`
    );

    htmlContent = htmlContent.replace(
      /<div class="stat-number">1<\/div>/g,
      `<div class="stat-number">${registration.modules.length}</div>`
    );

    // Обновляем компоненты в HTML
    const checkersHtml = generateCheckersHtml(registration.checkers);
    const modulesHtml = generateModulesHtml(registration.modules);

    // Заменяем секцию чекеров
    htmlContent = htmlContent.replace(
      /(<div class="section-header">🔧 Зарегистрированные чекеры \(\d+\)<\/div>[\s\S]*?)(<div class="section">)/,
      `<div class="section-header">🔧 Зарегистрированные чекеры (${registration.checkers.length})</div>\n${checkersHtml}\n$2`
    );

    // Заменяем секцию модулей
    htmlContent = htmlContent.replace(
      /(<div class="section-header">📦 Зарегистрированные модули \(\d+\)<\/div>[\s\S]*?)(<div class="test-section">)/,
      `<div class="section-header">📦 Зарегистрированные модули (${registration.modules.length})</div>\n${modulesHtml}\n$2`
    );

    // Обновляем время последнего обновления
    const timestamp = new Date().toLocaleString('ru-RU');
    htmlContent = htmlContent.replace(
      /Последнее обновление: [\d\.,\s:]+/g,
      `Последнее обновление: ${timestamp}`
    );

    // Сохраняем обновленный HTML
    fs.writeFileSync(originalHtmlPath, htmlContent);
    console.log(`\n✅ Файл ${originalHtmlPath} обновлен с реальными данными!`);
    console.log(`📊 Обновлено: ${registration.totalCount} компонентов`);

    // Открываем в браузере
    console.log('🌐 Открытие обновленной страницы в браузере...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const absolutePath = path.resolve(originalHtmlPath);
    await execAsync(`start "" "${absolutePath}"`);

    console.log('🎉 Страница с реальными данными успешно открыта!');
  } catch (error) {
    console.error('❌ Ошибка получения реальных данных:', error);
    console.error('Детали:', error.message);
  }
}

function generateCheckersHtml(checkers) {
  if (checkers.length === 0) {
    return '<div class="component-list"><div class="no-components">Нет зарегистрированных чекеров</div></div>';
  }

  const checkersHtml = checkers
    .map(
      checker => `
      <div class="component-card checker">
        <div class="component-header">
          <span class="component-icon">🔍</span>
          <div class="component-info">
            <h3 class="component-name">${checker.name}</h3>
            <span class="component-type">${checker.category}</span>
          </div>
        </div>
        <div class="component-details">
          <div class="component-id"><strong>ID:</strong> ${checker.id}</div>
          <div class="component-active"><strong>Активен:</strong> ${checker.isActive ? 'Да' : 'Нет'}</div>
          <div class="component-registered"><strong>Зарегистрирован:</strong> ${checker.registeredAt.toLocaleString('ru-RU')}</div>

          <div class="component-metadata">
            <strong>Метаданные:</strong>
            <pre>${JSON.stringify(checker.metadata, null, 2)}</pre>
          </div>
        </div>
      </div>`
    )
    .join('\n');

  return `<div class="component-list">${checkersHtml}</div>`;
}

function generateModulesHtml(modules) {
  if (modules.length === 0) {
    return '<div class="component-list"><div class="no-components">Нет зарегистрированных модулей</div></div>';
  }

  const modulesHtml = modules
    .map(
      module => `
      <div class="component-card module">
        <div class="component-header">
          <span class="component-icon">⚙️</span>
          <div class="component-info">
            <h3 class="component-name">${module.name}</h3>
            <span class="component-type">${module.category}</span>
          </div>
        </div>
        <div class="component-details">
          <div class="component-id"><strong>ID:</strong> ${module.id}</div>
          <div class="component-active"><strong>Активен:</strong> ${module.isActive ? 'Да' : 'Нет'}</div>
          <div class="component-registered"><strong>Зарегистрирован:</strong> ${module.registeredAt.toLocaleString('ru-RU')}</div>

          <div class="component-metadata">
            <strong>Метаданные:</strong>
            <pre>${JSON.stringify(module.metadata, null, 2)}</pre>
          </div>
        </div>
      </div>`
    )
    .join('\n');

  return `<div class="component-list">${modulesHtml}</div>`;
}

// Запуск
generateRealAnalysisPage().catch(console.error);
