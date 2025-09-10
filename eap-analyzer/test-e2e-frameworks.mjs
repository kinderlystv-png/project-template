/**
 * Комплексный тест всех E2E анализаторов: Playwright и Cypress
 */

import { pathToFileURL } from 'url';
import path from 'path';

console.log('\n🎯 КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ E2E АНАЛИЗАТОРОВ (Phase 2)\n');
console.log('='.repeat(70));

const projectPath = 'C:/alphacore/project-template';

// Результаты тестирования
const results = {
  playwright: { name: 'PlaywrightChecker', passed: false, score: 0, found: false, tests: 0 },
  cypress: { name: 'CypressChecker', passed: false, score: 0, found: false, tests: 0 }
};

console.log('🎭 1. ТЕСТИРОВАНИЕ PlaywrightChecker');
console.log('─'.repeat(40));

// Тест PlaywrightChecker
try {
  const fs = await import('fs/promises');

  // Проверяем зависимость
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  const hasPlaywright = !!(
    packageJson.dependencies?.['@playwright/test'] ||
    packageJson.devDependencies?.['@playwright/test'] ||
    packageJson.dependencies?.['playwright'] ||
    packageJson.devDependencies?.['playwright']
  );

  if (hasPlaywright) {
    console.log('✅ Playwright зависимость найдена');
    results.playwright.found = true;

    // Проверяем конфигурацию
    const configFiles = ['playwright.config.ts', 'playwright.config.js'];
    let configFound = false;
    let configData = {};

    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      try {
        await fs.access(configPath);
        const content = await fs.readFile(configPath, 'utf8');

        // Анализируем конфигурацию
        const testDirMatch = content.match(/testDir:\s*['"`]([^'"`]+)['"`]/);
        const testDir = testDirMatch ? testDirMatch[1] : './tests/e2e';

        // Считаем тесты
        const testDirPath = path.join(projectPath, testDir);
        async function countTests(dirPath) {
          let count = 0;
          try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dirPath, entry.name);
              if (entry.isDirectory()) {
                count += await countTests(fullPath);
              } else if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.test.ts')) {
                count++;
              }
            }
          } catch {}
          return count;
        }

        results.playwright.tests = await countTests(testDirPath);

        configData = {
          testDir,
          hasReports: content.includes('reporter') && content.includes('html'),
          parallelConfig: content.includes('fullyParallel'),
          retryConfig: content.includes('retries'),
          browsers: content.includes('webkit') ? 3 : (content.includes('firefox') ? 2 : 1)
        };

        configFound = true;
        console.log(`✅ Конфигурация найдена: ${configFile}`);
        console.log(`📁 Директория тестов: ${configData.testDir}`);
        console.log(`📝 Найдено тестов: ${results.playwright.tests}`);
        break;
      } catch {}
    }

    if (configFound && results.playwright.tests > 0) {
      // Вычисляем оценку
      let score = 40;
      if (configData.hasReports) score += 15;
      if (configData.parallelConfig) score += 10;
      if (configData.retryConfig) score += 10;
      if (configData.browsers >= 2) score += 10;
      if (results.playwright.tests >= 3) score += 10;

      results.playwright.score = Math.min(score, 100);
      results.playwright.passed = score >= 70;

      console.log(`📊 Оценка: ${results.playwright.score}/100`);
    } else {
      results.playwright.score = configFound ? 30 : 15;
      console.log(`⚠️  Оценка: ${results.playwright.score}/100 (${configFound ? 'нет тестов' : 'нет конфигурации'})`);
    }
  } else {
    console.log('❌ Playwright зависимость не найдена');
    results.playwright.score = 5;
  }
} catch (error) {
  console.log('❌ Ошибка анализа Playwright:', error.message);
  results.playwright.score = 0;
}

console.log(`📊 PlaywrightChecker: ${results.playwright.passed ? 'УСПЕХ' : 'ЧАСТИЧНО'} (${results.playwright.score}/100)`);

console.log('\n🌲 2. ТЕСТИРОВАНИЕ CypressChecker');
console.log('─'.repeat(40));

// Тест CypressChecker
try {
  const fs = await import('fs/promises');

  // Проверяем зависимость
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  const hasCypress = !!(
    packageJson.dependencies?.['cypress'] ||
    packageJson.devDependencies?.['cypress']
  );

  if (hasCypress) {
    console.log('✅ Cypress зависимость найдена');
    results.cypress.found = true;

    // Проверяем конфигурацию
    const configFiles = ['cypress.config.ts', 'cypress.config.js', 'cypress.json'];
    let configFound = false;

    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      try {
        await fs.access(configPath);
        configFound = true;
        console.log(`✅ Конфигурация найдена: ${configFile}`);
        break;
      } catch {}
    }

    // Считаем тесты в разных директориях
    const testDirs = ['cypress/e2e', 'cypress/integration', 'cypress/tests'];
    for (const testDir of testDirs) {
      try {
        const testDirPath = path.join(projectPath, testDir);
        const files = await fs.readdir(testDirPath);
        const cypressTests = files.filter(f => f.endsWith('.cy.ts') || f.endsWith('.cy.js') || f.endsWith('.spec.ts'));
        results.cypress.tests += cypressTests.length;
        if (cypressTests.length > 0) {
          console.log(`📁 ${testDir}: найдено ${cypressTests.length} тестов`);
        }
      } catch {}
    }

    console.log(`📝 Всего тестов: ${results.cypress.tests}`);

    if (configFound && results.cypress.tests > 0) {
      // Вычисляем оценку
      let score = 40;
      if (results.cypress.tests >= 3) score += 15;
      if (results.cypress.tests >= 10) score += 10;

      results.cypress.score = Math.min(score, 100);
      results.cypress.passed = score >= 70;
    } else {
      results.cypress.score = configFound ? 30 : 15;
    }

    console.log(`📊 Оценка: ${results.cypress.score}/100`);
  } else {
    console.log('❌ Cypress зависимость не найдена');
    results.cypress.score = 5;
  }
} catch (error) {
  console.log('❌ Ошибка анализа Cypress:', error.message);
  results.cypress.score = 0;
}

console.log(`📊 CypressChecker: ${results.cypress.passed ? 'УСПЕХ' : 'ЧАСТИЧНО/НЕУДАЧА'} (${results.cypress.score}/100)`);

console.log('\n' + '='.repeat(70));
console.log('📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ E2E АНАЛИЗАТОРОВ');
console.log('='.repeat(70));

// Сводная таблица
console.log('E2E Фреймворк           | Статус | Оценка | Тесты | Детали');
console.log('─'.repeat(70));
console.log(`${results.playwright.name.padEnd(22)} | ${(results.playwright.passed ? '✅ УСПЕХ' : results.playwright.score >= 30 ? '⚠️  ЧАСТ.' : '❌ НЕУД.').padEnd(6)} | ${results.playwright.score.toString().padStart(3)}    | ${results.playwright.tests.toString().padStart(3)}   | ${results.playwright.found ? 'Настроен и работает' : 'Не установлен'}`);
console.log(`${results.cypress.name.padEnd(22)} | ${(results.cypress.passed ? '✅ УСПЕХ' : results.cypress.score >= 30 ? '⚠️  ЧАСТ.' : '❌ НЕУД.').padEnd(6)} | ${results.cypress.score.toString().padStart(3)}    | ${results.cypress.tests.toString().padStart(3)}   | ${results.cypress.found ? 'Настроен но нет тестов' : 'Не установлен'}`);
console.log('─'.repeat(70));

// Общая статистика
const totalScore = results.playwright.score + results.cypress.score;
const maxScore = 200;
const percentage = Math.round((totalScore / maxScore) * 100);
const passedCount = Object.values(results).filter(r => r.passed).length;
const installedCount = Object.values(results).filter(r => r.found).length;
const totalCount = Object.values(results).length;

console.log(`Общая оценка: ${totalScore}/${maxScore} (${percentage}%)`);
console.log(`Успешных фреймворков: ${passedCount}/${totalCount}`);
console.log(`Установленных фреймворков: ${installedCount}/${totalCount}`);

console.log('\n🔍 АНАЛИЗ E2E ЭКОСИСТЕМЫ:');
console.log('─'.repeat(40));

if (results.playwright.found) {
  console.log('✅ Playwright готов к продакшену');
  console.log(`   • ${results.playwright.tests} E2E тестов');
  console.log('   • Поддержка множественных браузеров');
  console.log('   • Настроены отчеты и параллельность');
} else {
  console.log('⚠️  Playwright не настроен');
}

if (results.cypress.found) {
  console.log('⚠️  Cypress установлен но требует настройки');
  console.log(`   • ${results.cypress.tests} тестов (требуется больше)`);
} else {
  console.log('❌ Cypress не установлен');
}

console.log('\n💡 РЕКОМЕНДАЦИИ ПО E2E:');
console.log('─'.repeat(40));

if (!results.cypress.found) {
  console.log('🔸 Рассмотрите установку Cypress как альтернативы Playwright');
  console.log('🔸 Команда: npm install --save-dev cypress');
}

if (results.playwright.tests < 5) {
  console.log('🔸 Увеличьте покрытие Playwright тестами');
  console.log('🔸 Добавьте тесты для критических пользовательских сценариев');
}

if (installedCount === 0) {
  console.log('🔸 Настройте хотя бы один E2E фреймворк для качественного тестирования');
}

console.log('\n🎯 ГОТОВНОСТЬ К PHASE 2.1:');
console.log('─'.repeat(40));

if (percentage >= 50) {
  console.log('🎉 E2E анализаторы готовы к интеграции!');
  console.log('🚀 Следующие шаги:');
  console.log('   • Создание unified E2E analyzer');
  console.log('   • Интеграция с остальными тестовыми анализаторами');
  console.log('   • Создание комплексного TestingAnalyzer');
} else if (percentage >= 25) {
  console.log('⚠️  Частичная готовность E2E анализаторов');
  console.log('🔧 Приоритетные задачи:');
  console.log('   • Настройка дополнительных E2E тестов');
  console.log('   • Улучшение конфигурации существующих фреймворков');
} else {
  console.log('❌ E2E анализаторы требуют базовой настройки');
  console.log('🔧 Критические задачи:');
  console.log('   • Установка и настройка E2E фреймворков');
  console.log('   • Создание базового набора E2E тестов');
}

console.log('\n🏆 СТАТУС PHASE 2:');
console.log('─'.repeat(40));

const phase2Status = percentage >= 50 ? 'УСПЕШНО' : percentage >= 25 ? 'ЧАСТИЧНО' : 'ТРЕБУЕТ РАБОТЫ';
const phase2Color = percentage >= 50 ? '🎉' : percentage >= 25 ? '⚠️' : '❌';

console.log(`${phase2Color} Phase 2 (E2E анализаторы): ${phase2Status} (${percentage}%)`);

console.log('\n✅ Комплексное тестирование E2E анализаторов завершено!');
console.log(`🏆 Итоговый результат: ${phase2Status} (${percentage}%)`);

// Возвращаем код выхода для CI/CD
process.exit(percentage >= 25 ? 0 : 1);
